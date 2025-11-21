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
  link: string | undefined,
  paginationDto: PaginationDto,
  totalItems: number,
): PaginationLinks | undefined {
  if (!link) return undefined;

  const totalPages = Math.ceil(totalItems / paginationDto.limit);

  // Add '&' if link already has query parameters
  if (link.includes('?')) link += '&';

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
