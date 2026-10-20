/**
 * The only place hex values live. Components read colours through useThemeColors().
 * Token groups follow the blueprint contract, plus two groups this app needs:
 * `chrome` (the dock) and `snackbar`.
 */
export const lightColors = {
  brand: {
    primary: "#145A46",
    primaryPressed: "#0A3F33",
    primarySoft: "#E1F0E8",
    primaryLight: "#3A7E66",
    accent: "#F0A01E",
    accentSoft: "#FDEFD2",
    accentText: "#A35F00",
    onAccent: "#0B2B20",
  },
  background: {
    primary: "#FCF9F4",
    secondary: "#FFFFFF",
    tertiary: "#FFFFFF",
    elevated: "#FFFFFF",
  },
  text: {
    primary: "#0B2B20",
    secondary: "#58695F",
    tertiary: "#6B7B72",
    disabled: "#A9B3AC",
    inverse: "#FFFFFF",
    link: "#145A46",
  },
  border: {
    subtle: "#E6E7DC",
    default: "#D6D8CC",
    strong: "#AEB5A8",
    focus: "#145A46",
  },
  status: {
    success: "#1E7B58",
    successSoft: "#E1F0E8",
    warning: "#A35F00",
    warningSoft: "#FDEFD2",
    error: "#D93A4B",
    errorSoft: "#FCE5E8",
    info: "#2347C9",
    infoSoft: "#E4E9FB",
    neutral: "#58695F",
    neutralSoft: "#EFEFE6",
  },
  interactive: {
    primary: "#145A46",
    onPrimary: "#FFFFFF",
    primaryPressed: "#0A3F33",
    secondary: "#E1F0E8",
    secondaryPressed: "#CFE6DA",
    disabled: "#E6E7DC",
  },
  icon: {
    primary: "#0B2B20",
    secondary: "#58695F",
    muted: "#8A988F",
    inverse: "#FFFFFF",
    accent: "#145A46",
  },
  overlay: {
    light: "rgba(10,43,32,0.08)",
    medium: "rgba(10,43,32,0.4)",
    dark: "rgba(10,43,32,0.55)",
  },
  chrome: { background: "#0A3F33", text: "#F4FAF6", textMuted: "#9CC3B3" },
  snackbar: {
    background: "#0A3F33",
    text: "#F4FAF6",
    action: "#F0A01E",
    success: "#8FE0BE",
    error: "#FF9AA5",
    info: "#F4FAF6",
    warning: "#F0A01E",
  },
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  brand: {
    primary: "#4CC49A",
    primaryPressed: "#7BD8B5",
    primarySoft: "#12392B",
    primaryLight: "#7BD8B5",
    accent: "#F5B13A",
    accentSoft: "#3A2A0E",
    accentText: "#F5B13A",
    onAccent: "#0B2B20",
  },
  background: {
    primary: "#0A2018",
    secondary: "#102F24",
    tertiary: "#143A2C",
    elevated: "#18432F",
  },
  text: {
    primary: "#EEF4EF",
    secondary: "#9DB3A8",
    tertiary: "#7F978B",
    disabled: "#4F6B5E",
    inverse: "#06231A",
    link: "#4CC49A",
  },
  border: {
    subtle: "#1C3E31",
    default: "#22493A",
    strong: "#3B6554",
    focus: "#4CC49A",
  },
  status: {
    success: "#4CC49A",
    successSoft: "#12392B",
    warning: "#F5B13A",
    warningSoft: "#3A2A0E",
    error: "#FF7A88",
    errorSoft: "#3A1F26",
    info: "#8FA7FF",
    infoSoft: "#1B2A5C",
    neutral: "#9DB3A8",
    neutralSoft: "#173529",
  },
  interactive: {
    primary: "#4CC49A",
    onPrimary: "#06231A",
    primaryPressed: "#7BD8B5",
    secondary: "#12392B",
    secondaryPressed: "#194A39",
    disabled: "#22493A",
  },
  icon: {
    primary: "#EEF4EF",
    secondary: "#9DB3A8",
    muted: "#6F887C",
    inverse: "#06231A",
    accent: "#4CC49A",
  },
  overlay: {
    light: "rgba(0,0,0,0.2)",
    medium: "rgba(0,0,0,0.5)",
    dark: "rgba(0,0,0,0.6)",
  },
  chrome: { background: "#06160F", text: "#F4FAF6", textMuted: "#7FA393" },
  snackbar: {
    background: "#EEF4EF",
    text: "#0B2B20",
    action: "#145A46",
    success: "#145A46",
    error: "#D93A4B",
    info: "#0B2B20",
    warning: "#A35F00",
  },
};

/** Fixed gradient for the hero. Same in light and dark. */
export const heroGradient = ["#0A3F33", "#145A46", "#2F8A68"] as const;
