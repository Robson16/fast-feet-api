import { Destination } from "@/domain/order/enterprise/entities/destination";

export class DestinationPresenter {
  static toHTTP(destination: Destination) {
    return {
      id: destination.id.toString(),
      recipientId: destination.recipientId.toString(),
      title: destination.title,
      addressStreet: destination.addressStreet,
      addressNumber: destination.addressNumber,
      addressComplement: destination.addressComplement,
      addressZipCode: destination.addressZipCode,
      addressNeighborhood: destination.addressNeighborhood,
      addressCity: destination.addressCity,
      addressState: destination.addressState,
      addressCountry: destination.addressCountry,
      latitude: destination.latitude,
      longitude: destination.longitude,
      createdAt: destination.createdAt,
      updatedAt: destination.updatedAt,
    };
  }
}
