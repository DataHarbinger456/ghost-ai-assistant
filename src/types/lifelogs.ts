export interface Lifelog {
  id: string;
  title: string;
  markdown: string;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
  isStarred: boolean;
}

export interface LifelogsResponse {
  data: {
    lifelogs: Lifelog[];
  };
  meta: {
    lifelogs: {
      nextCursor?: string;
      count: number;
    };
  };
}

export interface LifelogsSearchParams {
  date?: string;           // YYYY-MMDD format
  start?: string;          // Modified ISO-8601 format
  end?: string;            // Modified ISO-8601 format
  timezone?: string;       // IANA timezone specifier
  search?: string;         // Natural language search query
  limit?: number;          // Max 10, defaults to 3
  direction?: 'asc' | 'desc'; // defaults to 'desc'
  cursor?: string;         // For pagination
  includeMarkdown?: boolean;
  includeHeadings?: boolean;
  includeContents?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  retryAfter?: number; // For rate limiting
}