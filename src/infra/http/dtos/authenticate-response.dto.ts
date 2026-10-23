import { ApiProperty } from "@nestjs/swagger";

export class AuthenticateResponseDto {
  @ApiProperty({ example: "access-token" })
  access_token: string = "";
}
