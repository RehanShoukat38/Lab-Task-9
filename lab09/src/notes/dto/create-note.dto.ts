import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'tags array must contain at most 5 elements' })
  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(20, {
    each: true,
    message: 'each tag must not exceed 20 characters',
  })
  tags?: string[];
}
