import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

export interface DestinationProps {
  recipientId: UniqueEntityID;
  title: string;
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
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Destination extends Entity<DestinationProps> {
  get recipientId() {
    return this.props.recipientId;
  }

  get title() {
    return this.props.title;
  }

  set title(title: string) {
    this.props.title = title;

    this.touch();
  }

  get addressStreet() {
    return this.props.addressStreet;
  }

  set addressStreet(addressStreet: string) {
    this.props.addressStreet = addressStreet;

    this.touch();
  }

  get addressNumber() {
    return this.props.addressNumber;
  }

  set addressNumber(addressNumber: string) {
    this.props.addressNumber = addressNumber;

    this.touch();
  }

  get addressComplement() {
    return this.props.addressComplement;
  }

  set addressComplement(addressComplement: string) {
    this.props.addressComplement = addressComplement;

    this.touch();
  }

  get addressZipCode() {
    return this.props.addressZipCode;
  }

  set addressZipCode(addressZipCode: string) {
    this.props.addressZipCode = addressZipCode;

    this.touch();
  }

  get addressNeighborhood() {
    return this.props.addressNeighborhood;
  }

  set addressNeighborhood(addressNeighborhood: string) {
    this.props.addressNeighborhood = addressNeighborhood;

    this.touch();
  }

  get addressCity() {
    return this.props.addressCity;
  }

  set addressCity(addressCity: string) {
    this.props.addressCity = addressCity;

    this.touch();
  }

  get addressState() {
    return this.props.addressState;
  }

  set addressState(addressState: string) {
    this.props.addressState = addressState;

    this.touch();
  }

  get addressCountry() {
    return this.props.addressCountry;
  }

  set addressCountry(addressCountry: string | undefined) {
    this.props.addressCountry = addressCountry;

    this.touch();
  }

  get latitude() {
    return this.props.latitude;
  }

  set latitude(latitude: number) {
    this.props.latitude = latitude;

    this.touch();
  }

  get longitude() {
    return this.props.longitude;
  }

  set longitude(longitude: number) {
    this.props.longitude = longitude;

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
    props: Optional<DestinationProps, "addressCountry" | "createdAt">,
    id?: UniqueEntityID,
  ) {
    const destination = new Destination(
      {
        ...props,
        addressCountry: props.addressCountry ?? "Brazil",
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return destination;
  }
}
