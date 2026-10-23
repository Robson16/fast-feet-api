import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: "f4ce0bf8-91a6-44c8-b5b4-eadcfe0e2c90" })
  id: string = "";

  @ApiProperty({ example: "John Doe" })
  name: string = "";

  @ApiProperty({ example: "529.982.247-25" })
  cpf: string = "";

  @ApiProperty({ example: "john.doe@example.com" })
  email: string = "";

  @ApiProperty({
    example: "DELIVERER",
    enum: ["ADMIN", "DELIVERER", "RECIPIENT"],
  })
  role: string = "";

  @ApiProperty({
    type: String,
    format: "date-time",
    example: "2024-01-01T12:00:00.000Z",
  })
  createdAt: string = "";

  @ApiPropertyOptional({
    type: String,
    format: "date-time",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  updatedAt?: string | null;
}

export class UserDetailsResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto = new UserResponseDto();
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[] = [];

  @ApiProperty({ example: 1 })
  page: number = 1;

  @ApiProperty({ example: 20 })
  perPage: number = 20;
}
