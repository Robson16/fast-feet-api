import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface PacketDetailsProps {
  packetId: UniqueEntityID;
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
  status: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class PacketDetails extends Entity<PacketDetailsProps> {
  get packetId() {
    return this.props.packetId;
  }

  get destinationId() {
    return this.props.destinationId;
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

  get status() {
    return this.props.status;
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
