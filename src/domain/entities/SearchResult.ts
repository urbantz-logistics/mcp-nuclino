export interface SearchResult {
  id: string;
  title: string;
  url: string;
  excerpt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
  nextCursor?: string;
}