import axios, { AxiosInstance, AxiosError } from 'axios';
import { Lifelog, LifelogsResponse, LifelogsSearchParams, ApiError } from '../types/lifelogs';

export class LimitlessClient {
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.limitless.ai/v1';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || 'Unknown error occurred',
        };

        if (error.response) {
          apiError.status = error.response.status;

          // Handle rate limiting
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            if (retryAfter) {
              apiError.retryAfter = parseInt(retryAfter, 10);
            }
            apiError.message = `Rate limit exceeded. Retry after ${apiError.retryAfter || 'a few'} seconds.`;
          } else if (error.response.status === 401) {
            apiError.message = 'Invalid API key. Please check your credentials.';
          } else if (error.response.status === 404) {
            apiError.message = 'Resource not found.';
          } else if (error.response.data && typeof error.response.data === 'object') {
            apiError.message = (error.response.data as any).message || apiError.message;
          }
        }

        throw apiError;
      }
    );
  }

  /**
   * Search lifelogs with various filters
   */
  async searchLifelogs(params: LifelogsSearchParams = {}): Promise<LifelogsResponse> {
    try {
      const response = await this.client.get<LifelogsResponse>('/lifelogs', {
        params: {
          ...params,
          // Set sensible defaults
          limit: Math.min(params.limit || 3, 10), // API max is 10
          direction: params.direction || 'desc',
          includeMarkdown: params.includeMarkdown !== false,
          includeHeadings: params.includeHeadings !== false,
          includeContents: params.includeContents || false,
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific lifelog by ID
   */
  async getLifelog(id: string): Promise<Lifelog> {
    try {
      const response = await this.client.get<{ data: Lifelog }>(`/lifelogs/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a lifelog by ID
   */
  async deleteLifelog(id: string): Promise<void> {
    try {
      await this.client.delete(`/lifelogs/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get paginated results across all lifelogs
   */
  async getAllLifelogs(
    params: Omit<LifelogsSearchParams, 'cursor'> = {},
    maxResults: number = 50
  ): Promise<Lifelog[]> {
    const allLifelogs: Lifelog[] = [];
    let cursor: string | undefined;
    let totalFetched = 0;

    while (totalFetched < maxResults) {
      const remaining = maxResults - totalFetched;
      const limit = Math.min(remaining, 10); // API max is 10

      const response = await this.searchLifelogs({
        ...params,
        cursor,
        limit,
      });

      allLifelogs.push(...response.data.lifelogs);
      totalFetched += response.data.lifelogs.length;

      // Check if there are more results
      cursor = response.meta.lifelogs.nextCursor;
      if (!cursor || response.data.lifelogs.length === 0) {
        break;
      }
    }

    return allLifelogs;
  }

  /**
   * Search lifelogs by natural language query
   */
  async searchByQuery(
    query: string,
    options: {
      dateRange?: { start: string; end: string };
      timezone?: string;
      maxResults?: number;
    } = {}
  ): Promise<Lifelog[]> {
    const params: LifelogsSearchParams = {
      search: query,
      limit: Math.min(options.maxResults || 10, 10),
      includeMarkdown: true,
      includeHeadings: true,
      includeContents: true,
    };

    if (options.dateRange) {
      params.start = options.dateRange.start;
      params.end = options.dateRange.end;
    }

    if (options.timezone) {
      params.timezone = options.timezone;
    }

    return this.getAllLifelogs(params, options.maxResults || 50);
  }

  /**
   * Get lifelogs for a specific date
   */
  async getLifelogsByDate(
    date: string,
    options: {
      timezone?: string;
      maxResults?: number;
    } = {}
  ): Promise<Lifelog[]> {
    return this.getAllLifelogs(
      {
        date,
        timezone: options.timezone,
        includeMarkdown: true,
        includeHeadings: true,
        includeContents: true,
      },
      options.maxResults || 20
    );
  }

  /**
   * Get recent lifelogs (last N days)
   */
  async getRecentLifelogs(
    days: number = 7,
    options: {
      timezone?: string;
      maxResults?: number;
    } = {}
  ): Promise<Lifelog[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.getAllLifelogs(
      {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timezone: options.timezone,
        includeMarkdown: true,
        includeHeadings: true,
        includeContents: true,
      },
      options.maxResults || 100
    );
  }

  private handleError(error: any): ApiError {
    if (error instanceof Error && 'message' in error) {
      return error as ApiError;
    }
    return {
      message: 'An unexpected error occurred',
    };
  }
}