import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";

async function toBase64(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();

  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  return FileSystem.readAsStringAsync(asset.localUri ?? asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function buildHtml(title: string, base64: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  html,body{margin:0;background:#fff;}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}
  img{max-width:100%;height:auto;display:block;}
</style>
</head>
<body>
<img src="data:image/jpeg;base64,${base64}" alt="${escapeHtml(title)}">
</body>
</html>`;
}

/**
 * Compartilhar: monta um HTML com a imagem em base64 e abre no navegador.
 */
export async function shareImageInBrowser(moduleId: number, title: string): Promise<void> {
  const html = buildHtml(title, await toBase64(moduleId));

  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank");
    return;
  }

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  try {
    await WebBrowser.openBrowserAsync(dataUrl);
  } catch {
    await Linking.openURL(dataUrl);
  }
}
