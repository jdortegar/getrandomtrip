import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We import the GET handler dynamically inside tests so we can control env
// and module-level cache state between test groups.

const MAPBOX_RESPONSE = {
  features: [
    {
      text: 'Argentina',
      place_name: 'Argentina',
      properties: { short_code: 'ar' },
    },
    {
      text: 'Armenia',
      place_name: 'Armenia',
      properties: { short_code: 'am' },
    },
  ],
};

function makeRequest(q: string): Request {
  return new Request(`http://localhost/api/geo/countries?q=${encodeURIComponent(q)}`);
}

describe('GET /api/geo/countries', () => {
  beforeEach(() => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('returns 500 when MAPBOX_ACCESS_TOKEN is missing', async () => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '');
    const { GET } = await import('../countries/route');
    const res = await GET(makeRequest('arg'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns { results: [] } when query is shorter than 2 chars', async () => {
    const { GET } = await import('../countries/route');
    const res = await GET(makeRequest('a'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns normalized results on happy path', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(MAPBOX_RESPONSE), { status: 200 }),
    );
    const { GET } = await import('../countries/route');
    const res = await GET(makeRequest('arg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toContainEqual({ name: 'Argentina', code: 'AR' });
    expect(body.results).toContainEqual({ name: 'Armenia', code: 'AM' });
  });

  it('returns 200 with empty results when Mapbox returns 5xx', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 503 }),
    );
    const { GET } = await import('../countries/route');
    const res = await GET(makeRequest('arg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
  });

  it('returns 200 with empty results when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { GET } = await import('../countries/route');
    const res = await GET(makeRequest('arg'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
  });
});
