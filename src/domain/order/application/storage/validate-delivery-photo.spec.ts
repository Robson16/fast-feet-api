import {
  MAX_DELIVERY_PHOTO_SIZE_BYTES,
  validateDeliveryPhoto,
} from "./validate-delivery-photo";

describe("validateDeliveryPhoto", () => {
  it("accepts a valid JPEG buffer", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    const result = validateDeliveryPhoto(jpegBuffer);

    expect(result).toEqual({
      valid: true,
      mimeType: "image/jpeg",
      size: jpegBuffer.length,
    });
  });

  it("accepts a valid PNG buffer", () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);

    const result = validateDeliveryPhoto(pngBuffer);

    expect(result).toEqual({
      valid: true,
      mimeType: "image/png",
      size: pngBuffer.length,
    });
  });

  it("accepts a valid WebP buffer", () => {
    const webpBuffer = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
    ]);

    const result = validateDeliveryPhoto(webpBuffer);

    expect(result).toEqual({
      valid: true,
      mimeType: "image/webp",
      size: webpBuffer.length,
    });
  });

  it("rejects an empty buffer", () => {
    const result = validateDeliveryPhoto(Buffer.alloc(0));

    expect(result.valid).toBe(false);
  });

  it("rejects a spoofed file (plain text pretending to be an image)", () => {
    const fakeImage = Buffer.from("this is not a real jpg file", "utf-8");

    const result = validateDeliveryPhoto(fakeImage);

    expect(result.valid).toBe(false);
  });

  it("rejects a valid image larger than 5 MB", () => {
    const oversizedJpeg = Buffer.alloc(MAX_DELIVERY_PHOTO_SIZE_BYTES + 1);
    oversizedJpeg[0] = 0xff;
    oversizedJpeg[1] = 0xd8;
    oversizedJpeg[2] = 0xff;

    const result = validateDeliveryPhoto(oversizedJpeg);

    expect(result.valid).toBe(false);
  });
});
