import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { SelectQueryBuilder, Repository } from 'typeorm';

export class PaginationDto {
	@ApiPropertyOptional({ type: 'integer', example: 1 })
	@Transform((params) => (!params.value ? 1 : parseInt(params.value)))
	@IsNumber()
	@Expose()
	page: number;

	@ApiPropertyOptional({ type: 'integer', example: 10 })
	@Transform((params) => (!params.value ? 10 : parseInt(params.value)))
	@IsNumber()
	@Expose()
	limit: number;

	get skip() {
		return (this.page - 1) * this.limit;
	}
}

/**
 * Metadata for pagination details.
 */
interface PaginationMeta {
	totalItems: number; // Total number of items across all pages
	itemCount: number; // Number of items on the current page
	itemsPerPage: number; // Number of items per page
	totalPages: number; // Total number of pages
	currentPage: number; // Current page number
}

/**
 * Links for pagination navigation.
 */
interface PaginationLinks {
	first: string; // Link to the first page
	previous: string; // Link to the previous page
	next: string; // Link to the next page
	last: string; // Link to the last page
}

/**
 * Result of a paginated query.
 * @template T - The type of the items being paginated
 */
export interface PaginatedResult<T> {
	items: T[]; // The list of items for the current page
	meta: PaginationMeta; // Metadata about pagination
	links: PaginationLinks; // Links for navigation
}

/**
 * Utility function to paginate data using TypeORM's repository or query builder.
 *
 * @template T - The type of the entities being paginated.
 * @param {PaginationDto} paginationDto - DTO containing pagination parameters (page, limit, and skip).
 * @param {Repository<T>} repository - The repository for the entity.
 * @param {SelectQueryBuilder<T>} [queryBuilder] - Optional query builder for custom queries.
 * @param {string} [link] - The endpoint to which the data retrieved from.
 * @param {boolean} [distinct=false] - Whether to count distinct items only (useful for complex queries).
 * @returns {Promise<PaginatedResult<T>>} A promise that resolves to a paginated result object.
 */
export async function paginate<T>(
	paginationDto: PaginationDto,
	repository: Repository<T>,
	queryBuilder?: SelectQueryBuilder<T>,
	link?: string,
	distinct: boolean = false
): Promise<PaginatedResult<T>> {
	let totalItems: number; // Total number of items across all pages
	let items: T[]; // Items for the current page

	if (queryBuilder) {
		// Use query builder for advanced queries
		totalItems = await queryBuilder
			.clone()
			.select(distinct ? 'DISTINCT entity.id' : 'entity.id') // Add DISTINCT if required
			.getCount();

		// Apply pagination (skip and limit)
		queryBuilder.skip(paginationDto.skip).take(paginationDto.limit);

		// Fetch the paginated items
		items = await queryBuilder.getMany();
	} else {
		// Use repository for simple pagination
		const [data, count] = await repository.findAndCount({
			skip: paginationDto.skip, // Number of items to skip
			take: paginationDto.limit, // Number of items to take
		});
		totalItems = count;
		items = data;
	}

	// Return paginated result with metadata and links
	return {
		items,
		meta: {
			totalItems,
			itemCount: items.length,
			itemsPerPage: paginationDto.limit,
			totalPages: Math.ceil(totalItems / paginationDto.limit),
			currentPage: paginationDto.page,
		},
		links: getPaginationLinks(link, paginationDto, totalItems),
	};
}

/**
 * Generate pagination navigation links.
 *
 * @param {string} link - The endpoint to which the data retrieved from.
 * @param {PaginationDto} paginationDto - DTO containing pagination parameters (page, limit, etc.).
 * @param {number} totalItems - Total number of items across all pages.
 * @returns {PaginationLinks} An object containing navigation links.
 */
function getPaginationLinks(
	link: string,
	paginationDto: PaginationDto,
	totalItems: number
): PaginationLinks {
	// Return undefined if link was not provided
	if (!link) return undefined;

	const totalPages = Math.ceil(totalItems / paginationDto.limit);

	// Generate links for navigation
	return {
		first: `${link}?page=1&limit=${paginationDto.limit}`,
		previous:
			paginationDto.page > 1
				? `${link}?page=${paginationDto.page - 1}&limit=${paginationDto.limit}`
				: '',
		next:
			paginationDto.page < totalPages
				? `${link}?page=${paginationDto.page + 1}&limit=${paginationDto.limit}`
				: '',
		last: `${link}?page=${totalPages}&limit=${paginationDto.limit}`,
	};
}
