import { Image } from "react-native";

import Images from "@/assets/images";
import { useTheme } from "@/shared/hooks/theme";

/** The cap-and-book mark. Colour version on light themes, reversed on dark ones. */
export function BrandMark({
  size = 44,
  reversed,
}: {
  size?: number;
  reversed?: boolean;
}) {
  const { scheme } = useTheme();
  const useReversed = reversed ?? scheme === "dark";
  return (
    <Image
      source={useReversed ? Images.MarkDark : Images.MarkLight}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="amphiHub"
    />
  );
}
