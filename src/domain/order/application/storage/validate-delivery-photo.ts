export const MAX_DELIVERY_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type AllowedDeliveryPhotoMimeType =
  "image/jpeg" | "image/png" | "image/webp";

export type ValidateDeliveryPhotoResult =
  | { valid: true; mimeType: AllowedDeliveryPhotoMimeType; size: number }
  | { valid: false; reason: string };

function detectImageMimeType(
  buffer: Buffer,
): AllowedDeliveryPhotoMimeType | null {
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" (0..3) + "WEBP" (8..11)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function validateDeliveryPhoto(
  body: Buffer,
): ValidateDeliveryPhotoResult {
  if (!body || body.length === 0) {
    return { valid: false, reason: "Delivery photo file is empty." };
  }

  if (body.length > MAX_DELIVERY_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      reason: "Delivery photo exceeds the maximum allowed size of 5 MB.",
    };
  }

  const mimeType = detectImageMimeType(body);

  if (!mimeType) {
    return {
      valid: false,
      reason:
        "Invalid image format. Only JPEG, PNG, and WebP files are allowed.",
    };
  }

  return {
    valid: true,
    mimeType,
    size: body.length,
  };
}
