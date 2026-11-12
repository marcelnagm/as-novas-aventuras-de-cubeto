import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { storyMaterials } from "@/data/materials";
import { stories, type Story } from "@/data/stories";
import { shareImageInBrowser } from "@/lib/share-material";

const MAPS = [1, 2, 3, 4, 5];

function triggerTap() {
  if (Platform.OS !== "web") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function HomeScreen() {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const visibleStories = useMemo(
    () =>
      selectedMap
        ? stories.filter((story) => story.map === selectedMap)
        : stories,
    [selectedMap],
  );

  if (selectedStory) {
    return (
      <StoryPlayer
        story={selectedStory}
        onBack={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right"]}>
      <FlatList
        data={visibleStories}
        keyExtractor={(story) => story.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.catalogContent}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
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
                  setSelectedMap(null);
                }}
              />
              {MAPS.map((map) => (
                <FilterChip
                  key={map}
                  label={`Mapa ${map}`}
                  active={selectedMap === map}
                  onPress={() => {
                    triggerTap();
                    setSelectedMap(map);
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
              setSelectedStory(item);
            }}
          />
        )}
        ListFooterComponent={
          <Text style={styles.footerNote}>Mais aventuras a caminho.</Text>
        }
      />
    </ScreenContainer>
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
    <Pressable
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
    </Pressable>
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
    <Pressable
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
    </Pressable>
  );
}

function StoryPlayer({ story, onBack }: { story: Story; onBack: () => void }) {
  useKeepAwake();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const current = story.dialogues[currentIndex];
  const player = useAudioPlayer(current.audio);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

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
      if (currentIndex < story.dialogues.length - 1) {
        setCurrentIndex((value) => value + 1);
      } else {
        setIsPlaying(false);
      }
    }
  }, [
    status.currentTime,
    status.duration,
    isPlaying,
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
    <ScreenContainer className="bg-background" edges={["top", "left", "right"]}>
      <View style={styles.playerScreen}>
        <View style={styles.playerHeader}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Histórias</Text>
          </Pressable>
          <Text style={styles.playerMap}>MAPA {story.map}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.playerContent}
        >
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
            <Pressable
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
            </Pressable>
            <Pressable
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
            </Pressable>
            <Pressable
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
            </Pressable>
          </View>

          <Text style={styles.sequenceHint}>
            {isPlaying
              ? "A sequência avança sozinha ao terminar cada fala."
              : "Dê play para ouvir e acompanhar a aventura."}
          </Text>

          <StoryMaterial story={story} />

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
              <Pressable
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
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

function StoryMaterial({ story }: { story: Story }) {
  const material = storyMaterials[story.id];
  const [sharing, setSharing] = useState<string | null>(null);

  if (!material) return null;

  const share = async (key: "personagem" | "acessorios", title: string) => {
    triggerTap();
    setSharing(key);
    try {
      await shareImageInBrowser(material[key], `${story.title} - ${title}`);
    } catch {
      Alert.alert(
        "Não foi possível compartilhar",
        "Tente novamente em instantes.",
      );
    } finally {
      setSharing(null);
    }
  };

  const items = [
    {
      key: "personagem" as const,
      label: "Personagem",
      source: material.personagem,
    },
    {
      key: "acessorios" as const,
      label: "Acessórios",
      source: material.acessorios,
    },
  ];

  return (
    <View style={styles.materialSection}>
      <Text style={styles.sectionKicker}>MATERIAL DA HISTÓRIA</Text>
      <Text style={styles.materialTitle}>Personagem e acessórios</Text>
      <View style={styles.materialRow}>
        {items.map((item) => (
          <View key={item.key} style={styles.materialCard}>
            <View style={styles.materialImageBox}>
              <Image
                source={item.source}
                style={styles.materialImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.materialLabel}>{item.label}</Text>
            <Pressable
              onPress={() => share(item.key, item.label)}
              disabled={sharing !== null}
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.pressed,
                sharing !== null && styles.disabled,
              ]}
            >
              <Text style={styles.shareButtonText}>
                {sharing === item.key ? "Abrindo..." : "Compartilhar"}
              </Text>
            </Pressable>
          </View>
        ))}
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
    backgroundColor: "#0B3954",
    borderRadius: 28,
    padding: 24,
    paddingTop: 22,
    marginBottom: 28,
    overflow: "hidden",
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#8BD3DD",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 22,
  },
  heroBadgeText: {
    color: "#0B3954",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  eyebrow: {
    color: "#8BD3DD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: -1.1,
    marginTop: 2,
  },
  heroSubtitle: {
    color: "#D8F3DC",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 300,
  },
  statsRow: {
    flexDirection: "row",
    gap: 28,
    marginTop: 24,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: "#39657A",
  },
  stat: { minWidth: 58 },
  statValue: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  statLabel: { color: "#A8DADC", fontSize: 12, marginTop: 2 },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionKicker: {
    color: "#0E7490",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: -0.4,
  },
  countLabel: {
    color: "#829AB1",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  filters: { gap: 8, paddingBottom: 18 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    paddingHorizontal: 17,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: { backgroundColor: "#0E7490", borderColor: "#0E7490" },
  filterText: { color: "#486581", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#FFFFFF" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    shadowColor: "#102A43",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  cardAccent: { width: 7 },
  cardBody: { flex: 1, padding: 16 },
  cardTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMap: {
    color: "#829AB1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  playDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  playDotText: { color: "#FFFFFF", fontSize: 12, marginLeft: 2 },
  cardTitle: {
    color: "#102A43",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: 11,
  },
  cardSubtitle: { color: "#627D98", fontSize: 13, marginTop: 4 },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  cardCharacter: { color: "#334E68", fontSize: 12, fontWeight: "700", flex: 1 },
  cardCount: { color: "#829AB1", fontSize: 12, fontWeight: "700" },
  footerNote: {
    color: "#829AB1",
    fontSize: 12,
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
    paddingVertical: 6,
    paddingRight: 10,
  },
  backArrow: { color: "#0E7490", fontSize: 32, lineHeight: 28, marginRight: 4 },
  backText: { color: "#0E7490", fontWeight: "800", fontSize: 14 },
  playerMap: {
    color: "#829AB1",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.2,
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
    color: "#102A43",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 13,
    letterSpacing: -0.7,
  },
  playerSubtitle: {
    color: "#627D98",
    fontSize: 15,
    marginTop: 7,
    marginBottom: 22,
  },
  dialogueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    borderTopWidth: 5,
    padding: 20,
    shadowColor: "#102A43",
    shadowOpacity: 0.07,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  dialogueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogueStep: {
    color: "#829AB1",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  dialogueTotal: {
    color: "#9FB3C8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  speaker: { fontSize: 18, fontWeight: "900", marginTop: 17 },
  dialogueText: {
    color: "#243B53",
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "600",
    marginTop: 8,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#E6EEF4",
    borderRadius: 3,
    marginTop: 25,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  timeText: { color: "#9FB3C8", fontSize: 11, fontWeight: "700" },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  secondaryControl: { alignItems: "center", width: 72, paddingVertical: 8 },
  controlIcon: { color: "#486581", fontSize: 28, lineHeight: 26 },
  controlLabel: {
    color: "#627D98",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  mainControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 21,
    paddingVertical: 14,
    minWidth: 140,
    shadowColor: "#102A43",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  mainControlPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  mainControlIcon: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginRight: 8,
  },
  mainControlLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.72 },
  sequenceHint: {
    color: "#829AB1",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },
  materialSection: {
    marginTop: 28,
    backgroundColor: "#F5FAFC",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    padding: 18,
  },
  materialTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 3,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  materialRow: { flexDirection: "row", gap: 12 },
  materialCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EEF4",
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    backgroundColor: "#FFFFFF",
    paddingVertical: 11,
  },
  shareButtonText: { color: "#102A43", fontSize: 14, fontWeight: "800" },
  scriptSection: { marginTop: 32 },
  scriptHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 13,
  },
  scriptTitle: {
    color: "#102A43",
    fontSize: 21,
    fontWeight: "800",
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    padding: 12,
    marginBottom: 8,
  },
  scriptNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E6EEF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  scriptNumberText: { color: "#627D98", fontSize: 12, fontWeight: "900" },
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
