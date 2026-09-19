import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { normalizeApiError } from '@/types/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AuthContext keeps this in sync with the current Cognito ID token — kept here
// (rather than re-reading AsyncStorage/Cognito storage on every request) so the
// interceptor stays synchronous and doesn't depend on React state.
let currentIdToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentIdToken = token;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentIdToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentIdToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

type UnauthorizedHandler = () => void | Promise<void>;

let _onUnauthorized: UnauthorizedHandler | null = null;

// The auth context registers a callback here so a 401 anywhere in the app
// logs the user out and clears the stored token.
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  _onUnauthorized = handler;
}

// Maps MongoDB's `_id` to `id` so the rest of the app doesn't need to care
// about Mongo-specific field names.
function normalizeMongoIds<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => normalizeMongoIds(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id') {
        result.id = typeof value === 'object' && value !== null && 'toString' in value
          ? (value as { toString(): string }).toString()
          : value;
      } else if (key === '__v') {
        // skip mongoose version key
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else {
        result[key] = normalizeMongoIds(value);
      }
    }
    return result as unknown as T;
  }
  return data;
}

apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeMongoIds(response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status ?? 0;

    // On 401, clear token and invoke logout callback
    if (status === 401 && _onUnauthorized) {
      try {
        await _onUnauthorized();
      } catch {
        // ignore callback errors
      }
    }

    // Normalize all errors to our ApiError shape
    return Promise.reject(normalizeApiError(error));
  },
);
