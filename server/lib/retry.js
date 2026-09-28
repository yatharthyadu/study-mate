// Retries a Gemini call when the API is busy (503) or rate-limited (429).
// Waits 1s, 2s, 4s... between attempts (exponential backoff).

const RETRYABLE_STATUS = [429, 503];

function isRetryable(err) {
  const status = err?.status ?? err?.code;
  return RETRYABLE_STATUS.includes(status) || /\b(429|503)\b|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(err?.message || '');
}

export async function withRetry(fn, { retries = 3, baseDelayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`Gemini busy (${err.status || err.message}), retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
