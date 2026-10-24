import { Image, type ImageSourcePropType } from 'react-native';

/** Width divided by height of a bundled image, read from the file so no size is hard-coded. */
export function aspectRatioOf(source: ImageSourcePropType): number {
  const resolved = Image.resolveAssetSource(source);
  return resolved && resolved.height > 0 ? resolved.width / resolved.height : 1;
}
