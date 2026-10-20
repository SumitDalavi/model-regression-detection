export function isLiveOpenAIKey(key?: string): boolean {
  return !!key && key.startsWith('sk-') && !key.startsWith('sk-dummy') && key.length >= 20;
}

export function detectMode() {
  const isLive = isLiveOpenAIKey(process.env.OPENAI_API_KEY);
  return {
    openai: isLive ? 'live' : 'mock',
    database: 'mock', // In-memory SQLite via sql.js
  };
}
