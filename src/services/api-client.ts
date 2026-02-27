/**
 * API Client with interceptor pattern.
 * 
 * In production, this integrates with your backend via Axios.
 * Currently provides a mock implementation for frontend development.
 * 
 * Security notes:
 * - Tokens should be stored in HTTP-only cookies (backend responsibility)
 * - This client handles token refresh via interceptors
 * - All requests include CSRF tokens when available
 */

import { API_CONFIG } from "@/config/api";

interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // CSRF token would be read from meta tag or cookie
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
    return headers;
  }

  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${config.url}`;
    const headers = { ...this.getHeaders(), ...config.headers };

    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
        credentials: "include", // Send HTTP-only cookies
      });

      if (response.status === 401) {
        // Attempt token refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.request(config);
        }
        // Dispatch auth failure event
        window.dispatchEvent(new CustomEvent("auth:logout"));
        throw new Error("Authentication failed");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.message || "Request failed", error);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, "Network error. Please check your connection.");
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  get<T>(url: string, params?: Record<string, string>) {
    return this.request<T>({ method: "GET", url, params });
  }

  post<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "POST", url, data });
  }

  put<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "PUT", url, data });
  }

  patch<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "PATCH", url, data });
  }

  delete<T>(url: string) {
    return this.request<T>({ method: "DELETE", url });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = new ApiClient();
