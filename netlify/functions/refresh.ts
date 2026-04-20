const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface NetlifyEvent {
  httpMethod: string;
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const siteUrl = process.env.URL || 'http://localhost:8888';

  try {
    const response = await fetch(`${siteUrl}/api/museums.json`);
    if (!response.ok) throw new Error(`Static fetch failed: ${response.status}`);

    const payload = (await response.json()) as { data: unknown[]; diagnostics: Record<string, unknown> };
    const refreshedAt = new Date().toISOString();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        data: payload.data,
        diagnostics: {
          ...payload.diagnostics,
          refreshAttempted: true,
          refreshSkipped: false,
          refreshReason: 'manual',
          lastSyncAt: refreshedAt,
          message: 'Refreshed from pre-generated synthetic snapshot.',
        },
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message }) };
  }
};
