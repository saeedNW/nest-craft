import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { Model, Document } from 'mongoose';

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
	firstItem: number; // Current page's first item number
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
 * Utility function to paginate data using Mongoose's find or aggregate methods.
 *
 * @template T - The type of the documents being paginated.
 * @param {PaginationDto} paginationDto - DTO containing pagination parameters (page, limit, and skip).
 * @param {Model<T>} model - The Mongoose model for the collection.
 * @param {any} [queryOrPipeline] - Optional query object for find or aggregation pipeline.
 * @param {string} [link] - The endpoint to which the data retrieved from.
 * @param {boolean} [isAggregate=false] - Whether to use aggregate pipeline.
 * @returns {Promise<PaginatedResult<T>>} A promise that resolves to a paginated result object.
 */
export async function paginate<T extends Document>(
	paginationDto: PaginationDto,
	model: Model<T>,
	queryOrPipeline?: any,
	link?: string,
	isAggregate: boolean = false
): Promise<PaginatedResult<T>> {
	const { page, limit } = paginationDto;
	const skip = paginationDto.skip || (page - 1) * limit;

	let totalItems: number;
	let items: T[];

	if (isAggregate) {
		// Handle aggregate queries
		const countPipeline = [...queryOrPipeline, { $count: 'total' }];
		const countResult = await model.aggregate(countPipeline).exec();
		totalItems = countResult.length > 0 ? countResult[0].total : 0;

		const paginationPipeline = [
			...queryOrPipeline,
			{
				$project: {
					password: 0,
				},
			},
			{ $skip: skip },
			{ $limit: limit },
		];
		items = await model.aggregate(paginationPipeline).exec();
	} else {
		// Handle normal find queries
		totalItems = await model.countDocuments(queryOrPipeline).exec();
		items = await model
			.find(queryOrPipeline, { password: 0 })
			.skip(skip)
			.limit(limit)
			.exec();
	}

	// Return paginated result with metadata and links
	return {
		items,
		meta: {
			totalItems,
			itemCount: items.length,
			itemsPerPage: limit,
			totalPages: Math.ceil(totalItems / limit),
			currentPage: page,
			firstItem: skip + 1,
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
	if (!link) return undefined;

	const totalPages = Math.ceil(totalItems / paginationDto.limit);

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
