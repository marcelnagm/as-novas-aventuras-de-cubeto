import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_TAP_MS = 280;
const TAP_SLOP = 8;

type Transform = { scale: number; tx: number; ty: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Lightbox em tela cheia com zoom (pinça, toque duplo, botões +/−) e arraste (pan).
 * Usa apenas PanResponder do React Native, então funciona igual em Android, iOS e web.
 */
export function MapLightbox({
  visible,
  onClose,
  source,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  source: ImageSourcePropType;
  title: string;
}) {
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [t, setT] = useState<Transform>({ scale: 1, tx: 0, ty: 0 });

  const boxRef = useRef(box);
  const cur = useRef<Transform>(t);
  const base = useRef({ n: 0, x: 0, y: 0, d: 0, scale: 1, tx: 0, ty: 0 });
  const tap = useRef({ time: 0, x: 0, y: 0, moved: false });
  boxRef.current = box;

  const size = Math.min(box.w, box.h);

  const apply = useCallback((scale: number, tx: number, ty: number) => {
    const { w, h } = boxRef.current;
    const side = Math.min(w, h);
    const s = clamp(scale, MIN_SCALE, MAX_SCALE);
    const maxX = Math.max(0, (side * s - w) / 2);
    const maxY = Math.max(0, (side * s - h) / 2);
    const next = { scale: s, tx: clamp(tx, -maxX, maxX), ty: clamp(ty, -maxY, maxY) };
    cur.current = next;
    setT(next);
  }, []);

  const reset = useCallback(() => apply(1, 0, 0), [apply]);

  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  // Mantém o ponto sob os dedos fixo enquanto o zoom muda.
  const zoomAbout = useCallback(
    (fromScale: number, fromTx: number, fromTy: number, toScale: number, px: number, py: number) => {
      const { w, h } = boxRef.current;
      const ux = (px - w / 2 - fromTx) / fromScale;
      const uy = (py - h / 2 - fromTy) / fromScale;
      apply(toScale, px - w / 2 - toScale * ux, py - h / 2 - toScale * uy);
    },
    [apply],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const p = e.nativeEvent.touches[0] ?? e.nativeEvent;
          tap.current.moved = false;
          tap.current.x = p.locationX;
          tap.current.y = p.locationY;
          base.current.n = 0; // força recalcular a base no primeiro movimento
        },
        onPanResponderMove: (e) => {
          const touches = e.nativeEvent.touches;
          if (!touches || touches.length === 0) return;
          const n = Math.min(touches.length, 2);
          const a = touches[0];
          const b = touches[1];
          const cx = n === 2 ? (a.locationX + b.locationX) / 2 : a.locationX;
          const cy = n === 2 ? (a.locationY + b.locationY) / 2 : a.locationY;
          const d = n === 2 ? Math.hypot(a.locationX - b.locationX, a.locationY - b.locationY) : 0;

          if (Math.hypot(cx - tap.current.x, cy - tap.current.y) > TAP_SLOP || n === 2) {
            tap.current.moved = true;
          }

          // Mudou a quantidade de dedos: recomeça a medição sem "pular".
          if (n !== base.current.n) {
            base.current = { n, x: cx, y: cy, d, ...cur.current };
            return;
          }

          const { w, h } = boxRef.current;
          const b0 = base.current;
          const scale = n === 2 && b0.d > 0 ? clamp((b0.scale * d) / b0.d, MIN_SCALE, MAX_SCALE) : b0.scale;
          const ux = (b0.x - w / 2 - b0.tx) / b0.scale;
          const uy = (b0.y - h / 2 - b0.ty) / b0.scale;
          apply(scale, cx - w / 2 - scale * ux, cy - h / 2 - scale * uy);
        },
        onPanResponderRelease: () => {
          if (tap.current.moved) return;
          const now = Date.now();
          if (now - tap.current.time < DOUBLE_TAP_MS) {
            const c = cur.current;
            const target = c.scale > 1.5 ? 1 : 2.5;
            zoomAbout(c.scale, c.tx, c.ty, target, tap.current.x, tap.current.y);
            tap.current.time = 0;
          } else {
            tap.current.time = now;
          }
        },
      }),
    [apply, zoomAbout],
  );

  const zoomBy = (factor: number) => {
    const c = cur.current;
    const { w, h } = boxRef.current;
    zoomAbout(c.scale, c.tx, c.ty, c.scale * factor, w / 2, h / 2);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={["portrait", "landscape"]}
    >
      <View style={styles.backdrop}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar mapa"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>Fechar ✕</Text>
          </Pressable>
        </View>

        <View style={styles.stage} onLayout={onLayout} {...responder.panHandlers}>
          {size > 0 ? (
            <View
              pointerEvents="none"
              style={{
                width: size,
                height: size,
                transform: [{ translateX: t.tx }, { translateY: t.ty }, { scale: t.scale }],
              }}
            >
              <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <Text style={styles.hint}>
            {Platform.OS === "web"
              ? "Use + e − para zoom e arraste para mover"
              : "Pinça ou toque duplo para zoom · arraste para mover"}
          </Text>
          <View style={styles.zoomRow}>
            <ZoomButton label="−" onPress={() => zoomBy(1 / 1.6)} disabled={t.scale <= MIN_SCALE + 0.01} />
            <ZoomButton label="Reiniciar" onPress={reset} wide />
            <ZoomButton label="+" onPress={() => zoomBy(1.6)} disabled={t.scale >= MAX_SCALE - 0.01} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ZoomButton({
  label,
  onPress,
  disabled,
  wide,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.zoomButton,
        wide && styles.zoomButtonWide,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.zoomText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(6, 14, 24, 0.96)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", flex: 1, marginRight: 12 },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  closeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  footer: { paddingHorizontal: 18, paddingTop: 10, alignItems: "center" },
  hint: { color: "#9FB3C8", fontSize: 12, fontWeight: "600", marginBottom: 10, textAlign: "center" },
  zoomRow: { flexDirection: "row", gap: 12 },
  zoomButton: {
    minWidth: 54,
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  zoomButtonWide: { minWidth: 110 },
  zoomText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
});
