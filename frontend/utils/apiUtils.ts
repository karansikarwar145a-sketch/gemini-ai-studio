
export const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Check for 503 or "model is overloaded" messages
      if (err.toString().includes('503') || err.toString().includes('overloaded')) {
        // Exponential backoff
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      } else {
        // Don't retry on other errors
        throw err;
      }
    }
  }
  throw lastError;
};
