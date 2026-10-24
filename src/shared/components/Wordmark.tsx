import { Image } from "react-native";

import Images from "@/assets/images";
import { useTheme } from "@/shared/hooks/theme";
import { aspectRatioOf } from "@/shared/utils/image";

/** "amphiHub" without the mark. Colour on light themes, reversed on dark ones. */
export function Wordmark({
  height = 26,
  reversed,
}: {
  height?: number;
  reversed?: boolean;
}) {
  const { scheme } = useTheme();
  const useReversed = reversed ?? scheme === "dark";
  const source = useReversed ? Images.WordmarkDark : Images.WordmarkLight;
  return (
    <Image
      source={source}
      style={{ height, width: height * aspectRatioOf(source) }}
      resizeMode="contain"
      accessibilityLabel="amphiHub"
    />
  );
}
