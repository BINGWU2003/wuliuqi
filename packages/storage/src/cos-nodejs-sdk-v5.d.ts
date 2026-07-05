declare module "cos-nodejs-sdk-v5" {
  const COS: new (options: { SecretId: string; SecretKey: string }) => {
    putObject(
      options: {
        Bucket: string;
        Region: string;
        Key: string;
        Body: Buffer;
        ContentType?: string;
      },
      callback: (
        error: { statusCode?: number; code?: string; error?: string } | null,
        data?: { Location?: string },
      ) => void,
    ): void;
  };

  export default COS;
}
