/**
 * Metadata for pagination details.
 */
export interface PaginationMeta {
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
export interface PaginationLinks {
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
  links?: PaginationLinks; // Links for navigation
}
