import type { ApiErrorResponse } from "@gibtu/shared";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    return "http://127.0.0.1:8787";
  }
  return url.replace(/\/+$/, "");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let code = "HTTP_ERROR";
    let message = `İstek başarısız oldu (${response.status}).`;

    try {
      const errorBody = (await response.json()) as Partial<ApiErrorResponse>;
      if (errorBody.error) {
        code = errorBody.error.code;
        message = errorBody.error.message;
      }
    } catch {
      // Non-JSON error response; keep fallback error message.
    }

    throw new ApiClientError(response.status, code, message);
  }

  return (await response.json()) as T;
}
