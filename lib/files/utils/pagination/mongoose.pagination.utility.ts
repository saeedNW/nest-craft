import { Document, FilterQuery, Model, PipelineStage } from 'mongoose';
import { PaginationDto } from './pagination.dto';
import { PaginatedResult, PaginationLinks } from './pagination.interface';

/**
 * Utility function to paginate data using Mongoose's find or aggregate methods.
 *
 * @template T - The type of the documents being paginated.
 * @param {PaginationDto} paginationDto - DTO containing pagination parameters (page, limit, and skip).
 * @param {Model<T>} model - The Mongoose model for the collection.
 * @param {any} [queryOrPipeline] - Optional query object for find or aggregation pipeline.
 * @param {string} [link] - The endpoint to which the data retrieved from.
 * @param {boolean} [isAggregate=false] - Whether to use aggregate pipeline.
 * @param {Record<string, any>} [projection={}] - Projection object for find or aggregate.
 * @returns {Promise<PaginatedResult<T>>} A promise that resolves to a paginated result object.
 */
export async function mongoPaginate<T extends Document>(
  paginationDto: PaginationDto,
  model: Model<T>,
  queryOrPipeline?: FilterQuery<T> | PipelineStage[],
  link?: string,
  isAggregate: boolean = false,
  projection: Record<string, any> = {},
): Promise<PaginatedResult<T>> {
  const { page, limit } = paginationDto;
  const skip = paginationDto.skip || (page - 1) * limit;

  let totalItems: number;
  let items: T[];

  if (isAggregate) {
    // Handle aggregate queries
    const pipeline = queryOrPipeline as PipelineStage[];
    const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' }];
    const countResult = await model.aggregate(countPipeline).exec();
    totalItems = countResult.length > 0 ? Number(countResult[0].total) : 0;

    const paginationPipeline: PipelineStage[] = [...pipeline, { $skip: skip }, { $limit: limit }];

    if (Object.keys(projection).length > 0) {
      paginationPipeline.push({ $project: projection });
    }

    items = (await model.aggregate(paginationPipeline).exec()) as T[];
  } else {
    // Handle normal find queries
    const filter = queryOrPipeline as FilterQuery<T>;

    totalItems = await model.countDocuments(filter).exec();
    items = await model.find(filter, projection).skip(skip).limit(limit).exec();
  }

  // Return paginated result with metadata and links
  return {
    items,
    meta: {
      totalItems,
      itemCount: items.length,
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
      firstItem: skip + 1,
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
