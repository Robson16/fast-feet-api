import { UseCaseError } from "@/core/errors/use-case-error";

export class InvalidDeliveryPhotoError extends Error implements UseCaseError {
  constructor(message = "Invalid delivery photo.") {
    super(message);
  }
}
