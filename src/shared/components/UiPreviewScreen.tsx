/**
 * amphiHub – interactive UI prototype, "Stationery, green and orange".
 * One file, no theme imports, local mock data only. Save as src/app/index.tsx.
 *
 * Install once:
 *   npx expo install expo-linear-gradient @expo-google-fonts/nunito
 *
 * What it keeps from the stationery direction: the coverage grid, ruled rows, stamps for
 * verification, underline fields, the red-pen margin note, the dock with search always in reach.
 * What it takes from the other prototype: the hero, the quick-access tiles, the file-like icons,
 * the "tout ce qu'il te faut" block and the profile page.
 * Colours come from the logo: deep green, light green, orange. The old highlighter yellow is now orange.
 * Brand meaning: orange = selected / you are here, green = actions, red pen = a correction exists,
 * blue ink = checked source.
 *
 * Alive: pressed things sink and spring back, finished actions shake the part that changed,
 * achievements burst with confetti. Reanimated 4 only (no extra packages for motion).
 */
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useToast } from "../toast/useToast";

type IconName = ComponentProps<typeof Ionicons>["name"];

/* ------------------------------------------------------------------ */
/* Fonts and palette (local to this file)                              */
/* ------------------------------------------------------------------ */

const F = {
  reg: "Nunito_400Regular",
  semi: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  xbold: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
} as const;

const LIGHT = {
  paper: "#FCF9F4",
  sheet: "#FFFFFF",
  ink: "#0B2B20",
  muted: "#58695F",
  line: "#E6E7DC",
  green: "#145A46",
  greenDark: "#0A3F33",
  greenLight: "#3A7E66",
  greenSoft: "#E1F0E8",
  orange: "#F0A01E",
  orangeText: "#A35F00",
  orangeSoft: "#FDEFD2",
  onOrange: "#0B2B20",
  red: "#D93A4B",
  redSoft: "#FCE5E8",
  blue: "#2347C9",
  blueSoft: "#E4E9FB",
  primaryBg: "#145A46",
  primaryFg: "#FFFFFF",
  board: "#0A3F33",
  onBoard: "#F4FAF6",
  onBoardMuted: "#9CC3B3",
  snackBg: "#0A3F33",
  snackFg: "#F4FAF6",
  snackAction: "#F0A01E",
  scrim: "rgba(10,43,32,0.55)",
};

type Palette = typeof LIGHT;

const DARK: Palette = {
  paper: "#0A2018",
  sheet: "#102F24",
  ink: "#EEF4EF",
  muted: "#9DB3A8",
  line: "#22493A",
  green: "#4CC49A",
  greenDark: "#06160F",
  greenLight: "#7BD8B5",
  greenSoft: "#12392B",
  orange: "#F5B13A",
  orangeText: "#F5B13A",
  orangeSoft: "#3A2A0E",
  onOrange: "#0B2B20",
  red: "#FF7A88",
  redSoft: "#3A1F26",
  blue: "#8FA7FF",
  blueSoft: "#1B2A5C",
  primaryBg: "#4CC49A",
  primaryFg: "#06231A",
  board: "#06160F",
  onBoard: "#F4FAF6",
  onBoardMuted: "#7FA393",
  snackBg: "#EEF4EF",
  snackFg: "#0B2B20",
  snackAction: "#145A46",
  scrim: "rgba(0,0,0,0.6)",
};

const WHITE = "#FFFFFF";
const HERO_COLORS = ["#0A3F33", "#145A46", "#2F8A68"] as const;

function usePalette(): Palette {
  return useColorScheme() === "dark" ? DARK : LIGHT;
}

function useStyles() {
  const p = usePalette();
  return { p, s: createStyles(p) };
}

/* ------------------------------------------------------------------ */
/* Types and sample data                                               */
/* ------------------------------------------------------------------ */

type Tab = "Accueil" | "Explorer" | "Enregistrés" | "Profil";
type Group = "Tous" | "Anciens sujets" | "Corrections" | "Cours" | "TD / TP";
type Kind = "Examen" | "Contrôle" | "Correction" | "Cours" | "TD" | "TP";
type StampKind =
  | "community"
  | "metadata"
  | "source"
  | "official"
  | "correction"
  | "ai";
type Cell = "none" | "paper" | "both";
type ToastKind = "success" | "error" | "info";
type Route =
  | { name: "tabs" }
  | { name: "course"; code: string }
  | { name: "detail"; id: string }
  | { name: "contribute" }
  | { name: "kit" };

interface Resource {
  id: string;
  title: string;
  code: string;
  yearShort: string;
  yearRange: string;
  kind: Kind;
  group: Exclude<Group, "Tous">;
  session?: string;
  size: string;
  pages: number;
  correction: boolean;
  stamps: StampKind[];
  university: string;
}

const COURSES: Record<string, string> = {
  "INF 201": "Algorithmique et structures de données",
  "INF 232": "Bases de données",
  "INF 301": "Réseaux informatiques",
  "MAT 102": "Analyse 2",
  "PHY 105": "Optique géométrique",
};

const RESOURCES: Resource[] = [
  {
    id: "r1",
    title: "Algorithmique, examen final",
    code: "INF 201",
    yearShort: "2024",
    yearRange: "2023-2024",
    kind: "Examen",
    group: "Anciens sujets",
    session: "Session normale",
    size: "1,2 Mo",
    pages: 4,
    correction: true,
    stamps: ["source", "metadata", "correction"],
    university: "Université de Dschang",
  },
  {
    id: "r2",
    title: "Algorithmique, examen de rattrapage",
    code: "INF 201",
    yearShort: "2023",
    yearRange: "2022-2023",
    kind: "Examen",
    group: "Anciens sujets",
    session: "Rattrapage",
    size: "980 Ko",
    pages: 4,
    correction: true,
    stamps: ["metadata", "correction"],
    university: "Université de Dschang",
  },
  {
    id: "r3",
    title: "TD n°2 : arbres et graphes",
    code: "INF 201",
    yearShort: "2023",
    yearRange: "2022-2023",
    kind: "TD",
    group: "TD / TP",
    size: "1,6 Mo",
    pages: 5,
    correction: false,
    stamps: ["community"],
    university: "Université de Dschang",
  },
  {
    id: "r4",
    title: "Bases de données, TD n°3 : jointures",
    code: "INF 232",
    yearShort: "2024",
    yearRange: "2023-2024",
    kind: "TD",
    group: "TD / TP",
    size: "2,4 Mo",
    pages: 6,
    correction: true,
    stamps: ["metadata"],
    university: "Université de Douala",
  },
  {
    id: "r5",
    title: "Bases de données, examen final",
    code: "INF 232",
    yearShort: "2023",
    yearRange: "2022-2023",
    kind: "Examen",
    group: "Anciens sujets",
    session: "Session normale",
    size: "1,1 Mo",
    pages: 3,
    correction: true,
    stamps: ["source", "metadata"],
    university: "Université de Douala",
  },
  {
    id: "r6",
    title: "Analyse 2, contrôle continu",
    code: "MAT 102",
    yearShort: "2023",
    yearRange: "2022-2023",
    kind: "Contrôle",
    group: "Anciens sujets",
    session: "Rattrapage",
    size: "860 Ko",
    pages: 3,
    correction: false,
    stamps: ["community"],
    university: "Université de Douala",
  },
  {
    id: "r7",
    title: "Correction : Analyse 2, examen",
    code: "MAT 102",
    yearShort: "2022",
    yearRange: "2021-2022",
    kind: "Correction",
    group: "Corrections",
    size: "2,0 Mo",
    pages: 8,
    correction: true,
    stamps: ["community"],
    university: "Université de Douala",
  },
  {
    id: "r8",
    title: "Optique géométrique, compte rendu de TP",
    code: "PHY 105",
    yearShort: "2022",
    yearRange: "2021-2022",
    kind: "TP",
    group: "TD / TP",
    size: "3,1 Mo",
    pages: 8,
    correction: false,
    stamps: ["official", "metadata"],
    university: "Université de Dschang",
  },
  {
    id: "r9",
    title: "Introduction aux réseaux, notes de cours",
    code: "INF 301",
    yearShort: "Cours",
    yearRange: "Notes de cours",
    kind: "Cours",
    group: "Cours",
    size: "4,8 Mo",
    pages: 22,
    correction: false,
    stamps: ["source"],
    university: "Université de Douala",
  },
];

const YEARS = ["2024", "2023", "2022", "2021", "2020"];
const MATRIX: { code: string; cells: Cell[] }[] = [
  { code: "INF 201", cells: ["both", "both", "paper", "both", "none"] },
  { code: "INF 232", cells: ["paper", "both", "both", "none", "none"] },
  { code: "MAT 102", cells: ["none", "paper", "both", "paper", "paper"] },
  { code: "PHY 105", cells: ["none", "none", "paper", "none", "both"] },
];

const FILTERS: Group[] = [
  "Tous",
  "Anciens sujets",
  "Corrections",
  "Cours",
  "TD / TP",
];

const TABS: { key: Tab; outline: IconName; filled: IconName }[] = [
  { key: "Accueil", outline: "home-outline", filled: "home" },
  { key: "Explorer", outline: "compass-outline", filled: "compass" },
  { key: "Enregistrés", outline: "bookmark-outline", filled: "bookmark" },
  { key: "Profil", outline: "person-outline", filled: "person" },
];

/* ------------------------------------------------------------------ */
/* App context                                                         */
/* ------------------------------------------------------------------ */

interface AppContextValue {
  tab: Tab;
  goTab: (tab: Tab) => void;
  open: (route: Route) => void;
  back: () => void;
  query: string;
  setQuery: (value: string) => void;
  group: Group;
  setGroup: (group: Group) => void;
  saved: string[];
  toggleSaved: (id: string) => boolean;
  downloaded: string[];
  markDownloaded: (id: string) => void;
  notify: (message: string, kind?: ToastKind, action?: string) => void;
  celebrate: (label: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppContext missing");
  return value;
}

/* ------------------------------------------------------------------ */
/* Motion primitives                                                   */
/* ------------------------------------------------------------------ */

const APressable = Animated.createAnimatedComponent(Pressable);

/** Anything pressable sinks a little and springs back with a small overshoot. */
function Pressy({
  children,
  onPress,
  style,
  disabled,
  depth = 0.97,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  depth?: number;
  label?: string;
}) {
  const t = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - t.value * (1 - depth) }, { translateY: t.value }],
  }));
  return (
    <APressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => {
        t.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        t.value = withSpring(0, { damping: 7, stiffness: 320 });
      }}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
}

/** Plain text links only dim when pressed. No movement on text. */
function Tap({
  children,
  onPress,
  style,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.55 }]}
    >
      {children}
    </Pressable>
  );
}

function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  const shake = () => {
    x.value = withSequence(
      withTiming(-6, { duration: 45 }),
      withRepeat(withTiming(6, { duration: 80 }), 3, true),
      withTiming(0, { duration: 45 }),
    );
  };
  return { style, shake };
}

function usePop() {
  const v = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  const pop = () => {
    v.value = withSequence(
      withTiming(1.4, { duration: 110 }),
      withSpring(1, { damping: 5, stiffness: 260 }),
    );
  };
  return { style, pop };
}

const CONFETTI = [
  "#145A46",
  "#F0A01E",
  "#3A7E66",
  "#FFC857",
  "#0A3F33",
  "#F7D9A0",
];

function Piece({ i, n }: { i: number; n: number }) {
  const t = useSharedValue(0);
  const angle = (i / n) * Math.PI * 2 + (i % 3) * 0.2;
  const dist = 90 + ((i * 37) % 90);
  const size = 7 + (i % 4) * 2;
  useEffect(() => {
    t.value = withDelay(
      (i % 5) * 20,
      withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }),
    );
  }, [t, i]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * t.value,
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      {
        translateY:
          Math.sin(angle) * dist * t.value -
          30 * t.value +
          70 * t.value * t.value,
      },
      { rotate: `${t.value * (180 + i * 40)}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size * 0.55,
          borderRadius: 2,
          backgroundColor: CONFETTI[i % CONFETTI.length],
        },
        style,
      ]}
    />
  );
}

function Celebration({ label }: { label: string }) {
  const { p, s } = useStyles();
  return (
    <View style={s.celebrate}>
      <View style={s.celebrateCenter}>
        {Array.from({ length: 22 }, (_, i) => (
          <Piece key={i} i={i} n={22} />
        ))}
        <Animated.View
          entering={ZoomIn.springify().damping(9)}
          exiting={FadeOut.duration(250)}
          style={s.badge}
        >
          <View style={s.badgeCircle}>
            <Ionicons name="checkmark" size={32} color={p.onOrange} />
          </View>
          <Text style={s.badgeTitle}>Bravo !</Text>
          <Text style={s.badgeText}>{label}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function typeAccent(kind: Kind, p: Palette) {
  const map: Record<Kind, { fg: string; bg: string }> = {
    Examen: { fg: p.green, bg: p.greenSoft },
    Contrôle: { fg: p.green, bg: p.greenSoft },
    Correction: { fg: p.red, bg: p.redSoft },
    Cours: { fg: p.orangeText, bg: p.orangeSoft },
    TD: { fg: p.blue, bg: p.blueSoft },
    TP: { fg: p.blue, bg: p.blueSoft },
  };
  return map[kind];
}

function stampConfig(kind: StampKind, p: Palette) {
  const map: Record<
    StampKind,
    { label: string; icon: IconName; color: string; dashed?: boolean }
  > = {
    community: { label: "Non vérifié", icon: "people-outline", color: p.muted },
    metadata: {
      label: "Infos relues",
      icon: "checkmark-done-outline",
      color: p.blue,
    },
    source: { label: "Source confirmée", icon: "link-outline", color: p.blue },
    official: {
      label: "Source officielle",
      icon: "shield-checkmark-outline",
      color: p.green,
    },
    correction: {
      label: "Correction relue",
      icon: "create-outline",
      color: p.red,
    },
    ai: {
      label: "Généré par IA",
      icon: "sparkles-outline",
      color: p.muted,
      dashed: true,
    },
  };
  return map[kind];
}

function Stamp({ kind }: { kind: StampKind }) {
  const { p, s } = useStyles();
  const cfg = stampConfig(kind, p);
  return (
    <View
      style={[
        s.stamp,
        {
          borderColor: cfg.color,
          borderStyle: cfg.dashed ? "dashed" : "solid",
        },
      ]}
    >
      <Ionicons name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[s.stampText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function Marker({ children }: { children: ReactNode }) {
  const { s } = useStyles();
  return <View style={s.marker}>{children}</View>;
}

function Tag({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { s } = useStyles();
  return (
    <Pressy onPress={onPress} style={[s.tag, selected && s.tagOn]} depth={0.93}>
      <Text style={[s.tagText, selected && s.tagTextOn]}>{label}</Text>
    </Pressy>
  );
}

type BtnKind = "primary" | "orange" | "outline" | "danger" | "text";

function Btn({
  label,
  kind = "primary",
  icon,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  kind?: BtnKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { p, s } = useStyles();
  const look = {
    primary: { bg: p.primaryBg, fg: p.primaryFg, border: p.primaryBg },
    orange: { bg: p.orange, fg: p.onOrange, border: p.orange },
    outline: { bg: "transparent", fg: p.ink, border: p.ink },
    danger: { bg: p.red, fg: WHITE, border: p.red },
    text: { bg: "transparent", fg: p.green, border: "transparent" },
  }[kind];
  if (kind === "text") {
    return (
      <Tap onPress={onPress} style={s.btnText}>
        <Text style={[s.btnLabel, s.btnLabelUnderline, { color: p.green }]}>
          {label}
        </Text>
      </Tap>
    );
  }
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        {
          backgroundColor: disabled ? p.line : look.bg,
          borderColor: disabled ? p.line : look.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={look.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={19} color={look.fg} />
      ) : null}
      <Text style={[s.btnLabel, { color: disabled ? p.muted : look.fg }]}>
        {label}
      </Text>
    </Pressy>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { s } = useStyles();
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.heading}>{title}</Text>
      {action ? (
        <Tap onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </Tap>
      ) : null}
    </View>
  );
}

function FileTile({ resource }: { resource: Resource }) {
  const { p, s } = useStyles();
  const accent = typeAccent(resource.kind, p);
  return (
    <View style={[s.fileTile, { backgroundColor: accent.bg }]}>
      <Text style={[s.fileYear, { color: accent.fg }]}>
        {resource.yearShort}
      </Text>
      <View style={[s.fileLine, { backgroundColor: accent.fg }]} />
      <View style={[s.fileLineShort, { backgroundColor: accent.fg }]} />
      <View style={s.pdfBadge}>
        <Text style={s.pdfBadgeText}>PDF</Text>
      </View>
      {resource.correction ? (
        <View style={s.penDot}>
          <Ionicons name="checkmark" size={11} color={WHITE} />
        </View>
      ) : null}
    </View>
  );
}

function BlankSheet() {
  const { s } = useStyles();
  const { style, shake } = useShake();
  return (
    <Pressy onPress={shake} depth={0.97}>
      <Animated.View style={[s.blank, style]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={s.blankLine} />
        ))}
        <View style={s.blankCircle} />
      </Animated.View>
    </Pressy>
  );
}

function SaveButton({ id, onSaved }: { id: string; onSaved?: () => void }) {
  const { p, s } = useStyles();
  const { saved, toggleSaved, notify } = useApp();
  const { style, pop } = usePop();
  const isSaved = saved.includes(id);
  return (
    <Pressy
      label={isSaved ? "Retirer des enregistrés" : "Enregistrer"}
      onPress={() => {
        const now = toggleSaved(id);
        pop();
        if (now) onSaved?.();
        notify(
          now ? "Ajouté à ta bibliothèque." : "Retiré de ta bibliothèque.",
          now ? "success" : "info",
        );
      }}
      style={s.saveBtn}
    >
      <Animated.View style={style}>
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={22}
          color={isSaved ? p.orange : p.muted}
        />
      </Animated.View>
    </Pressy>
  );
}

function PaperRow({ item }: { item: Resource }) {
  const { p, s } = useStyles();
  const { open, downloaded } = useApp();
  const { style, shake } = useShake();
  const isOffline = downloaded.includes(item.id);
  return (
    <Animated.View style={style}>
      <Pressy
        onPress={() => open({ name: "detail", id: item.id })}
        style={s.paperRow}
        depth={0.98}
      >
        <FileTile resource={item} />
        <View style={s.flex}>
          <Text style={s.paperKicker}>
            {item.kind}, {item.yearRange}
          </Text>
          <Text style={s.paperTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.paperMeta}>
            {item.code}
            {item.session ? `, ${item.session}` : ""}
          </Text>
          <View style={s.stampRow}>
            {item.stamps.map((k) => (
              <Stamp key={k} kind={k} />
            ))}
          </View>
          <View style={s.paperFoot}>
            <Text style={s.caption}>
              {item.size}, {item.pages} pages
            </Text>
            <View style={s.flex} />
            <Ionicons
              name={isOffline ? "checkmark-circle" : "cloud-outline"}
              size={18}
              color={isOffline ? p.green : p.muted}
            />
          </View>
        </View>
        <SaveButton id={item.id} onSaved={shake} />
      </Pressy>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const { goTab } = useApp();
  const { s } = useStyles();
  const bob = useSharedValue(0);
  const toast = useToast();
  useEffect(() => {
    bob.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bob]);
  const bobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -5 * bob.value },
      { rotate: `${-1.5 + 3 * bob.value}deg` },
    ],
  }));
  return (
    <>
      <LinearGradient
        colors={HERO_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.heroDecorOne} />
        <View style={s.heroDecorTwo} />
        <View style={s.heroContent}>
          <View style={s.eyebrow}>
            <View style={s.eyebrowDot} />
            <Text style={s.eyebrowText}>Ta réussite commence ici</Text>
          </View>
          <Text style={s.heroTitle}>Révise mieux.{"\n"}Va plus loin.</Text>
          <Text style={s.heroDescription}>
            Les ressources de ton campus, réunies au même endroit.
          </Text>
          <Pressy
            onPress={() =>
              toast.error("Here are the resources for your campus")
            }
            style={s.heroButton}
          >
            <Text style={s.heroButtonText}>Explorer les ressources</Text>
            <Ionicons name="arrow-forward" size={17} color={LIGHT.greenDark} />
          </Pressy>
        </View>
        <Animated.View style={[s.heroArt, bobStyle]}>
          <View style={s.bookBack} />
          <View style={s.bookFront}>
            <View style={s.bookSpine} />
            <View style={s.bookLine} />
            <View style={s.bookLineShort} />
            <View style={s.bookLine} />
            <View style={s.bookLineShort} />
          </View>
          <View style={s.heroFloat}>
            <Ionicons name="checkmark" size={16} color={LIGHT.green} />
          </View>
        </Animated.View>
      </LinearGradient>
    </>
  );
}

function CampusChip() {
  const { goTab } = useApp();
  const { p, s } = useStyles();
  return (
    <View style={s.campus}>
      <View style={s.campusIcon}>
        <Ionicons name="school-outline" size={20} color={p.green} />
      </View>
      <View style={s.flex}>
        <Text style={s.campusLabel}>Ton espace académique</Text>
        <Text style={s.campusValue}>
          Université de Douala<Text style={s.campusLevel}>, niveau 2</Text>
        </Text>
      </View>
      <Tap onPress={() => goTab("Profil")} style={s.campusButton}>
        <Text style={s.campusButtonText}>Modifier</Text>
      </Tap>
    </View>
  );
}

function StudyFocus() {
  const { s } = useStyles();
  return (
    <View style={s.focus}>
      <View style={s.focusCopy}>
        <Text style={s.focusEyebrow}>Pour tes révisions</Text>
        <Text style={s.focusTitle}>
          Tout ce qu’il te faut, au même endroit.
        </Text>
        <Text style={s.focusCaption}>
          Sujets, corrections et supports de cours.
        </Text>
      </View>
      <View style={s.focusArt}>
        <View style={s.focusPaper}>
          <View style={s.focusLine} />
          <View style={s.focusLineShort} />
          <View style={s.focusLine} />
          <View style={s.focusCheck}>
            <Ionicons name="checkmark" size={14} color={WHITE} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CoverageCell({
  value,
  code,
  year,
  picked,
}: {
  value: Cell;
  code: string;
  year: string;
  picked?: boolean;
}) {
  const { s } = useStyles();
  const { open, notify } = useApp();
  const { style, shake } = useShake();
  const target = RESOURCES.find((r) => r.code === code && r.yearShort === year);
  return (
    <Pressy
      label={`${code}, ${year}`}
      onPress={() => {
        if (value === "none") {
          shake();
          notify(
            `Pas encore de sujet ${year} pour ${code}.`,
            "info",
            "Demander",
          );
        } else if (target) {
          open({ name: "detail", id: target.id });
        } else {
          notify(`Sujet ${year} de ${code} bientôt disponible.`, "info");
        }
      }}
      style={[s.cell, picked && s.cellPicked]}
      depth={0.85}
    >
      <Animated.View style={style}>
        {value === "none" ? <View style={s.dash} /> : null}
        {value === "paper" ? <View style={s.dot} /> : null}
        {value === "both" ? (
          <View style={s.ring}>
            <View style={s.dot} />
          </View>
        ) : null}
      </Animated.View>
    </Pressy>
  );
}

function CoverageGrid() {
  const { s } = useStyles();
  const { open } = useApp();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={s.gridRow}>
          <View style={s.gridLead} />
          {YEARS.map((y) => (
            <Text key={y} style={s.gridYear}>
              {y}
            </Text>
          ))}
        </View>
        {MATRIX.map((row, r) => (
          <View key={row.code} style={s.gridRow}>
            <Tap
              onPress={() => open({ name: "course", code: row.code })}
              style={s.gridLead}
            >
              <Text style={s.gridCode}>{row.code}</Text>
              <Text style={s.gridName} numberOfLines={1}>
                {COURSES[row.code]}
              </Text>
            </Tap>
            {row.cells.map((c, i) => (
              <CoverageCell
                key={YEARS[i]}
                value={c}
                code={row.code}
                year={YEARS[i]}
                picked={r === 0 && i === 0}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Legend() {
  const { s } = useStyles();
  return (
    <View style={s.legend}>
      <View style={s.legendItem}>
        <View style={s.dotSmall} />
        <Text style={s.caption}>Sujet</Text>
      </View>
      <View style={s.legendItem}>
        <View style={s.ringSmall}>
          <View style={s.dotSmall} />
        </View>
        <Text style={s.caption}>Sujet et correction</Text>
      </View>
      <View style={s.legendItem}>
        <View style={s.dashSmall} />
        <Text style={s.caption}>Absent</Text>
      </View>
    </View>
  );
}

function Tile({
  icon,
  title,
  sub,
  count,
  fg,
  bg,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub: string;
  count: string;
  fg: string;
  bg: string;
  onPress: () => void;
}) {
  const { s } = useStyles();
  return (
    <View style={s.tileWrap}>
      <Pressy onPress={onPress} style={s.tile} depth={0.95}>
        <View style={[s.tileIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={25} color={fg} />
        </View>
        <View style={[s.tileArrow, { backgroundColor: bg }]}>
          <Ionicons name="arrow-forward" size={15} color={fg} />
        </View>
        <Text style={s.tileTitle}>{title}</Text>
        <Text style={s.tileSub}>{sub}</Text>
        <Text style={[s.tileCount, { color: fg }]}>{count}</Text>
      </Pressy>
    </View>
  );
}

function QuickTiles() {
  const { p, s } = useStyles();
  const { goTab, setGroup } = useApp();
  const go = (g: Group) => {
    setGroup(g);
    goTab("Explorer");
  };
  return (
    <View style={s.tileGrid}>
      <Tile
        icon="document-text-outline"
        title="Anciens sujets"
        sub="Épreuves des sessions précédentes"
        count="42 documents"
        fg={p.green}
        bg={p.greenSoft}
        onPress={() => go("Anciens sujets")}
      />
      <Tile
        icon="create-outline"
        title="Corrections"
        sub="Comprends chaque étape"
        count="27 documents"
        fg={p.red}
        bg={p.redSoft}
        onPress={() => go("Corrections")}
      />
      <Tile
        icon="book-outline"
        title="Cours et notes"
        sub="Les supports de tes UE"
        count="35 documents"
        fg={p.orangeText}
        bg={p.orangeSoft}
        onPress={() => go("Cours")}
      />
      <Tile
        icon="flask-outline"
        title="TD et TP"
        sub="Entraîne-toi avec des exercices"
        count="31 documents"
        fg={p.blue}
        bg={p.blueSoft}
        onPress={() => go("TD / TP")}
      />
    </View>
  );
}

function ContributeCta() {
  const { open } = useApp();
  const { s } = useStyles();
  return (
    <View style={s.cta}>
      <Text style={s.ctaTitle}>Il manque un sujet ?</Text>
      <Text style={s.ctaText}>
        Ajoute-le. Chaque document aide toute la promotion.
      </Text>
      <Btn
        label="Ajouter un document"
        kind="orange"
        icon="cloud-upload-outline"
        onPress={() => open({ name: "contribute" })}
      />
    </View>
  );
}

function HomeScreen() {
  const { goTab } = useApp();
  const { s } = useStyles();
  return (
    <View style={s.page}>
      <Hero />
      <CampusChip />
      <StudyFocus />
      <SectionTitle
        title="Tes UE, année par année"
        action="Tout voir"
        onAction={() => goTab("Explorer")}
      />
      <CoverageGrid />
      <Legend />
      <SectionTitle title="Accès rapide" />
      <QuickTiles />
      <SectionTitle
        title="Ajoutés cette semaine"
        action="Tout voir"
        onAction={() => goTab("Explorer")}
      />
      <View>
        {RESOURCES.slice(0, 4).map((item) => (
          <PaperRow key={item.id} item={item} />
        ))}
      </View>
      <ContributeCta />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Explorer, saved                                                     */
/* ------------------------------------------------------------------ */

function ExplorerScreen() {
  const { query, setQuery, group, setGroup, notify } = useApp();
  const { s } = useStyles();
  const q = query.trim().toLowerCase();
  const results = RESOURCES.filter((r) => {
    const okGroup = group === "Tous" || r.group === group;
    const okQuery =
      !q ||
      `${r.title} ${r.code} ${COURSES[r.code]} ${r.yearRange} ${r.university}`
        .toLowerCase()
        .includes(q);
    return okGroup && okQuery;
  });
  return (
    <View style={s.page}>
      <Text style={s.titleXL}>Explorer</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tagScroll}
      >
        {FILTERS.map((f) => (
          <Tag
            key={f}
            label={f}
            selected={group === f}
            onPress={() => setGroup(f)}
          />
        ))}
      </ScrollView>
      <Text style={s.caption}>
        {results.length} résultat{results.length > 1 ? "s" : ""}
        {q ? ` pour « ${query.trim()} »` : ""}
      </Text>
      {results.length ? (
        <View>
          {results.map((item) => (
            <PaperRow key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <Animated.View entering={FadeIn} style={s.empty}>
          <BlankSheet />
          <Text style={s.emptyTitle}>
            Aucun sujet pour « {query.trim() || group} »
          </Text>
          <Text style={s.emptyBody}>
            Vérifie l’orthographe ou élargis les filtres. Tu peux aussi demander
            ce document.
          </Text>
          <Btn
            label="Demander ce document"
            kind="orange"
            icon="hand-left-outline"
            onPress={() =>
              notify(
                "Demande envoyée. On te prévient dès qu’il arrive.",
                "success",
              )
            }
          />
          <Btn
            label="Effacer la recherche"
            kind="text"
            onPress={() => {
              setQuery("");
              setGroup("Tous");
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

function SavedScreen() {
  const { saved, downloaded, goTab } = useApp();
  const { s } = useStyles();
  const items = RESOURCES.filter((r) => saved.includes(r.id));
  const bar = useSharedValue(0);
  const target = Math.min(100, 8 + downloaded.length * 14 + saved.length * 4);
  useEffect(() => {
    bar.value = withTiming(target, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [bar, target]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value}%` }));
  return (
    <View style={s.page}>
      <Text style={s.titleXL}>Ma bibliothèque</Text>
      <View style={s.storage}>
        <Animated.View style={[s.storageUsed, barStyle]} />
      </View>
      <Text style={s.caption}>
        {downloaded.length} document{downloaded.length > 1 ? "s" : ""} hors
        connexion, {saved.length} enregistré{saved.length > 1 ? "s" : ""}
      </Text>
      {items.length ? (
        <View>
          {items.map((item) => (
            <PaperRow key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <View style={s.empty}>
          <BlankSheet />
          <Text style={s.emptyTitle}>Rien d’enregistré pour l’instant</Text>
          <Text style={s.emptyBody}>
            Touche le marque-page d’un document pour le retrouver ici, même sans
            réseau.
          </Text>
          <Btn
            label="Explorer les ressources"
            icon="compass-outline"
            onPress={() => goTab("Explorer")}
          />
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const UNIVERSITIES = ["Université de Douala", "Université de Dschang"];
const FILIERES = ["Informatique", "Mathématiques", "Physique"];
const LEVELS = [
  "Licence 2, semestre 3",
  "Licence 3, semestre 5",
  "Licence 1, semestre 1",
];

function ProfileField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { p, s } = useStyles();
  return (
    <Pressy onPress={onPress} style={s.profileField} depth={0.98}>
      <Ionicons name={icon} size={22} color={p.green} />
      <View style={s.flex}>
        <Text style={s.fieldCaption}>{label}</Text>
        <Text style={s.profileValue}>{value}</Text>
      </View>
      <Ionicons name="swap-vertical" size={18} color={p.muted} />
    </Pressy>
  );
}

function ProfileScreen() {
  const { open, notify, celebrate } = useApp();
  const { p, s } = useStyles();
  const [uni, setUni] = useState(0);
  const [fil, setFil] = useState(0);
  const [lvl, setLvl] = useState(0);
  const [lang, setLang] = useState<"FR" | "EN">("FR");
  const [done, setDone] = useState(false);
  const { style, shake } = useShake();
  const bar = useSharedValue(70);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value}%` }));
  const save = () => {
    shake();
    bar.value = withTiming(100, { duration: 600 });
    setDone(true);
    celebrate("Profil complété");
    notify("Profil enregistré.", "success");
  };
  return (
    <View style={s.page}>
      <Animated.View style={[s.profilePanel, style]}>
        <View style={s.avatarLarge}>
          <Text style={s.avatarLargeText}>AN</Text>
        </View>
        <Text style={s.profileName}>Bienvenue, étudiant</Text>
        <Text style={s.profileText}>
          Configure ton profil académique pour voir les ressources qui te
          correspondent.
        </Text>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, barStyle]} />
        </View>
        <Text style={s.caption}>
          {done ? "Profil complet" : "Profil complété à 70 %"}
        </Text>
        <ProfileField
          icon="school-outline"
          label="Université"
          value={UNIVERSITIES[uni]}
          onPress={() => setUni((uni + 1) % UNIVERSITIES.length)}
        />
        <ProfileField
          icon="layers-outline"
          label="Filière"
          value={FILIERES[fil]}
          onPress={() => setFil((fil + 1) % FILIERES.length)}
        />
        <ProfileField
          icon="bar-chart-outline"
          label="Niveau"
          value={LEVELS[lvl]}
          onPress={() => setLvl((lvl + 1) % LEVELS.length)}
        />
        <Btn label="Enregistrer le profil" onPress={save} />
      </Animated.View>
      <View style={s.langRow}>
        <Text style={s.rowTitle}>Langue de l’interface</Text>
        <View style={s.flex} />
        {(["FR", "EN"] as const).map((l) => (
          <Tap key={l} onPress={() => setLang(l)} style={s.langPill}>
            {lang === l ? (
              <Marker>
                <Text style={s.langOn}>{l}</Text>
              </Marker>
            ) : (
              <Text style={s.langOff}>{l}</Text>
            )}
          </Tap>
        ))}
      </View>
      <Pressy onPress={() => open({ name: "contribute" })} style={s.settingRow}>
        <Ionicons name="cloud-upload-outline" size={22} color={p.green} />
        <Text style={[s.rowTitle, s.flex]}>Ajouter un document</Text>
        <Ionicons name="chevron-forward" size={18} color={p.muted} />
      </Pressy>
      <Pressy onPress={() => open({ name: "kit" })} style={s.settingRow}>
        <Ionicons name="color-palette-outline" size={22} color={p.green} />
        <Text style={[s.rowTitle, s.flex]}>Kit d’interface (démo)</Text>
        <Ionicons name="chevron-forward" size={18} color={p.muted} />
      </Pressy>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Course, detail, contribute                                          */
/* ------------------------------------------------------------------ */

function BackRow({ right }: { right?: ReactNode }) {
  const { p, s } = useStyles();
  const { back } = useApp();
  return (
    <View style={s.backRow}>
      <Pressy onPress={back} label="Retour" style={s.iconButton}>
        <Ionicons name="arrow-back" size={24} color={p.ink} />
      </Pressy>
      <View style={s.flex} />
      {right}
    </View>
  );
}

function CourseScreen({ code }: { code: string }) {
  const { s } = useStyles();
  const [tab, setTab] = useState<Group>("Tous");
  const list = RESOURCES.filter(
    (r) => r.code === code && (tab === "Tous" || r.group === tab),
  );
  const years = Array.from(new Set(list.map((r) => r.yearRange)));
  return (
    <ScrollView
      contentContainerStyle={s.scrollBase}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.page}>
        <BackRow />
        <Text style={s.giant}>{code}</Text>
        <Text style={s.courseName}>{COURSES[code]}</Text>
        <Text style={s.paperMeta}>Licence 2, semestre 3, Informatique</Text>
        <View style={s.stats}>
          {[
            [
              String(RESOURCES.filter((r) => r.code === code).length),
              "documents",
            ],
            [
              String(
                RESOURCES.filter((r) => r.code === code && r.correction).length,
              ),
              "corrigés",
            ],
            ["5", "années"],
          ].map(([n, l], i) => (
            <View key={l} style={[s.stat, i > 0 && s.statDivider]}>
              <Text style={s.statNumber}>{n}</Text>
              <Text style={s.caption}>{l}</Text>
            </View>
          ))}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tagScroll}
        >
          {FILTERS.map((f) => (
            <Tag
              key={f}
              label={f}
              selected={tab === f}
              onPress={() => setTab(f)}
            />
          ))}
        </ScrollView>
        {years.length ? (
          years.map((y) => (
            <View key={y}>
              <Text style={s.yearHeading}>{y}</Text>
              {list
                .filter((r) => r.yearRange === y)
                .map((r) => (
                  <PaperRow key={r.id} item={r} />
                ))}
            </View>
          ))
        ) : (
          <View style={s.empty}>
            <BlankSheet />
            <Text style={s.emptyTitle}>Rien ici pour l’instant</Text>
            <Text style={s.emptyBody}>
              Aucun document de ce type pour {code}. Ajoute le tien.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function KeyValue({ k, v }: { k: string; v: string }) {
  const { s } = useStyles();
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvValue}>{v}</Text>
    </View>
  );
}

function DetailScreen({ id }: { id: string }) {
  const { p, s } = useStyles();
  const { downloaded, markDownloaded, celebrate, notify, saved, toggleSaved } =
    useApp();
  const item = RESOURCES.find((r) => r.id === id) ?? RESOURCES[0];
  const [phase, setPhase] = useState<"idle" | "loading" | "done">(
    downloaded.includes(item.id) ? "done" : "idle",
  );
  const progress = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const { style: shakeStyle, shake } = useShake();
  const { style: popStyle, pop } = usePop();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const download = () => {
    if (phase !== "idle") return;
    setPhase("loading");
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.inOut(Easing.cubic),
    });
    timer.current = setTimeout(() => {
      setPhase("done");
      markDownloaded(item.id);
      shake();
      celebrate(`${item.code} est sur ton téléphone`);
    }, 1550);
  };
  const isSaved = saved.includes(item.id);
  return (
    <ScrollView
      contentContainerStyle={s.scrollBase}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.page}>
        <BackRow
          right={
            <Pressy
              label="Enregistrer"
              style={s.iconButton}
              onPress={() => {
                const now = toggleSaved(item.id);
                pop();
                notify(
                  now
                    ? "Ajouté à ta bibliothèque."
                    : "Retiré de ta bibliothèque.",
                  now ? "success" : "info",
                );
              }}
            >
              <Animated.View style={popStyle}>
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={isSaved ? p.orange : p.ink}
                />
              </Animated.View>
            </Pressy>
          }
        />
        <Animated.View style={[s.preview, shakeStyle]}>
          <View style={s.paperSheet}>
            <View style={s.paperTop} />
            <Text style={s.paperUni}>{item.university}</Text>
            <Text style={s.paperCourse}>{COURSES[item.code]}</Text>
            <View style={s.paperRule} />
            <Text style={s.paperHeading}>{item.title}</Text>
            <View style={s.paperLineLong} />
            <View style={s.paperLineShort} />
            <View style={s.paperLineLong} />
            <Text style={s.paperQ}>Exercice 1</Text>
            <View style={s.paperLineLong} />
            <View style={s.paperLineShort} />
            <Text style={s.paperQ}>Exercice 2</Text>
            <View style={s.paperLineLong} />
          </View>
          {item.correction ? (
            <View style={s.previewPen}>
              <Ionicons name="create" size={18} color={WHITE} />
            </View>
          ) : null}
        </Animated.View>
        <View style={s.stampRow}>
          {item.stamps.map((k) => (
            <Stamp key={k} kind={k} />
          ))}
        </View>
        <Text style={s.titleXL}>{item.title}</Text>
        <Text style={s.paperMeta}>
          {item.code}, {item.yearRange}
          {item.session ? `, ${item.session}` : ""}
        </Text>
        <View style={s.kvBox}>
          <KeyValue k="Université" v={item.university} />
          <KeyValue k="Langue" v="Français" />
          <KeyValue k="Fichier" v={`PDF, ${item.size}, ${item.pages} pages`} />
          <KeyValue k="Source" v="Déclarée par le contributeur" />
        </View>
        <View style={s.margin}>
          <Text style={s.marginText}>
            La relecture vérifie les informations du document, pas l’exactitude
            des réponses. Compare toujours avec ton cours.
          </Text>
        </View>
        {phase === "loading" ? (
          <View style={s.downloadTrack}>
            <Animated.View style={[s.downloadFill, barStyle]} />
            <Text style={s.downloadText}>Téléchargement…</Text>
          </View>
        ) : (
          <Btn
            label={
              phase === "done"
                ? "Disponible hors connexion"
                : `Télécharger, ${item.size}`
            }
            icon={phase === "done" ? "checkmark-circle" : "download-outline"}
            kind={phase === "done" ? "outline" : "primary"}
            onPress={
              phase === "done"
                ? () => notify("Déjà sur ton téléphone.", "info")
                : download
            }
          />
        )}
        <Btn
          label="Signaler un problème"
          kind="text"
          onPress={() =>
            notify("Merci. Un modérateur va regarder ce document.", "info")
          }
        />
      </View>
    </ScrollView>
  );
}

function ContributeScreen() {
  const { p, s } = useStyles();
  const { back, notify, celebrate } = useApp();
  const [title, setTitle] = useState("");
  const [ue, setUe] = useState("INF 201");
  const [hasFile, setHasFile] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [sending, setSending] = useState(false);
  const titleShake = useShake();
  const fileShake = useShake();
  const declShake = useShake();
  const [errors, setErrors] = useState<{
    title?: string;
    file?: string;
    decl?: string;
  }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim())
      next.title = "Ajoute un titre avec l’année ou la session.";
    if (!hasFile) next.file = "Choisis un fichier PDF.";
    if (!declared)
      next.decl = "Confirme que tu as le droit de partager ce document.";
    setErrors(next);
    if (next.title) titleShake.shake();
    if (next.file) fileShake.shake();
    if (next.decl) declShake.shake();
    if (Object.keys(next).length) {
      notify("Il manque quelques informations.", "error");
      return;
    }
    setSending(true);
    timer.current = setTimeout(() => {
      setSending(false);
      celebrate("Merci ! Ton document part en relecture");
      notify("Document envoyé pour relecture.", "success");
      back();
    }, 1100);
  };
  return (
    <ScrollView
      contentContainerStyle={s.scrollBase}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={s.page}>
        <BackRow />
        <Text style={s.titleXL}>Ajouter un document</Text>
        <Text style={s.lead}>
          Chaque document est relu avant d’être publié.
        </Text>
        <Animated.View style={[s.field, titleShake.style]}>
          <Text style={s.fieldLabel}>Titre du document</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Examen final, 2023-2024"
            placeholderTextColor={p.muted}
            underlineColorAndroid="transparent"
            cursorColor={p.green}
            style={[
              s.underline,
              { borderBottomColor: errors.title ? p.red : p.ink },
            ]}
          />
          {errors.title ? (
            <Text style={s.fieldError}>{errors.title}</Text>
          ) : null}
        </Animated.View>
        <View style={s.field}>
          <Text style={s.fieldLabel}>Unité d’enseignement</Text>
          <View style={s.tagRow}>
            {Object.keys(COURSES).map((c) => (
              <Tag
                key={c}
                label={c}
                selected={ue === c}
                onPress={() => setUe(c)}
              />
            ))}
          </View>
        </View>
        <Animated.View style={fileShake.style}>
          <Pressy
            onPress={() => setHasFile(!hasFile)}
            style={[
              s.drop,
              hasFile && s.dropOn,
              errors.file ? { borderColor: p.red } : null,
            ]}
            depth={0.98}
          >
            <Ionicons
              name={hasFile ? "document-attach" : "cloud-upload-outline"}
              size={28}
              color={hasFile ? p.green : p.muted}
            />
            <Text style={s.dropTitle}>
              {hasFile ? `${ue}-sujet.pdf, 1,3 Mo` : "Choisir un fichier PDF"}
            </Text>
            <Text style={s.caption}>
              {hasFile ? "Touche pour le retirer" : "25 Mo maximum"}
            </Text>
          </Pressy>
          {errors.file ? <Text style={s.fieldError}>{errors.file}</Text> : null}
        </Animated.View>
        <Animated.View style={declShake.style}>
          <Pressy
            onPress={() => setDeclared(!declared)}
            style={s.checkRow}
            depth={0.98}
          >
            <View style={[s.checkBox, declared && s.checkBoxOn]}>
              {declared ? (
                <Ionicons name="checkmark" size={18} color={p.onOrange} />
              ) : null}
            </View>
            <Text style={s.checkText}>
              Je confirme avoir le droit de partager ce document.
            </Text>
          </Pressy>
          {errors.decl ? <Text style={s.fieldError}>{errors.decl}</Text> : null}
        </Animated.View>
        <Btn
          label="Envoyer pour relecture"
          icon="paper-plane-outline"
          loading={sending}
          onPress={submit}
        />
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* Kit                                                                 */
/* ------------------------------------------------------------------ */

function KitScreen() {
  const { p, s } = useStyles();
  const { notify, celebrate } = useApp();
  const demo = useShake();
  const legend: [StampKind, string][] = [
    ["community", "Ajouté par un étudiant, pas encore relu."],
    ["metadata", "Un modérateur a contrôlé UE, année et type."],
    ["source", "La provenance du fichier a été confirmée."],
    ["official", "Origine officielle prouvée."],
    ["correction", "Correction relue par une personne identifiée."],
    ["ai", "Produit avec une IA, à vérifier."],
  ];
  const meaning: [string, string, string, string][] = [
    ["Orange", "Sélectionné, tu es ici", p.orange, p.onOrange],
    ["Vert", "Actions et navigation", p.green, p.primaryFg],
    ["Stylo rouge", "Une correction existe", p.red, WHITE],
    ["Encre bleue", "Source ou infos relues", p.blue, WHITE],
  ];
  return (
    <ScrollView
      contentContainerStyle={s.scrollBase}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.page}>
        <BackRow />
        <Text style={s.titleXL}>Kit d’interface</Text>
        <Text style={s.lead}>
          Touche les boutons : ils bougent. Les actions réussies secouent la
          partie qui change.
        </Text>

        <Text style={s.heading}>Labels de vérification</Text>
        {legend.map(([kind, text]) => (
          <View key={kind} style={s.legendRow}>
            <Stamp kind={kind} />
            <Text style={s.legendText}>{text}</Text>
          </View>
        ))}

        <Text style={s.heading}>Boutons et étiquettes</Text>
        <Btn
          label="Télécharger"
          icon="download-outline"
          onPress={() => notify("Bouton principal", "info")}
        />
        <Btn
          label="Enregistrer"
          kind="orange"
          icon="bookmark-outline"
          onPress={() => notify("Bouton orange", "info")}
        />
        <Btn label="Annuler" kind="outline" />
        <Btn label="Supprimer le document" kind="danger" icon="trash-outline" />
        <Btn label="Envoi en cours" loading />
        <Btn label="Indisponible hors connexion" disabled />
        <View style={s.tagRow}>
          <Tag label="Licence 2" selected />
          <Tag label="Semestre 3" />
          <Tag label="Avec correction" selected />
        </View>

        <Text style={s.heading}>Retours et secousses</Text>
        <Animated.View style={demo.style}>
          <View style={s.snack}>
            <Ionicons name="alert-circle" size={20} color={p.snackFg} />
            <Text style={s.snackText}>
              Cette ligne se secoue quand une action échoue.
            </Text>
          </View>
        </Animated.View>
        <Btn
          label="Secouer"
          kind="outline"
          icon="pulse-outline"
          onPress={demo.shake}
        />
        <Btn
          label="Fêter une réussite"
          kind="orange"
          icon="trophy-outline"
          onPress={() => celebrate("Objectif atteint")}
        />

        <Text style={s.heading}>Dialogue</Text>
        <View style={s.scrim}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>Supprimer ce téléchargement ?</Text>
            <Text style={s.dialogBody}>
              Le fichier sera retiré de ton téléphone. Tu pourras le télécharger
              de nouveau avec une connexion.
            </Text>
            <View style={s.dialogActions}>
              <Btn label="Annuler" kind="text" />
              <Btn label="Supprimer" kind="danger" />
            </View>
          </View>
        </View>

        <Text style={s.heading}>Couleurs et sens</Text>
        {meaning.map(([name, use, bg, fg]) => (
          <View key={name} style={s.meaningRow}>
            <View style={[s.meaningSwatch, { backgroundColor: bg }]}>
              <Text style={[s.meaningName, { color: fg }]}>{name}</Text>
            </View>
            <Text style={[s.body, s.flex]}>{use}</Text>
          </View>
        ))}
        <Text style={s.giant}>Aa 56</Text>
        <Text style={s.titleXL}>Titre 26, extra-gras</Text>
        <Text style={s.heading}>Intertitre 19</Text>
        <Text style={s.body}>
          Texte courant 15, lisible en plein soleil. Retrouve les anciens sujets
          de ton université et prépare tes examens avec confiance.
        </Text>
        <Text style={s.caption}>
          Légende 13, pour les tailles de fichier et les dates.
        </Text>
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* Dock, toast, root                                                   */
/* ------------------------------------------------------------------ */

function Dock({ onHeight }: { onHeight: (h: number) => void }) {
  const insets = useSafeAreaInsets();
  const { p, s } = useStyles();
  const { tab, goTab, query, setQuery } = useApp();
  const width = useSharedValue(0);
  const index = useSharedValue(0);
  useEffect(() => {
    index.value = withSpring(
      TABS.findIndex((t) => t.key === tab),
      { damping: 13, stiffness: 190 },
    );
  }, [tab, index]);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          index.value * (width.value / TABS.length) +
          (width.value / TABS.length - 60) / 2,
      },
    ],
  }));
  return (
    <View
      style={[s.dock, { paddingBottom: insets.bottom + 8 }]}
      onLayout={(e: LayoutChangeEvent) => onHeight(e.nativeEvent.layout.height)}
    >
      <View style={s.dockSearch}>
        <Ionicons name="search" size={21} color={p.muted} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            if (t.length > 0) goTab("Explorer");
          }}
          style={s.dockInput}
          underlineColorAndroid="transparent"
          placeholder="Une UE, un code, une année"
          placeholderTextColor={p.muted}
          cursorColor={p.green}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressy
            onPress={() => setQuery("")}
            label="Effacer"
            style={s.dockClear}
          >
            <Ionicons name="close-circle" size={20} color={p.muted} />
          </Pressy>
        ) : null}
        <Pressy
          onPress={() => goTab("Explorer")}
          label="Filtres"
          style={s.dockFilter}
        >
          <Ionicons name="options-outline" size={21} color={p.onOrange} />
        </Pressy>
      </View>
      <View
        style={s.dockNav}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={[s.dockPill, pillStyle]} />
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressy
              key={t.key}
              onPress={() => goTab(t.key)}
              style={s.dockItem}
              depth={0.9}
            >
              <View style={s.dockIconBox}>
                <Ionicons
                  name={on ? t.filled : t.outline}
                  size={22}
                  color={on ? p.onOrange : p.onBoardMuted}
                />
              </View>
              <Text style={[s.dockLabel, on && s.dockLabelOn]}>{t.key}</Text>
            </Pressy>
          );
        })}
      </View>
    </View>
  );
}

function Toast({
  message,
  kind,
  action,
  bottom,
}: {
  message: string;
  kind: ToastKind;
  action?: string;
  bottom: number;
}) {
  const { p, s } = useStyles();
  const icon: IconName =
    kind === "success"
      ? "checkmark-circle"
      : kind === "error"
        ? "alert-circle"
        : "information-circle";
  const tint =
    kind === "error"
      ? p === LIGHT
        ? "#FF9AA5"
        : p.red
      : kind === "success"
        ? p === LIGHT
          ? "#8FE0BE"
          : p.green
        : p.snackFg;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14)}
      exiting={FadeOutDown.duration(200)}
      style={[s.snack, s.snackFloat, { bottom }]}
    >
      <Ionicons name={icon} size={21} color={tint} />
      <Text style={s.snackText}>{message}</Text>
      {action ? <Text style={s.snackAction}>{action}</Text> : null}
    </Animated.View>
  );
}

export default function AmphiHubAlive() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const { s } = useStyles();
  const [stack, setStack] = useState<Route[]>([{ name: "tabs" }]);
  const [tab, setTab] = useState<Tab>("Accueil");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("Tous");
  const [saved, setSaved] = useState<string[]>(["r2"]);
  const [downloaded, setDownloaded] = useState<string[]>(["r1"]);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    kind: ToastKind;
    action?: string;
  } | null>(null);
  const [celebration, setCelebration] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [dockHeight, setDockHeight] = useState(170);
  const counter = useRef(0);

  const route = stack[stack.length - 1];

  const back = () =>
    setStack((cur) => (cur.length > 1 ? cur.slice(0, -1) : cur));
  const open = (r: Route) => setStack((cur) => [...cur, r]);
  const goTab = (t: Tab) => {
    setTab(t);
    setStack([{ name: "tabs" }]);
  };
  const toggleSaved = (id: string) => {
    const now = !saved.includes(id);
    setSaved(now ? [...saved, id] : saved.filter((x) => x !== id));
    return now;
  };
  const markDownloaded = (id: string) =>
    setDownloaded((cur) => (cur.includes(id) ? cur : [...cur, id]));
  const notify = (
    message: string,
    kind: ToastKind = "info",
    action?: string,
  ) => {
    counter.current += 1;
    setToast({ id: counter.current, message, kind, action });
  };
  const celebrate = (label: string) => {
    counter.current += 1;
    setCelebration({ id: counter.current, label });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 2100);
    return () => clearTimeout(t);
  }, [celebration]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 1) {
        setStack(stack.slice(0, -1));
        return true;
      }
      if (tab !== "Accueil") {
        setTab("Accueil");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack, tab]);

  if (!fontsLoaded) return null;

  const ctx: AppContextValue = {
    tab,
    goTab,
    open,
    back,
    query,
    setQuery,
    group,
    setGroup,
    saved,
    toggleSaved,
    downloaded,
    markDownloaded,
    notify,
    celebrate,
  };
  const onTabs = route.name === "tabs";
  const screenKey = onTabs ? `tab-${tab}` : `${route.name}-${stack.length}`;

  return (
    <AppContext.Provider value={ctx}>
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <StatusBar style="auto" />
        {onTabs ? <TopBar /> : null}
        <Animated.View
          key={screenKey}
          entering={FadeIn.duration(220)}
          style={s.flex}
        >
          {route.name === "tabs" ? (
            <ScrollView
              contentContainerStyle={[
                s.scrollBase,
                { paddingBottom: dockHeight + 40 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {tab === "Accueil" ? <HomeScreen /> : null}
              {tab === "Explorer" ? <ExplorerScreen /> : null}
              {tab === "Enregistrés" ? <SavedScreen /> : null}
              {tab === "Profil" ? <ProfileScreen /> : null}
            </ScrollView>
          ) : null}
          {route.name === "course" ? <CourseScreen code={route.code} /> : null}
          {route.name === "detail" ? <DetailScreen id={route.id} /> : null}
          {route.name === "contribute" ? <ContributeScreen /> : null}
          {route.name === "kit" ? <KitScreen /> : null}
        </Animated.View>
        {onTabs ? <Dock onHeight={setDockHeight} /> : null}
        {toast ? (
          <Toast
            key={toast.id}
            message={toast.message}
            kind={toast.kind}
            action={toast.action}
            bottom={onTabs ? dockHeight + 12 : 24}
          />
        ) : null}
        {celebration ? (
          <Celebration key={celebration.id} label={celebration.label} />
        ) : null}
      </SafeAreaView>
    </AppContext.Provider>
  );
}

function TopBar() {
  const { p, s } = useStyles();
  const { goTab } = useApp();
  return (
    <View style={s.topBar}>
      <View style={s.brandMark}>
        <LinearGradient
          colors={[LIGHT.green, LIGHT.greenLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.brandGradient}
        >
          <Ionicons name="school" size={21} color={WHITE} />
        </LinearGradient>
      </View>
      <View style={s.flex}>
        <Text style={s.wordmark}>
          <Text style={{ color: p.green }}>amphi</Text>
          <Text style={{ color: p.orange }}>Hub</Text>
        </Text>
        <Text style={s.brandSub}>Révise mieux. Va plus loin.</Text>
      </View>
      <Pressy onPress={() => goTab("Profil")} label="Profil" style={s.avatar}>
        <Text style={s.avatarText}>AN</Text>
      </Pressy>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

function createStyles(p: Palette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, backgroundColor: p.paper },
    scrollBase: { paddingBottom: 60 },
    page: { paddingHorizontal: 20, gap: 14 },

    /* type */
    giant: {
      fontFamily: F.black,
      fontSize: 52,
      lineHeight: 58,
      color: p.ink,
      letterSpacing: -2,
    },
    titleXL: {
      fontFamily: F.xbold,
      fontSize: 26,
      lineHeight: 32,
      color: p.ink,
      letterSpacing: -0.5,
    },
    heading: {
      fontFamily: F.xbold,
      fontSize: 19,
      lineHeight: 25,
      color: p.ink,
      letterSpacing: -0.2,
      marginTop: 10,
    },
    lead: { fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: p.muted },
    body: { fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: p.ink },
    caption: { fontFamily: F.semi, fontSize: 13, color: p.muted },
    rowTitle: { fontFamily: F.bold, fontSize: 16, color: p.ink },

    /* top bar */
    topBar: {
      height: 70,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    brandMark: { width: 44, height: 44, borderRadius: 14, overflow: "hidden" },
    brandGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
    wordmark: { fontFamily: F.black, fontSize: 24, letterSpacing: -0.8 },
    brandSub: {
      fontFamily: F.semi,
      fontSize: 12,
      color: p.muted,
      marginTop: -1,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: p.greenSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontFamily: F.xbold, fontSize: 14, color: p.green },

    /* hero */
    hero: {
      minHeight: 240,
      borderRadius: 28,
      padding: 22,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
    },
    heroDecorOne: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      right: -70,
      top: -95,
      backgroundColor: "rgba(255,255,255,0.09)",
    },
    heroDecorTwo: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      right: 6,
      bottom: -130,
      backgroundColor: "rgba(255,255,255,0.07)",
    },
    heroContent: { flex: 1, zIndex: 1 },
    eyebrow: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.16)",
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 14,
    },
    eyebrowDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: LIGHT.orange,
      marginRight: 7,
    },
    eyebrowText: { fontFamily: F.bold, fontSize: 12, color: WHITE },
    heroTitle: {
      fontFamily: F.black,
      fontSize: 31,
      lineHeight: 35,
      color: WHITE,
      letterSpacing: -0.8,
    },
    heroDescription: {
      fontFamily: F.semi,
      fontSize: 14,
      lineHeight: 20,
      color: "#DDF0E6",
      marginTop: 10,
      maxWidth: 210,
    },
    heroButton: {
      alignSelf: "flex-start",
      marginTop: 16,
      backgroundColor: WHITE,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    heroButtonText: {
      fontFamily: F.xbold,
      fontSize: 13,
      color: LIGHT.greenDark,
    },
    heroArt: {
      width: 70,
      height: 132,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: -6,
    },
    bookBack: {
      position: "absolute",
      width: 56,
      height: 84,
      borderRadius: 8,
      backgroundColor: LIGHT.orange,
      transform: [{ rotate: "11deg" }],
      right: 2,
      top: 26,
    },
    bookFront: {
      width: 55,
      height: 90,
      borderRadius: 8,
      backgroundColor: WHITE,
      paddingTop: 24,
      paddingHorizontal: 10,
      gap: 7,
      transform: [{ rotate: "-7deg" }],
      elevation: 6,
    },
    bookSpine: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
      backgroundColor: "#CFE6DA",
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    bookLine: { height: 3, borderRadius: 2, backgroundColor: "#CFE6DA" },
    bookLineShort: {
      height: 3,
      width: "65%",
      borderRadius: 2,
      backgroundColor: "#CFE6DA",
    },
    heroFloat: {
      position: "absolute",
      right: -2,
      top: 16,
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
      elevation: 5,
    },

    /* campus + focus */
    campus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 13,
      backgroundColor: p.sheet,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.line,
    },
    campusIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: p.greenSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    campusLabel: { fontFamily: F.semi, fontSize: 12, color: p.muted },
    campusValue: {
      fontFamily: F.xbold,
      fontSize: 15,
      color: p.ink,
      marginTop: 1,
    },
    campusLevel: { fontFamily: F.semi, color: p.muted },
    campusButton: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: p.greenSoft,
      borderRadius: 11,
    },
    campusButtonText: { fontFamily: F.xbold, fontSize: 13, color: p.green },
    focus: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 118,
      padding: 16,
      borderRadius: 20,
      backgroundColor: p.sheet,
      borderWidth: 1,
      borderColor: p.line,
    },
    focusCopy: { flex: 1, paddingRight: 6 },
    focusEyebrow: { fontFamily: F.xbold, fontSize: 13, color: p.orangeText },
    focusTitle: {
      fontFamily: F.xbold,
      fontSize: 18,
      lineHeight: 23,
      color: p.ink,
      marginTop: 5,
    },
    focusCaption: {
      fontFamily: F.semi,
      fontSize: 13,
      color: p.muted,
      marginTop: 5,
    },
    focusArt: {
      width: 72,
      height: 84,
      alignItems: "center",
      justifyContent: "center",
    },
    focusPaper: {
      width: 52,
      height: 66,
      borderRadius: 8,
      transform: [{ rotate: "5deg" }],
      backgroundColor: p.greenSoft,
      borderWidth: 1,
      borderColor: p.line,
      paddingHorizontal: 9,
      paddingTop: 20,
      gap: 7,
    },
    focusLine: { height: 3, borderRadius: 2, backgroundColor: p.greenLight },
    focusLineShort: {
      height: 3,
      width: "60%",
      borderRadius: 2,
      backgroundColor: p.greenLight,
    },
    focusCheck: {
      position: "absolute",
      top: 4,
      right: -9,
      width: 26,
      height: 26,
      borderRadius: 9,
      backgroundColor: p.green,
      alignItems: "center",
      justifyContent: "center",
    },

    /* section */
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14,
    },
    sectionAction: { fontFamily: F.xbold, fontSize: 14, color: p.green },

    /* coverage grid */
    gridRow: { flexDirection: "row", alignItems: "center" },
    gridLead: { width: 108, paddingVertical: 8 },
    gridYear: {
      width: 44,
      textAlign: "center",
      fontFamily: F.bold,
      fontSize: 13,
      color: p.muted,
      paddingBottom: 4,
    },
    gridCode: { fontFamily: F.black, fontSize: 16, color: p.ink },
    gridName: {
      fontFamily: F.semi,
      fontSize: 12,
      color: p.muted,
      marginTop: 1,
    },
    cell: {
      width: 44,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },
    cellPicked: { backgroundColor: p.orange },
    dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: p.ink },
    ring: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2.5,
      borderColor: p.red,
      alignItems: "center",
      justifyContent: "center",
    },
    dash: { width: 10, height: 2, borderRadius: 1, backgroundColor: p.line },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dotSmall: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.ink,
    },
    ringSmall: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: p.red,
      alignItems: "center",
      justifyContent: "center",
    },
    dashSmall: {
      width: 8,
      height: 2,
      borderRadius: 1,
      backgroundColor: p.muted,
    },

    /* tiles */
    tileGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
    },
    tileWrap: { width: "48.4%" },
    tile: {
      minHeight: 172,
      padding: 14,
      backgroundColor: p.sheet,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.line,
    },
    tileIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    tileArrow: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    tileTitle: { fontFamily: F.xbold, fontSize: 16, color: p.ink },
    tileSub: {
      fontFamily: F.semi,
      fontSize: 13,
      lineHeight: 18,
      color: p.muted,
      marginTop: 3,
    },
    tileCount: { fontFamily: F.xbold, fontSize: 13, marginTop: 8 },

    /* call to action */
    cta: {
      gap: 10,
      padding: 20,
      marginTop: 10,
      borderRadius: 22,
      backgroundColor: p.orangeSoft,
    },
    ctaTitle: {
      fontFamily: F.black,
      fontSize: 21,
      color: p.ink,
      letterSpacing: -0.4,
    },
    ctaText: {
      fontFamily: F.semi,
      fontSize: 15,
      lineHeight: 21,
      color: p.muted,
      marginBottom: 4,
    },

    /* stamps, marker, tags */
    stampRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    stamp: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      borderWidth: 1.5,
    },
    stampText: { fontFamily: F.bold, fontSize: 12 },
    marker: {
      backgroundColor: p.orange,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tag: {
      minHeight: 42,
      paddingHorizontal: 15,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor: p.line,
      backgroundColor: p.sheet,
    },
    tagOn: { backgroundColor: p.orange, borderColor: p.orange },
    tagText: { fontFamily: F.bold, fontSize: 14, color: p.ink },
    tagTextOn: { fontFamily: F.xbold, color: p.onOrange },
    tagScroll: { gap: 8, paddingVertical: 2 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

    /* buttons */
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      minHeight: 54,
      paddingHorizontal: 20,
      borderRadius: 16,
      borderWidth: 2,
    },
    btnText: { minHeight: 46, paddingHorizontal: 8 },
    btnLabel: { fontFamily: F.xbold, fontSize: 16 },
    btnLabelUnderline: { textDecorationLine: "underline" },

    /* file tile + rows */
    fileTile: { width: 62, height: 78, borderRadius: 13, padding: 9 },
    fileYear: {
      fontFamily: F.black,
      fontSize: 15,
      letterSpacing: -0.3,
      marginBottom: 7,
    },
    fileLine: { height: 3, borderRadius: 2, opacity: 0.35, marginBottom: 5 },
    fileLineShort: { height: 3, width: "60%", borderRadius: 2, opacity: 0.35 },
    pdfBadge: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: WHITE,
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    pdfBadgeText: { fontFamily: F.black, fontSize: 9, color: "#B84A42" },
    penDot: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: p.red,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: p.paper,
    },
    paperRow: {
      flexDirection: "row",
      gap: 14,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: p.line,
    },
    paperKicker: { fontFamily: F.xbold, fontSize: 13, color: p.green },
    paperTitle: {
      fontFamily: F.xbold,
      fontSize: 17,
      lineHeight: 22,
      color: p.ink,
      marginTop: 2,
    },
    paperMeta: {
      fontFamily: F.semi,
      fontSize: 14,
      color: p.muted,
      marginTop: 3,
    },
    paperFoot: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 6,
    },
    saveBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    /* explorer, saved, empty */
    empty: { alignItems: "center", gap: 12, paddingVertical: 24 },
    emptyTitle: {
      fontFamily: F.xbold,
      fontSize: 20,
      lineHeight: 26,
      color: p.ink,
      textAlign: "center",
    },
    emptyBody: {
      fontFamily: F.semi,
      fontSize: 15,
      lineHeight: 22,
      color: p.muted,
      textAlign: "center",
      marginBottom: 6,
    },
    blank: {
      width: 112,
      height: 140,
      borderRadius: 8,
      backgroundColor: p.sheet,
      borderWidth: 1,
      borderColor: p.line,
      paddingTop: 22,
      paddingHorizontal: 14,
      gap: 14,
      marginBottom: 6,
    },
    blankLine: { height: 1, backgroundColor: p.line },
    blankCircle: {
      position: "absolute",
      right: -14,
      top: 38,
      width: 62,
      height: 62,
      borderRadius: 31,
      borderWidth: 3,
      borderColor: p.red,
    },
    storage: {
      height: 12,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: p.line,
    },
    storageUsed: { height: 12, borderRadius: 6, backgroundColor: p.green },

    /* profile */
    profilePanel: {
      backgroundColor: p.sheet,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: p.line,
      padding: 20,
      gap: 12,
    },
    avatarLarge: {
      width: 74,
      height: 74,
      borderRadius: 26,
      backgroundColor: p.greenSoft,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    avatarLargeText: { fontFamily: F.black, fontSize: 24, color: p.green },
    profileName: {
      fontFamily: F.black,
      fontSize: 22,
      color: p.ink,
      textAlign: "center",
    },
    profileText: {
      fontFamily: F.semi,
      fontSize: 14,
      lineHeight: 21,
      color: p.muted,
      textAlign: "center",
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: p.line,
      overflow: "hidden",
    },
    progressFill: { height: 10, borderRadius: 5, backgroundColor: p.orange },
    profileField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: p.line,
      borderRadius: 16,
    },
    fieldCaption: { fontFamily: F.semi, fontSize: 12, color: p.muted },
    profileValue: {
      fontFamily: F.xbold,
      fontSize: 16,
      color: p.ink,
      marginTop: 1,
    },
    langRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 56,
      borderTopWidth: 1,
      borderTopColor: p.line,
    },
    langPill: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    langOn: { fontFamily: F.black, fontSize: 14, color: p.onOrange },
    langOff: { fontFamily: F.bold, fontSize: 14, color: p.muted },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 58,
      borderTopWidth: 1,
      borderTopColor: p.line,
    },

    /* course + detail */
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: -12,
      marginRight: -12,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    courseName: {
      fontFamily: F.xbold,
      fontSize: 21,
      lineHeight: 27,
      color: p.ink,
      letterSpacing: -0.3,
    },
    stats: { flexDirection: "row", paddingVertical: 6 },
    stat: { paddingRight: 22 },
    statDivider: {
      paddingLeft: 22,
      borderLeftWidth: 1,
      borderLeftColor: p.line,
    },
    statNumber: {
      fontFamily: F.black,
      fontSize: 28,
      color: p.ink,
      letterSpacing: -0.8,
    },
    yearHeading: {
      fontFamily: F.black,
      fontSize: 21,
      color: p.ink,
      letterSpacing: -0.4,
      marginTop: 16,
    },
    preview: {
      minHeight: 300,
      borderRadius: 24,
      backgroundColor: p.greenSoft,
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
    },
    paperSheet: {
      width: "78%",
      minHeight: 262,
      backgroundColor: WHITE,
      padding: 17,
      borderRadius: 4,
      elevation: 5,
    },
    paperTop: {
      height: 4,
      width: "35%",
      backgroundColor: LIGHT.green,
      marginBottom: 12,
    },
    paperUni: {
      fontFamily: F.bold,
      fontSize: 8,
      color: "#58695F",
      textAlign: "center",
    },
    paperCourse: {
      fontFamily: F.semi,
      fontSize: 8,
      color: "#58695F",
      textAlign: "center",
      marginTop: 3,
    },
    paperRule: { height: 1, backgroundColor: "#E6E7DC", marginVertical: 9 },
    paperHeading: {
      fontFamily: F.xbold,
      fontSize: 11,
      color: "#0B2B20",
      marginBottom: 10,
    },
    paperLineLong: {
      height: 3,
      width: "100%",
      backgroundColor: "#E6E7DC",
      borderRadius: 2,
      marginBottom: 7,
    },
    paperLineShort: {
      height: 3,
      width: "68%",
      backgroundColor: "#E6E7DC",
      borderRadius: 2,
      marginBottom: 7,
    },
    paperQ: {
      fontFamily: F.xbold,
      fontSize: 8,
      color: "#0B2B20",
      marginTop: 6,
      marginBottom: 6,
    },
    previewPen: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.red,
      alignItems: "center",
      justifyContent: "center",
    },
    kvBox: { borderTopWidth: 2, borderTopColor: p.ink },
    kv: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.line,
    },
    kvKey: { fontFamily: F.semi, fontSize: 14, color: p.muted },
    kvValue: {
      fontFamily: F.bold,
      fontSize: 14,
      color: p.ink,
      flexShrink: 1,
      textAlign: "right",
    },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: p.red,
      paddingLeft: 14,
      paddingVertical: 2,
    },
    marginText: {
      fontFamily: F.semi,
      fontSize: 14,
      lineHeight: 21,
      color: p.ink,
    },
    downloadTrack: {
      height: 54,
      borderRadius: 16,
      backgroundColor: p.line,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    downloadFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: p.orange,
    },
    downloadText: { fontFamily: F.xbold, fontSize: 16, color: p.onOrange },

    /* forms */
    field: { gap: 8 },
    fieldLabel: { fontFamily: F.xbold, fontSize: 15, color: p.ink },
    underline: {
      height: 50,
      fontFamily: F.semi,
      fontSize: 16,
      color: p.ink,
      borderBottomWidth: 2,
    },
    fieldError: {
      fontFamily: F.bold,
      fontSize: 13,
      color: p.red,
      marginTop: 4,
    },
    drop: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 22,
      borderRadius: 18,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: p.line,
      backgroundColor: p.sheet,
    },
    dropOn: {
      borderStyle: "solid",
      borderColor: p.green,
      backgroundColor: p.greenSoft,
    },
    dropTitle: { fontFamily: F.xbold, fontSize: 15, color: p.ink },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 52,
    },
    checkBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: p.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    checkBoxOn: { backgroundColor: p.orange, borderColor: p.orange },
    checkText: { flex: 1, fontFamily: F.bold, fontSize: 15, color: p.ink },

    /* kit */
    legendRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    legendText: {
      flex: 1,
      fontFamily: F.semi,
      fontSize: 14,
      lineHeight: 19,
      color: p.muted,
    },
    meaningRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    meaningSwatch: {
      width: 118,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    meaningName: { fontFamily: F.xbold, fontSize: 14 },
    scrim: { backgroundColor: p.scrim, padding: 20, borderRadius: 14 },
    dialog: {
      backgroundColor: p.sheet,
      borderRadius: 18,
      padding: 22,
      gap: 10,
    },
    dialogTitle: { fontFamily: F.xbold, fontSize: 20, color: p.ink },
    dialogBody: {
      fontFamily: F.semi,
      fontSize: 15,
      lineHeight: 22,
      color: p.muted,
    },
    dialogActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },

    /* snackbar */
    snack: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 58,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: p.snackBg,
    },
    snackFloat: { position: "absolute", left: 16, right: 16, elevation: 8 },
    snackText: {
      flex: 1,
      fontFamily: F.bold,
      fontSize: 14,
      lineHeight: 19,
      color: p.snackFg,
    },
    snackAction: { fontFamily: F.black, fontSize: 14, color: p.snackAction },

    /* celebration */
    celebrate: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    },
    celebrateCenter: { alignItems: "center", justifyContent: "center" },
    badge: {
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 30,
      paddingVertical: 22,
      borderRadius: 26,
      backgroundColor: p.sheet,
      borderWidth: 2,
      borderColor: p.orange,
      elevation: 12,
    },
    badgeCircle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: p.orange,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    badgeTitle: { fontFamily: F.black, fontSize: 24, color: p.ink },
    badgeText: {
      fontFamily: F.semi,
      fontSize: 14,
      color: p.muted,
      textAlign: "center",
      maxWidth: 200,
    },

    /* dock */
    dock: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: p.board,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 14,
      paddingHorizontal: 16,
      gap: 8,
    },
    dockSearch: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 56,
      paddingLeft: 16,
      paddingRight: 6,
      borderRadius: 18,
      backgroundColor: p.sheet,
    },
    dockInput: {
      flex: 1,
      fontFamily: F.semi,
      fontSize: 16,
      color: p.ink,
      paddingVertical: 0,
    },
    dockClear: {
      width: 34,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    dockFilter: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: p.orange,
      alignItems: "center",
      justifyContent: "center",
    },
    dockNav: { flexDirection: "row" },
    dockPill: {
      position: "absolute",
      top: 6,
      left: 0,
      width: 60,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.orange,
    },
    dockItem: { flex: 1, alignItems: "center", gap: 2, paddingTop: 6 },
    dockIconBox: {
      width: 60,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    dockLabel: { fontFamily: F.bold, fontSize: 12, color: p.onBoardMuted },
    dockLabelOn: { fontFamily: F.black, color: p.onBoard },
  });
}
