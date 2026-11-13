import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { BouncyPressable } from "@/components/bouncy-pressable";
import { MapLightbox } from "@/components/map-lightbox";
import { ScreenContainer } from "@/components/screen-container";
import { mapImages } from "@/data/maps";
import { storyMaterials } from "@/data/materials";
import { stories, type Story } from "@/data/stories";
import { shareImage } from "@/lib/share-material";

const MAPS = [1, 2, 3, 4, 5];
const AUTOPLAY_KEY = "cubeto:autoplay";
const LAST_STORY_KEY = "cubeto:last-story";
const SELECTED_MAP_KEY = "cubeto:selected-map";
const RAINBOW = ["#FF595E", "#FF924C", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];
const CONTACT_EMAIL = "marcel.nagm@gmail.com";
const PROJECT_GITHUB = "https://github.com/marcelnagm/as-novas-aventuras-de-cubeto";

function triggerTap() {
  if (Platform.OS !== "web") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function HomeScreen() {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [restored, setRestored] = useState(false);
  const navigation = useNavigation();

  // Ao abrir o app, retoma a última história lida e o mapa que estava selecionado.
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LAST_STORY_KEY),
      AsyncStorage.getItem(SELECTED_MAP_KEY),
    ])
      .then(([id, map]) => {
        const last = id ? stories.find((story) => story.id === id) : undefined;
        if (last) setSelectedStory(last);
        const savedMap = Number(map);
        if (MAPS.includes(savedMap)) setSelectedMap(savedMap);
      })
      .catch(() => {})
      .finally(() => setRestored(true));
  }, []);

  const selectMap = (map: number | null) => {
    setSelectedMap(map);
    AsyncStorage.setItem(
      SELECTED_MAP_KEY,
      map === null ? "all" : String(map),
    ).catch(() => {});
  };

  // Tocar em "Home" com uma história aberta volta ao catálogo.
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      setSelectedStory(null);
    });
    return unsubscribe;
  }, [navigation]);

  const openStory = (story: Story) => {
    setSelectedStory(story);
    AsyncStorage.setItem(LAST_STORY_KEY, story.id).catch(() => {});
  };

  const visibleStories = useMemo(
    () =>
      selectedMap
        ? stories.filter((story) => story.map === selectedMap)
        : stories,
    [selectedMap],
  );

  if (!restored) {
    return (
      <ScreenContainer
        className="bg-[#E8F6FF]"
        style={{ backgroundColor: "#E8F6FF" }}
        edges={["top", "left", "right"]}
      />
    );
  }

  if (selectedStory) {
    return (
      <StoryPlayer
        story={selectedStory}
        onBack={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <ScreenContainer
      className="bg-[#E8F6FF]"
      style={{ backgroundColor: "#E8F6FF" }}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={visibleStories}
        keyExtractor={(story) => story.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.catalogContent}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <View style={styles.heroBlobA} />
              <View style={styles.heroBlobB} />
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>APP DE LEITURA E ÁUDIO</Text>
              </View>
              <Text style={styles.eyebrow}>AS NOVAS AVENTURAS</Text>
              <Text style={styles.heroTitle}>de Cubeto</Text>
              <Text style={styles.heroSubtitle}>
                Escolha uma história, dê o play e acompanhe cada fala junto com
                o Primo Bot.
              </Text>
              <View style={styles.statsRow}>
                <Stat value="20" label="histórias" />
                <Stat value="5" label="mapas" />
                <Stat value="173" label="falas" />
              </View>
              <View style={styles.rainbow}>
                {RAINBOW.map((color) => (
                  <View key={color} style={{ flex: 1, backgroundColor: color }} />
                ))}
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionKicker}>BIBLIOTECA</Text>
                <Text style={styles.sectionTitle}>Escolha sua aventura</Text>
              </View>
              <Text style={styles.countLabel}>
                {visibleStories.length} histórias
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              <FilterChip
                label="Todos"
                active={selectedMap === null}
                onPress={() => {
                  triggerTap();
                  selectMap(null);
                }}
              />
              {MAPS.map((map) => (
                <FilterChip
                  key={map}
                  label={`Mapa ${map}`}
                  active={selectedMap === map}
                  onPress={() => {
                    triggerTap();
                    selectMap(map);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item, index }) => (
          <StoryCard
            story={item}
            index={index}
            onPress={() => {
              triggerTap();
              openStory(item);
            }}
          />
        )}
        ListFooterComponent={
          <View>
            <ContactSection />
            <Text style={styles.footerNote}>Mais aventuras a caminho.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function ContactSection() {
  const open = (url: string) => {
    triggerTap();
    Linking.openURL(url).catch(() => {
      Alert.alert("Não foi possível abrir o link", url);
    });
  };

  return (
    <View style={styles.contactSection}>
      <Text style={styles.sectionKicker}>CONTATO</Text>
      <Text style={styles.contactTitle}>Fale com a gente</Text>
      <BouncyPressable
        onPress={() => open(`mailto:${CONTACT_EMAIL}`)}
        accessibilityRole="link"
        accessibilityLabel={`Enviar e-mail para ${CONTACT_EMAIL}`}
        style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      >
        <Text style={styles.contactLabel}>E-mail</Text>
        <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
      </BouncyPressable>
      <BouncyPressable
        onPress={() => open(PROJECT_GITHUB)}
        accessibilityRole="link"
        accessibilityLabel="Abrir o GitHub do projeto"
        style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      >
        <Text style={styles.contactLabel}>GitHub do projeto</Text>
        <Text style={styles.contactValue}>
          github.com/marcelnagm/as-novas-aventuras-de-cubeto
        </Text>
      </BouncyPressable>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <BouncyPressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </BouncyPressable>
  );
}

function StoryCard({
  story,
  index,
  onPress,
}: {
  story: Story;
  index: number;
  onPress: () => void;
}) {
  return (
    <BouncyPressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.cardAccent, { backgroundColor: story.accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopline}>
          <Text style={styles.cardMap}>
            MAPA {story.map} · HISTÓRIA {index + 1}
          </Text>
          <View style={[styles.playDot, { backgroundColor: story.accent }]}>
            <Text style={styles.playDotText}>▶</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{story.title}</Text>
        <Text style={styles.cardSubtitle}>{story.subtitle}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardCharacter}>{story.character}</Text>
          <Text style={styles.cardCount}>{story.dialogues.length} falas</Text>
        </View>
      </View>
    </BouncyPressable>
  );
}

function StoryPlayer({ story, onBack }: { story: Story; onBack: () => void }) {
  useKeepAwake();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const current = story.dialogues[currentIndex];
  const player = useAudioPlayer(current.audio);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Lembra a escolha do play automático entre histórias e aberturas do app.
  useEffect(() => {
    AsyncStorage.getItem(AUTOPLAY_KEY)
      .then((value) => {
        if (value === "off") setAutoPlay(false);
      })
      .catch(() => {});
  }, []);

  const toggleAutoPlay = (value: boolean) => {
    triggerTap();
    setAutoPlay(value);
    AsyncStorage.setItem(AUTOPLAY_KEY, value ? "on" : "off").catch(() => {});
  };

  useEffect(() => {
    player.pause();
    player.seekTo(0);
    if (isPlaying) {
      player.play();
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isPlaying || status.duration <= 0) return;
    if (status.currentTime >= status.duration - 0.12) {
      if (autoPlay && currentIndex < story.dialogues.length - 1) {
        setCurrentIndex((value) => value + 1);
      } else {
        // Play automático desligado (ou última fala): para ao fim da fala.
        setIsPlaying(false);
      }
    }
  }, [
    status.currentTime,
    status.duration,
    isPlaying,
    autoPlay,
    currentIndex,
    story.dialogues.length,
  ]);

  const progress =
    status.duration > 0 ? Math.min(status.currentTime / status.duration, 1) : 0;

  const playCurrent = () => {
    triggerTap();
    if (status.duration > 0 && status.currentTime >= status.duration - 0.1) {
      player.seekTo(0);
    }
    player.play();
    setIsPlaying(true);
  };

  const pauseCurrent = () => {
    triggerTap();
    player.pause();
    setIsPlaying(false);
  };

  const goTo = (nextIndex: number) => {
    triggerTap();
    player.pause();
    setIsPlaying(false);
    setCurrentIndex(
      Math.max(0, Math.min(nextIndex, story.dialogues.length - 1)),
    );
  };

  return (
    <ScreenContainer
      className="bg-[#E8F6FF]"
      style={{ backgroundColor: "#E8F6FF" }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.playerScreen}>
        <View style={styles.playerHeader}>
          <BouncyPressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Histórias</Text>
          </BouncyPressable>
          <Text style={styles.playerMap}>MAPA {story.map}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.playerContent}
        >
          <MapPreview map={story.map} />
          <StoryMaterial story={story} />

          <View
            style={[styles.storyPill, { backgroundColor: `${story.accent}18` }]}
          >
            <View
              style={[styles.storyPillDot, { backgroundColor: story.accent }]}
            />
            <Text style={[styles.storyPillText, { color: story.accent }]}>
              HISTÓRIA {story.id.slice(-1)}
            </Text>
          </View>
          <Text style={styles.playerTitle}>{story.title}</Text>
          <Text style={styles.playerSubtitle}>{story.subtitle}</Text>

          <View style={[styles.dialogueCard, { borderTopColor: story.accent }]}>
            <View style={styles.dialogueHeader}>
              <Text style={styles.dialogueStep}>
                FALA {String(currentIndex + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.dialogueTotal}>
                DE {String(story.dialogues.length).padStart(2, "0")}
              </Text>
            </View>
            <Text style={[styles.speaker, { color: story.accent }]}>
              {current.speaker}
            </Text>
            <Text style={styles.dialogueText}>{current.text}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: story.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatTime(status.currentTime)}
              </Text>
              <Text style={styles.timeText}>{formatTime(status.duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <BouncyPressable
              onPress={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              style={({ pressed }) => [
                styles.secondaryControl,
                currentIndex === 0 && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.controlIcon}>‹</Text>
              <Text style={styles.controlLabel}>Anterior</Text>
            </BouncyPressable>
            <BouncyPressable
              onPress={isPlaying ? pauseCurrent : playCurrent}
              style={({ pressed }) => [
                styles.mainControl,
                { backgroundColor: story.accent },
                pressed && styles.mainControlPressed,
              ]}
            >
              <Text style={styles.mainControlIcon}>
                {isPlaying ? "Ⅱ" : "▶"}
              </Text>
              <Text style={styles.mainControlLabel}>
                {isPlaying ? "Pausar" : "Ouvir fala"}
              </Text>
            </BouncyPressable>
            <BouncyPressable
              onPress={() => goTo(currentIndex + 1)}
              disabled={currentIndex === story.dialogues.length - 1}
              style={({ pressed }) => [
                styles.secondaryControl,
                currentIndex === story.dialogues.length - 1 && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.controlIcon}>›</Text>
              <Text style={styles.controlLabel}>Próxima</Text>
            </BouncyPressable>
          </View>

          <View style={styles.autoPlayRow}>
            <View style={styles.autoPlayTexts}>
              <Text style={styles.autoPlayTitle}>Play automático</Text>
              <Text style={styles.autoPlayHint}>
                {autoPlay
                  ? "Ligado: a próxima fala toca sozinha."
                  : "Desligado: o áudio para ao fim de cada fala."}
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={toggleAutoPlay}
              accessibilityLabel="Play automático dos áudios"
              trackColor={{ false: "#CBD5E1", true: story.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={styles.sequenceHint}>
            {isPlaying
              ? autoPlay
                ? "A sequência avança sozinha ao terminar cada fala."
                : "Ao terminar a fala, toque em Próxima para continuar."
              : "Dê play para ouvir e acompanhar a aventura."}
          </Text>

          <View style={styles.scriptSection}>
            <View style={styles.scriptHeadingRow}>
              <View>
                <Text style={styles.sectionKicker}>ROTEIRO</Text>
                <Text style={styles.scriptTitle}>Acompanhe a história</Text>
              </View>
              <Text style={styles.scriptCount}>
                {story.dialogues.length} falas
              </Text>
            </View>
            {story.dialogues.map((dialogue, index) => (
              <BouncyPressable
                key={dialogue.id}
                onPress={() => goTo(index)}
                style={({ pressed }) => [
                  styles.scriptRow,
                  index === currentIndex && {
                    borderColor: story.accent,
                    backgroundColor: `${story.accent}0D`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.scriptNumber,
                    index === currentIndex && { backgroundColor: story.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.scriptNumberText,
                      index === currentIndex && styles.scriptNumberTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.scriptCopy}>
                  <Text
                    style={[
                      styles.scriptSpeaker,
                      index === currentIndex && { color: story.accent },
                    ]}
                  >
                    {dialogue.speaker}
                  </Text>
                  <Text style={styles.scriptText} numberOfLines={2}>
                    {dialogue.text}
                  </Text>
                </View>
                {index === currentIndex ? (
                  <Text style={[styles.currentMark, { color: story.accent }]}>
                    ●
                  </Text>
                ) : null}
              </BouncyPressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

function MapPreview({ map }: { map: number }) {
  const [open, setOpen] = useState(false);
  const source = mapImages[map];

  if (!source) return null;

  const title = `Mapa ${map}`;
  const openMap = () => {
    triggerTap();
    setOpen(true);
  };

  return (
    <View style={styles.mapCard}>
      <BouncyPressable
        onPress={openMap}
        accessibilityRole="button"
        accessibilityLabel={`Ampliar ${title}`}
        style={({ pressed }) => [styles.mapImageBox, pressed && styles.pressed]}
      >
        <Image source={source} style={styles.mapImage} resizeMode="cover" />
      </BouncyPressable>
      <View style={styles.mapFooter}>
        <Text style={styles.mapHint}>Toque para ampliar e explorar</Text>
        <BouncyPressable
          onPress={openMap}
          accessibilityRole="button"
          style={({ pressed }) => [styles.mapOpenButton, pressed && styles.pressed]}
        >
          <Text style={styles.mapOpenText}>Abrir</Text>
        </BouncyPressable>
      </View>
      <MapLightbox
        visible={open}
        onClose={() => setOpen(false)}
        source={source}
        title={title}
      />
    </View>
  );
}

type MaterialKey = "personagem" | "acessorios";

function StoryMaterial({ story }: { story: Story }) {
  const material = storyMaterials[story.id];
  const [sharing, setSharing] = useState<MaterialKey | null>(null);

  const share = async (key: MaterialKey, title: string) => {
    const source = material?.[key];
    if (!source) return;
    triggerTap();
    setSharing(key);
    try {
      await shareImage(source, `${story.title} - ${title}`);
    } catch {
      Alert.alert(
        "Não foi possível compartilhar",
        "Tente novamente em instantes.",
      );
    } finally {
      setSharing(null);
    }
  };

  const items: { key: MaterialKey; label: string }[] = [
    { key: "personagem", label: "Personagem" },
    { key: "acessorios", label: "Acessórios" },
  ];

  return (
    <View style={styles.materialSection}>
      <Text style={styles.sectionKicker}>MATERIAL DA HISTÓRIA</Text>
      <Text style={styles.materialTitle}>Personagem e acessórios</Text>
      <View style={styles.materialRow}>
        {items.map((item) => {
          const source = material?.[item.key];
          const busy = sharing !== null;
          return (
            <View key={item.key} style={styles.materialCard}>
              <View style={styles.materialImageBox}>
                {source ? (
                  <Image
                    source={source}
                    style={styles.materialImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.materialEmpty}>Imagem em breve</Text>
                )}
              </View>
              <Text style={styles.materialLabel}>{item.label}</Text>
              <BouncyPressable
                onPress={() => share(item.key, item.label)}
                disabled={!source || busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.shareButton,
                  pressed && styles.pressed,
                  (!source || busy) && styles.disabled,
                ]}
              >
                <Text style={styles.shareButtonText}>
                  {sharing === item.key ? "Abrindo..." : "Compartilhar"}
                </Text>
              </BouncyPressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  catalogContent: { padding: 20, paddingBottom: 44 },
  hero: {
    backgroundColor: "#0AA7FD",
    borderRadius: 34,
    padding: 24,
    paddingTop: 22,
    paddingBottom: 40,
    marginBottom: 26,
    overflow: "hidden",
  },
  heroBlobA: {
    position: "absolute",
    top: -34,
    right: -26,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#19D5BC",
    opacity: 0.55,
  },
  heroBlobB: {
    position: "absolute",
    top: 70,
    right: 30,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFCA3A",
    transform: [{ rotate: "18deg" }],
    opacity: 0.9,
  },
  rainbow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
    flexDirection: "row",
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE066",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: "#0B3954",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  eyebrow: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 2,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 310,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  stat: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 64,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionKicker: {
    color: "#0A7EC2",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sectionTitle: {
    color: "#0B2A4A",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: -0.4,
  },
  countLabel: {
    color: "#4A7BA6",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  filters: { gap: 8, paddingBottom: 18 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#BFE3F8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#0AA7FD",
    borderColor: "#0780C4",
  },
  filterText: {
    color: "#2F6690",
    fontWeight: "900",
    fontSize: 15,
  },
  filterTextActive: { color: "#FFFFFF" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    marginBottom: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#BFE3F8",
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  cardAccent: {
    width: 12,
  },
  cardBody: {
    flex: 1,
    padding: 18,
  },
  cardTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMap: {
    color: "#4A7BA6",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  playDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playDotText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 3,
  },
  cardTitle: {
    color: "#0B2A4A",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    marginTop: 10,
  },
  cardSubtitle: {
    color: "#486581",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  cardCharacter: {
    color: "#0A7EC2",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  cardCount: {
    color: "#4A7BA6",
    fontSize: 13,
    fontWeight: "800",
  },
  contactSection: { marginTop: 32 },
  contactTitle: {
    color: "#0B2A4A",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
    marginBottom: 12,
  },
  contactRow: {
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#BFE3F8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 10,
  },
  contactLabel: {
    color: "#627D98",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  contactValue: { color: "#0B3954", fontSize: 15, fontWeight: "700" },
  footerNote: {
    color: "#4A7BA6",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  playerScreen: { flex: 1 },
  playerHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingLeft: 10,
    paddingRight: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#BFE3F8",
    backgroundColor: "#FFFFFF",
  },
  backArrow: {
    color: "#0A7EC2",
    fontSize: 34,
    lineHeight: 34,
    marginRight: 6,
    marginTop: -3,
  },
  backText: {
    color: "#0A7EC2",
    fontWeight: "900",
    fontSize: 16,
  },
  playerMap: {
    color: "#0A7EC2",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1.2,
    backgroundColor: "#FFE066",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  playerContent: { padding: 20, paddingTop: 6, paddingBottom: 38 },
  storyPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  storyPillDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  storyPillText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  playerTitle: {
    color: "#0B2A4A",
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 13,
    letterSpacing: -0.7,
  },
  playerSubtitle: {
    color: "#486581",
    fontSize: 16,
    marginTop: 7,
    marginBottom: 22,
  },
  dialogueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#BFE3F8",
    borderTopWidth: 9,
    borderBottomWidth: 5,
    padding: 22,
  },
  dialogueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogueStep: {
    color: "#4A7BA6",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  dialogueTotal: {
    color: "#7FA7C9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  speaker: {
    fontSize: 21,
    fontWeight: "900",
    marginTop: 16,
  },
  dialogueText: {
    color: "#102A43",
    fontSize: 22,
    lineHeight: 34,
    fontWeight: "700",
    marginTop: 8,
  },
  progressTrack: {
    height: 14,
    backgroundColor: "#D9EEFB",
    borderRadius: 7,
    marginTop: 25,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  timeText: {
    color: "#7FA7C9",
    fontSize: 12,
    fontWeight: "800",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  secondaryControl: {
    alignItems: "center",
    width: 78,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#BFE3F8",
    backgroundColor: "#FFFFFF",
  },
  controlIcon: {
    color: "#0A7EC2",
    fontSize: 32,
    lineHeight: 30,
  },
  controlLabel: {
    color: "#486581",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  mainControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderBottomWidth: 6,
    borderBottomColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 26,
    paddingVertical: 18,
    minWidth: 156,
  },
  mainControlPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  mainControlIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 9,
  },
  mainControlLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.72 },
  sequenceHint: {
    color: "#829AB1",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },
  autoPlayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#BFE3F8",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  autoPlayTexts: { flex: 1 },
  autoPlayTitle: {
    color: "#0B2A4A",
    fontSize: 16,
    fontWeight: "900",
  },
  autoPlayHint: { color: "#627D98", fontSize: 12, fontWeight: "600", marginTop: 2 },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#BFE3F8",
    padding: 12,
    marginBottom: 20,
  },
  mapImageBox: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#DCEBF2",
  },
  mapImage: { width: "100%", height: "100%" },
  mapFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  mapHint: { flex: 1, color: "#102A43", fontSize: 14, fontWeight: "700" },
  mapOpenButton: {
    borderRadius: 999,
    backgroundColor: "#0AA7FD",
    paddingHorizontal: 22,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: "center",
  },
  mapOpenText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  materialEmpty: { color: "#829AB1", fontSize: 13, fontWeight: "700", textAlign: "center" },
  materialSection: {
    marginTop: 28,
    backgroundColor: "#FFF6CC",
    borderRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#FFE066",
    padding: 18,
  },
  materialTitle: {
    color: "#0B2A4A",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  materialRow: { flexDirection: "row", gap: 12 },
  materialCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FFE066",
    padding: 12,
    alignItems: "center",
  },
  materialImageBox: {
    width: "100%",
    aspectRatio: 0.85,
    alignItems: "center",
    justifyContent: "center",
  },
  materialImage: { width: "100%", height: "100%" },
  materialLabel: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
  },
  shareButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#FF924C",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.2)",
    paddingVertical: 11,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  scriptSection: { marginTop: 32 },
  scriptHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 13,
  },
  scriptTitle: {
    color: "#0B2A4A",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  scriptCount: {
    color: "#829AB1",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  scriptRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#BFE3F8",
    padding: 14,
    marginBottom: 10,
  },
  scriptNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#D9EEFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scriptNumberText: {
    color: "#2F6690",
    fontSize: 14,
    fontWeight: "900",
  },
  scriptNumberTextActive: { color: "#FFFFFF" },
  scriptCopy: { flex: 1 },
  scriptSpeaker: {
    color: "#486581",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
  },
  scriptText: { color: "#627D98", fontSize: 13, lineHeight: 19 },
  currentMark: { fontSize: 11, marginLeft: 8, marginTop: 6 },
});
