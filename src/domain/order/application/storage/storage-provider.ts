export interface UploadParams {
  fileName: string;
  fileType: string;
  body: Buffer;
}

export abstract class StorageProvider {
  abstract upload(params: UploadParams): Promise<{ key: string }>;
  abstract delete(key: string): Promise<void>;
  abstract getSignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;
}
