import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const MIME_TYPE = "image/jpeg";

function toFileName(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "material"}.jpg`;
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function shareOnWeb(uri: string, title: string): Promise<void> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;

  // Menu de compartilhar do sistema, enviando o arquivo da própria imagem.
  if (nav?.share && nav.canShare) {
    try {
      const blob = await (await fetch(uri)).blob();
      const file = new File([blob], toFileName(title), { type: MIME_TYPE });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title });
        return;
      }
    } catch (error) {
      if (isAbort(error)) return;
    }
  }

  // Sem suporte a arquivos: compartilha o link da imagem, se possível.
  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(uri, { dialogTitle: title, mimeType: MIME_TYPE });
      return;
    } catch (error) {
      if (isAbort(error)) return;
    }
  }

  // Último recurso: abre a imagem em si (sem HTML), para imprimir ou salvar.
  window.open(uri, "_blank");
}

/**
 * Compartilhar: abre o menu de compartilhar/imprimir do sistema com a própria imagem.
 */
export async function shareImage(moduleId: number, title: string): Promise<void> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();

  if (Platform.OS === "web") {
    await shareOnWeb(asset.localUri ?? asset.uri, title);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }

  const source = asset.localUri ?? asset.uri;
  const target = `${FileSystem.cacheDirectory}${toFileName(title)}`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.copyAsync({ from: source, to: target });

  await Sharing.shareAsync(target, {
    mimeType: MIME_TYPE,
    UTI: "public.jpeg",
    dialogTitle: title,
  });
}
