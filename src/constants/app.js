// ====================================================================
// App-Wide Constants
//
// Purpose:
// Centralizes non-navigation constants used across multiple modules so
// that page sizes, query keys, and latency values are defined once and
// referenced everywhere by name.
//
// Contents:
//   - DEFAULT_PAGE_SIZE / PAGE_SIZE_OPTIONS — shared by DataTable and Pagination.
//   - QUERY_KEYS — stable cache keys for TanStack Query (avoids string-literal drift).
//   - SIMULATED_LATENCY — dev-only delay to surface loading states in placeholder pages.
// ====================================================================

// Misc app-wide constants

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

export const QUERY_KEYS = {
  dashboard: ['dashboard'],
  schools: ['schools'],
  colleges: ['colleges'],
  domains: ['domains'],
  students: ['students'],
  users: ['users'],
}

// Simulated latency for dev placeholder loading states (ms).
export const SIMULATED_LATENCY = 600
