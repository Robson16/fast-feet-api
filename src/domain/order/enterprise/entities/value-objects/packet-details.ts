import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ValueObject } from "@/core/entities/value-object";

export interface PacketDetailsProps {
  packetId: UniqueEntityID;
  recipientId: UniqueEntityID;
  delivererId?: UniqueEntityID | null;
  destinationId: UniqueEntityID;
  recipient: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressZipCode: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCountry?: string;
  latitude: number;
  longitude: number;
  status: string;
  deliveryPhotoKey?: string;
  deliveryPhotoMimeType?: string;
  deliveryPhotoSize?: number;
  deliveryPhotoUploadedAt?: Date;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class PacketDetails extends ValueObject<PacketDetailsProps> {
  get packetId() {
    return this.props.packetId;
  }

  get destinationId() {
    return this.props.destinationId;
  }

  get recipientId() {
    return this.props.recipientId;
  }

  get delivererId() {
    return this.props.delivererId;
  }

  get recipient() {
    return this.props.recipient;
  }

  get addressStreet() {
    return this.props.addressStreet;
  }

  get addressNumber() {
    return this.props.addressNumber;
  }

  get addressComplement() {
    return this.props.addressComplement;
  }

  get addressZipCode() {
    return this.props.addressZipCode;
  }

  get addressNeighborhood() {
    return this.props.addressNeighborhood;
  }

  get addressCity() {
    return this.props.addressCity;
  }

  get addressState() {
    return this.props.addressState;
  }

  get addressCountry() {
    return this.props.addressCountry;
  }

  get latitude() {
    return this.props.latitude;
  }

  get longitude() {
    return this.props.longitude;
  }

  get status() {
    return this.props.status;
  }

  get deliveryPhotoKey() {
    return this.props.deliveryPhotoKey;
  }

  get deliveryPhotoMimeType() {
    return this.props.deliveryPhotoMimeType;
  }

  get deliveryPhotoSize() {
    return this.props.deliveryPhotoSize;
  }

  get deliveryPhotoUploadedAt() {
    return this.props.deliveryPhotoUploadedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(props: PacketDetailsProps) {
    return new PacketDetails(props);
  }
}
