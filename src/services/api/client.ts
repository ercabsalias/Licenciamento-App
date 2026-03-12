import { env } from '@/config/env';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  contentType?: 'json' | 'form';
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, config);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, config);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, config);
  }

  /**
   * Generic request handler
   */
  private async request<T>(
    method: string,
    endpoint: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`);

    if (env.enableLogging) {
      console.log(`API Request: ${method} ${url.toString()}`);
      console.log(`  baseUrl = ${this.baseUrl}`);
    }

    // Add query parameters
    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = this.buildHeaders(config?.headers, config?.contentType);
    const timeout = config?.timeout || this.timeout;

    // Prepare request body
    let requestBody: string | undefined;
    if (config?.body) {
      if (config.contentType === 'form') {
        const formData = new URLSearchParams();
        Object.entries(config.body as Record<string, string>).forEach(([key, value]) => {
          formData.append(key, value);
        });
        requestBody = formData.toString();
      } else {
        requestBody = JSON.stringify(config.body);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error body for message details
        let errMessage = response.statusText || `HTTP_${response.status}`;
        try {
          const text = await response.text();
          if (text) {
            // attempt to extract JSON {message}
            try {
              const obj = JSON.parse(text);
              if (obj && typeof obj === 'object' && obj.message) {
                errMessage = obj.message;
              } else {
                errMessage = text;
              }
            } catch {
              // not JSON, just use raw text
              errMessage = text;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errMessage,
          },
        };
      }

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      if (env.enableLogging) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
      }

      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: Record<string, string>, contentType?: 'json' | 'form'): Record<string, string> {
    const headers: Record<string, string> = {
      ...customHeaders,
    };

    // Only set Content-Type if not already set in custom headers
    if (!headers['Content-Type']) {
      if (contentType === 'form') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        headers['Content-Type'] = 'application/json';
      }
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl, env.apiTimeout);
