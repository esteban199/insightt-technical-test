export interface ApiError {
  status: number;
  code: string;
  message: string;
}

interface GraphQLErrorBody {
  message?: string;
  extensions?: { code?: string; http?: { status?: number } };
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { code?: string; message?: string; errors?: GraphQLErrorBody[] };
      };
      message?: string;
    };

    // GraphQL responses put errors in a `data.errors[]` array instead of a flat body.
    const gqlError = axiosError.response?.data?.errors?.[0];
    if (gqlError) {
      return {
        status: gqlError.extensions?.http?.status ?? axiosError.response?.status ?? 0,
        code: gqlError.extensions?.code ?? 'UNKNOWN',
        message: gqlError.message ?? 'An unexpected error occurred.',
      };
    }

    return {
      status: axiosError.response?.status ?? 0,
      code: axiosError.response?.data?.code ?? 'UNKNOWN',
      message:
        axiosError.response?.data?.message ??
        axiosError.message ??
        'An unexpected error occurred.',
    };
  }

  // Cognito SDK errors are Error instances with a `code` set to the exception
  // name (e.g. "UserNotConfirmedException", "NotAuthorizedException").
  if (error instanceof Error) {
    const rawCode = (error as { code?: unknown }).code;
    const code = typeof rawCode === 'string' ? rawCode : 'UNKNOWN';
    return { status: 0, code, message: error.message };
  }

  return {
    status: 0,
    code: 'UNKNOWN',
    message: 'An unexpected error occurred.',
  };
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    'message' in error
  );
}
