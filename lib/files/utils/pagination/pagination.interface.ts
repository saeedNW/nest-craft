/**
 * Individual pagination link item.
 */
export interface PaginationLinkItem {
  label: string; // Display label for the link
  url: string | null; // URL for the link, null if not available
  page: number | null; // Page number, null if not applicable
}

/**
 * Links for pagination navigation.
 */
export type PaginationLinks = Array<PaginationLinkItem>;

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
 * Result of a paginated query.
 * @template T - The type of the items being paginated
 */
export interface PaginatedResult<T> {
  items: T[]; // The list of items for the current page
  meta: PaginationMeta; // Metadata about pagination
  links?: PaginationLinks; // Links for navigation
}
