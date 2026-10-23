import { isAxiosError } from "axios";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransient = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  if (!status) return true;
  return status >= 500 || status === 429;
};

/**
 * Retries transient request failures with exponential backoff.
 *
 * @param fn - Async operation to retry.
 * @param attempts - Maximum attempt count.
 * @returns The successful operation result.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < attempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= attempts || !isTransient(error)) break;
      await sleep(250 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
