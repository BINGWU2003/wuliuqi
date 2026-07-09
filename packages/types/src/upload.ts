export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface UploadCredential {
  key: string;
  url: string;
  bucket: string;
  region: string;
  size: number;
  contentType: string;
  startTime: number;
  expiredTime: number;
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
  };
}
