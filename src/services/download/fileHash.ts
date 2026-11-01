import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";

/** SHA-256 of a local file, as lowercase hex. Files are at most 25 MB, so reading them whole is fine. */
export async function sha256OfFile(uri: string): Promise<string> {
  const bytes = await new File(uri).bytes();
  const digest = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    bytes,
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
