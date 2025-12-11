import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ type: 'integer', example: 1 })
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  @IsNumber()
  @Expose()
  page: number = 1;

  @ApiPropertyOptional({ type: 'integer', example: 10 })
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  @IsNumber()
  @Expose()
  limit: number = 10;

  @ApiPropertyOptional({ example: 'name', description: 'field to sort by' })
  @IsOptional()
  @IsString()
  @Expose()
  sort?: string;

  @ApiPropertyOptional({ example: 'ASC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @Expose()
  order?: 'ASC' | 'DESC';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Expose()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
	filter?: Record<string, any>;

  // computed
  get skip() {
    return (this.page - 1) * this.limit;
  }
}


//? Filter Implementation Example
/**
	 export class FilterDto {
		@ApiPropertyOptional({
			type: Boolean,
			description: "Filter by read status",
			example: true,
		})
		@IsOptional()
		@Transform(({ value }) => {
			if (value === "true" || value === true) return true;
			if (value === "false" || value === false) return false;
			return value as boolean;
		})
		@IsBoolean()
		@Expose()
		read?: boolean;
	}

	export class FindAllDataDto extends PaginationDto {
		@ApiPropertyOptional({
			type: () => FilterDto,
			example: { read: true },
			description: "Filter object with predefined values. Example: { read: true } or { read: false }",
		})
		@IsOptional()
		@ValidateNested()
		@Type(() => FilterDto)
		@Expose()
		declare filter?: FilterDto;
	}
*/
