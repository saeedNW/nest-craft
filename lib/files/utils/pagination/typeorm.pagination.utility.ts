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
 * @param {string} [link] - The endpoint to which the data retrieved from.
 * @returns {PaginationLinks} An object containing navigation links.
 */
function getPaginationLinks(
  paginationDto: PaginationDto,
  totalItems: number,
  link?: string,
): PaginationLinks | undefined {
  if (!link) return undefined;

  const totalPages = Math.ceil(totalItems / paginationDto.limit);
  const currentPage = paginationDto.page;

  // Helper function to build URL for a specific page
  const buildUrl = (page: number): string => {
    try {
      // Check if link is a full URL (with protocol) or relative path
      let url: URL;
      if (link!.startsWith('http://') || link!.startsWith('https://')) {
        // Full URL
        url = new URL(link!);
      } else {
        // Relative path - use a dummy base URL to parse it
        url = new URL(link!, 'http://dummy.com');
      }

      // Update pagination parameters
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(paginationDto.limit));

      // If it was a relative path, return only the pathname and search
      if (!link!.startsWith('http://') && !link!.startsWith('https://')) {
        return url.pathname + url.search;
      }

      // Return full URL
      return url.toString();
    } catch {
      // Fallback to simple string manipulation if URL parsing fails
      const hasQueryParams = link!.includes('?');
      const separator = hasQueryParams ? '&' : '?';
      return `${link}${separator}page=${page}&items_per_page=${paginationDto.limit}`;
    }
  };

  return [
    {
      // First page link - always include, null if on first page or only one page
      label: 'First',
      url: currentPage > 1 && totalPages > 1 ? buildUrl(1) : null,
      page: currentPage > 1 && totalPages > 1 ? 1 : null,
    },
    {
      // Previous page link - always include, null if on first page
      label: 'Previous',
      url: currentPage > 1 ? buildUrl(currentPage - 1) : null,
      page: currentPage > 1 ? currentPage - 1 : null,
    },
    {
      // Next page link - always include, null if on last page
      label: 'Next',
      url: currentPage < totalPages ? buildUrl(currentPage + 1) : null,
      page: currentPage < totalPages ? currentPage + 1 : null,
    },
    {
      // Last page link - always include, null if on last page or only one page
      label: 'Last',
      url: currentPage < totalPages && totalPages > 1 ? buildUrl(totalPages) : null,
      page: currentPage < totalPages && totalPages > 1 ? totalPages : null,
    },
  ];
}
