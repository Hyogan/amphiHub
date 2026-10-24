import type { ImageSourcePropType } from "react-native";

// ─── The one place for image assets ───────────────────────────────────────────
// Only this file calls require() on an image. Everywhere else:
//
//   import Images from '@/assets/images';
//   <Image source={Images.LogoHorizontalLight} />
//
// "Light" means: use on a LIGHT background (the full-colour logo).
// "Dark" means: use on a DARK or green background (the reversed logo, green parts in white).
// To swap a logo, replace the PNG with the same name, or change one line below.
//
// Density: mark-light.png, mark-light@2x.png and mark-light@3x.png are picked automatically.
//
// Files used only by app.json, never by code (so they are not listed in the map):
//   icon.png, adaptive-foreground.png, adaptive-monochrome.png, splash-icon.png, favicon.png

type ImageMap = {
  /** App icon, reversed mark on brand green (square). */
  AppIcon: ImageSourcePropType;
  /** Icon-only mark (square), for light and dark backgrounds. */
  MarkLight: ImageSourcePropType;
  MarkDark: ImageSourcePropType;
  /** "amphiHub" without the mark. */
  WordmarkLight: ImageSourcePropType;
  WordmarkDark: ImageSourcePropType;
  /** Mark on the left, name on the right. */
  LogoHorizontalLight: ImageSourcePropType;
  LogoHorizontalDark: ImageSourcePropType;
  LogoHorizontalTaglineLight: ImageSourcePropType;
  LogoHorizontalTaglineDark: ImageSourcePropType;
  /** Mark above the name. */
  LogoVerticalLight: ImageSourcePropType;
  LogoVerticalDark: ImageSourcePropType;
  LogoVerticalTaglineLight: ImageSourcePropType;
  LogoVerticalTaglineDark: ImageSourcePropType;
};

const Images: ImageMap = {
  AppIcon: require("./icon.png"),
  MarkLight: require("./mark-light.png"),
  MarkDark: require("./mark-dark.png"),
  WordmarkLight: require("./wordmark-light.png"),
  WordmarkDark: require("./wordmark-dark.png"),
  LogoHorizontalLight: require("./logo-horizontal-light.png"),
  LogoHorizontalDark: require("./logo-horizontal-dark.png"),
  LogoHorizontalTaglineLight: require("./logo-horizontal-tagline-light.png"),
  LogoHorizontalTaglineDark: require("./logo-horizontal-tagline-dark.png"),
  LogoVerticalLight: require("./logo-vertical-light.png"),
  LogoVerticalDark: require("./logo-vertical-dark.png"),
  LogoVerticalTaglineLight: require("./logo-vertical-tagline-light.png"),
  LogoVerticalTaglineDark: require("./logo-vertical-tagline-dark.png"),
};

export default Images;
