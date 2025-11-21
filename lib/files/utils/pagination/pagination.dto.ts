import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ type: 'integer', example: 1 })
  @Transform(params => (!params.value ? 1 : parseInt(String(params.value))))
  @IsNumber()
  @Expose()
  page: number;

  @ApiPropertyOptional({ type: 'integer', example: 10 })
  @Transform(params => (!params.value ? 10 : parseInt(String(params.value))))
  @IsNumber()
  @Expose()
  limit: number;

  get skip() {
    return (this.page - 1) * this.limit;
  }
}
