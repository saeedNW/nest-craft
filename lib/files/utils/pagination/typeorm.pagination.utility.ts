import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from './pagination.dto';
import { PaginatedResult, PaginationLinks } from './pagination.interface';

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
export async function typeormPaginate<T extends ObjectLiteral>(
  paginationDto: PaginationDto,
  repository: Repository<T>,
  queryBuilder?: SelectQueryBuilder<T>,
  link?: string,
  distinct: boolean = false,
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
      itemsPerPage: Number(paginationDto.limit),
      totalPages: Math.ceil(totalItems / paginationDto.limit),
      currentPage: Number(paginationDto.page),
      firstItem: paginationDto.skip + 1,
    },
    links: getPaginationLinks(paginationDto, totalItems, link),
  };
}

/**
 * Generate pagination navigation links.
 *
 * @param {PaginationDto} paginationDto - DTO containing pagination parameters (page, limit, etc.).
 * @param {number} totalItems - Total number of items across all pages.
 * @param {string} link - The endpoint to which the data retrieved from.
 * @returns {PaginationLinks} An object containing navigation links.
 */
function getPaginationLinks(
  paginationDto: PaginationDto,
  totalItems: number,
  link?: string,
): PaginationLinks | undefined {
  // Return undefined if link was not provided
  if (!link) return undefined;

  const totalPages = Math.ceil(totalItems / paginationDto.limit);

  // Add '&' if link already has query parameters
  const hasQueryParams = link.includes('?');
  if (hasQueryParams) link += '&';

  // Generate links for navigation
  return {
    first: hasQueryParams
      ? `${link}&page=1&limit=${paginationDto.limit}`
      : `${link}?page=1&limit=${paginationDto.limit}`,
    previous:
      paginationDto.page > 1
        ? hasQueryParams
          ? `${link}&page=${paginationDto.page - 1}&limit=${paginationDto.limit}`
          : `${link}?page=${paginationDto.page - 1}&limit=${paginationDto.limit}`
        : '',
    next:
      paginationDto.page < totalPages
        ? hasQueryParams
          ? `${link}&page=${paginationDto.page + 1}&limit=${paginationDto.limit}`
          : `${link}?page=${paginationDto.page + 1}&limit=${paginationDto.limit}`
        : '',
    last: hasQueryParams
      ? `${link}&page=${totalPages}&limit=${paginationDto.limit}`
      : `${link}?page=${totalPages}&limit=${paginationDto.limit}`,
  };
}
