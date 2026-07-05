import type { UploadResult } from "@wuliuqi/types";
import COS from "cos-nodejs-sdk-v5";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

type UploadInput = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  folder: string;
  allowedTypes?: Set<string>;
  maxSize?: number;
};

type StorageConfig = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicBaseUrl?: string;
};

export class StorageError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

function getConfig(): StorageConfig {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;

  if (!secretId || !secretKey || !bucket || !region) {
    throw new StorageError("STORAGE_CONFIG_ERROR", "COS 配置不完整", 500);
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    publicBaseUrl: process.env.COS_PUBLIC_BASE_URL,
  };
}

function getExtension(fileName: string, contentType: string) {
  const extensionFromName = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";

  if (extensionFromName) {
    return extensionFromName.replace(/[^.\da-z]/g, "");
  }

  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };

  return extensions[contentType] ?? "";
}

function normalizeFolder(folder: string) {
  const cleanFolder = folder
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!cleanFolder || cleanFolder.includes("..")) {
    throw new StorageError("BAD_FOLDER", "上传目录无效");
  }

  return `${cleanFolder}/`;
}

function createObjectKey(input: UploadInput) {
  const extension = getExtension(input.fileName, input.contentType);
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);

  return `${normalizeFolder(input.folder)}${timestamp}_${random}${extension}`;
}

function publicUrl(config: StorageConfig, key: string, location?: string) {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }

  if (location) {
    return `https://${location.replace(/^https?:\/\//, "")}`;
  }

  return `https://${config.bucket}.cos.${config.region}.myqcloud.com/${key}`;
}

export async function uploadToCos(input: UploadInput): Promise<UploadResult> {
  const allowedTypes = input.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  const maxSize = input.maxSize ?? MAX_FILE_SIZE;

  if (!allowedTypes.has(input.contentType)) {
    throw new StorageError("BAD_FILE_TYPE", "只支持 JPG、PNG、GIF、WebP 格式的图片");
  }

  if (input.buffer.byteLength > maxSize) {
    throw new StorageError("FILE_TOO_LARGE", "图片大小不能超过 10MB");
  }

  const config = getConfig();
  const key = createObjectKey(input);
  const client = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });

  return new Promise((resolve, reject) => {
    client.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
      },
      (error, data) => {
        if (error) {
          reject(new StorageError("UPLOAD_FAILED", "图片上传失败", 502));
          return;
        }

        resolve({
          key,
          url: publicUrl(config, key, data?.Location),
          size: input.buffer.byteLength,
          contentType: input.contentType,
        });
      },
    );
  });
}
