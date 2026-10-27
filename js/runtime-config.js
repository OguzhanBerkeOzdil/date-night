/** Public runtime values only. Never put a service-role key in this file. */
export const RUNTIME_CONFIG = Object.freeze({
  get questApiUrl() {
    return globalThis.__QUEST_API_URL__ || "";
  },
});
