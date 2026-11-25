import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";

import {
  StorageProvider,
  UploadParams,
} from "@/domain/order/application/storage/storage-provider";
import { EnvService } from "@/infra/env/env.service";

@Injectable()
export class R2Storage implements StorageProvider {
  private client: S3Client;

  constructor(private envService: EnvService) {
    const accountId = envService.get("CLOUDFLARE_ACCOUNT_ID");
    const customEndpoint = envService.get("AWS_ENDPOINT");

    this.client = new S3Client({
      endpoint:
        customEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`,
      region: "auto",
      forcePathStyle: Boolean(customEndpoint),
      credentials: {
        accessKeyId: envService.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: envService.get("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ key: string }> {
    const uploadId = randomUUID();
    const uniqueFileName = `${uploadId}-${fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.envService.get("AWS_BUCKET_NAME"),
        Key: uniqueFileName,
        ContentType: fileType,
        Body: body,
      }),
    );

    return {
      key: uniqueFileName,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.envService.get("AWS_BUCKET_NAME"),
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.envService.get("AWS_BUCKET_NAME"),
      Key: key,
    });

    return getS3SignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}
