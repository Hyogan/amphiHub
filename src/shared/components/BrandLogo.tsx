import { Image } from "react-native";

import Images from "@/assets/images";
import { useTheme } from "@/shared/hooks/theme";
import { aspectRatioOf } from "@/shared/utils/image";

/** The full logo. Pick the layout; the light or dark file is chosen from the theme. */
export function BrandLogo({
  layout = "horizontal",
  tagline = false,
  width = 240,
  reversed,
}: {
  layout?: "horizontal" | "vertical";
  tagline?: boolean;
  width?: number;
  reversed?: boolean;
}) {
  const { scheme } = useTheme();
  const dark = reversed ?? scheme === "dark";
  const sources = {
    horizontal: {
      plain: [Images.LogoHorizontalLight, Images.LogoHorizontalDark],
      tagline: [
        Images.LogoHorizontalTaglineLight,
        Images.LogoHorizontalTaglineDark,
      ],
    },
    vertical: {
      plain: [Images.LogoVerticalLight, Images.LogoVerticalDark],
      tagline: [
        Images.LogoVerticalTaglineLight,
        Images.LogoVerticalTaglineDark,
      ],
    },
  };
  const pair = sources[layout][tagline ? "tagline" : "plain"];
  const source = dark ? pair[1] : pair[0];
  return (
    <Image
      source={source}
      style={{ width, height: width / aspectRatioOf(source) }}
      resizeMode="contain"
      accessibilityLabel="amphiHub"
    />
  );
}
