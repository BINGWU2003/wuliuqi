import imageCompression from "browser-image-compression";

const DEFAULT_MAX_SIZE_MB = 1.5;
const DEFAULT_MAX_WIDTH_OR_HEIGHT = 2000;
const DEFAULT_INITIAL_QUALITY = 0.82;

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      initialQuality: DEFAULT_INITIAL_QUALITY,
      maxSizeMB: DEFAULT_MAX_SIZE_MB,
      maxWidthOrHeight: DEFAULT_MAX_WIDTH_OR_HEIGHT,
      useWebWorker: false,
    });

    return compressedFile.size < file.size ? compressedFile : file;
  } catch {
    return file;
  }
}
