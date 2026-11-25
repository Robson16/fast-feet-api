import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

export type PacketStatus =
  "DELIVERED" | "RETURNED" | "WITHDRAWN" | "AWAITING_WITHDRAWAL";

export interface PacketProps {
  destinationId: UniqueEntityID;
  delivererId?: UniqueEntityID;
  status: PacketStatus;
  deliveryPhotoKey?: string;
  deliveryPhotoMimeType?: string;
  deliveryPhotoSize?: number;
  deliveryPhotoUploadedAt?: Date;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Packet extends Entity<PacketProps> {
  get destinationId() {
    return this.props.destinationId;
  }

  get delivererId() {
    return this.props.delivererId;
  }

  set delivererId(delivererId: UniqueEntityID | undefined) {
    this.props.delivererId = delivererId;

    this.touch();
  }

  get status() {
    return this.props.status;
  }

  set status(status: PacketStatus) {
    this.props.status = status;

    this.touch();
  }

  get deliveryPhotoKey() {
    return this.props.deliveryPhotoKey;
  }

  set deliveryPhotoKey(deliveryPhotoKey: string | undefined) {
    this.props.deliveryPhotoKey = deliveryPhotoKey;

    this.touch();
  }

  get deliveryPhotoMimeType() {
    return this.props.deliveryPhotoMimeType;
  }

  set deliveryPhotoMimeType(deliveryPhotoMimeType: string | undefined) {
    this.props.deliveryPhotoMimeType = deliveryPhotoMimeType;

    this.touch();
  }

  get deliveryPhotoSize() {
    return this.props.deliveryPhotoSize;
  }

  set deliveryPhotoSize(deliveryPhotoSize: number | undefined) {
    this.props.deliveryPhotoSize = deliveryPhotoSize;

    this.touch();
  }

  get deliveryPhotoUploadedAt() {
    return this.props.deliveryPhotoUploadedAt;
  }

  set deliveryPhotoUploadedAt(deliveryPhotoUploadedAt: Date | undefined) {
    this.props.deliveryPhotoUploadedAt = deliveryPhotoUploadedAt;

    this.touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<PacketProps, "status" | "createdAt">,
    id?: UniqueEntityID,
  ) {
    const packet = new Packet(
      {
        ...props,
        status: props.status ?? "AWAITING_WITHDRAWAL",
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return packet;
  }
}
