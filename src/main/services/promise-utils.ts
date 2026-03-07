/**
 * Promise utility functions for async operations
 */

/**
 * Wraps a Promise with a timeout
 * @param promise Promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns Promise that rejects if timeout is reached
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retries a Promise-returning function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the result or rejects after all retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);
        onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Wraps a callback-based function to return a Promise
 * @param fn Function that accepts a callback as its last parameter
 * @returns Promise-wrapped version of the function
 */
export function promisify<T, Args extends unknown[]>(
  fn: (...args: [...Args, (error: Error | null, result?: T) => void]) => void,
): (...args: Args) => Promise<T> {
  return (...args: Args): Promise<T> => {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else if (result !== undefined) {
          resolve(result);
        } else {
          reject(new Error('No result returned'));
        }
      });
    });
  };
}

/**
 * Creates a cancellable Promise
 * @param executor Promise executor function
 * @returns Object with promise and cancel function
 */
export function createCancellablePromise<T>(
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void,
    onCancel: (handler: () => void) => void,
  ) => void,
): { promise: Promise<T>; cancel: () => void } {
  let cancelHandler: (() => void) | null = null;
  let isCancelled = false;

  const promise = new Promise<T>((resolve, reject) => {
    executor(
      (value) => {
        if (!isCancelled) resolve(value);
      },
      (reason) => {
        if (!isCancelled) reject(reason);
      },
      (handler) => {
        cancelHandler = handler;
      },
    );
  });

  const cancel = () => {
    isCancelled = true;
    cancelHandler?.();
  };

  return { promise, cancel };
}

/**
 * Runs multiple promises in parallel with a concurrency limit
 * @param items Items to process
 * @param fn Async function to run for each item
 * @param concurrency Maximum concurrent operations
 * @returns Promise that resolves when all operations complete
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const promise = fn(item, i).then((result) => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1,
      );
    }
  }

  await Promise.all(executing);
  return results;
}
