import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'newPassword must be at least 8 characters long' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'newPassword must contain at least one uppercase letter and one number',
  })
  newPassword: string;
}
