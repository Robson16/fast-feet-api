import { randomUUID } from "node:crypto";

import {
  StorageProvider,
  UploadParams,
} from "@/domain/order/application/storage/storage-provider";

interface StoredFile {
  key: string;
  fileName: string;
  fileType: string;
  body: Buffer;
}

export class FakeStorageProvider implements StorageProvider {
  public items: StoredFile[] = [];
  public deletedKeys: string[] = [];
  public shouldFailUpload = false;

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ key: string }> {
    if (this.shouldFailUpload) {
      throw new Error("Storage upload failed");
    }

    const key = `${randomUUID()}-${fileName}`;

    this.items.push({
      key,
      fileName,
      fileType,
      body,
    });

    return { key };
  }

  async delete(key: string): Promise<void> {
    this.deletedKeys.push(key);

    const itemIndex = this.items.findIndex((item) => item.key === key);

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return `https://fake-storage.test/${key}?expiresIn=${expiresInSeconds}`;
  }
}
