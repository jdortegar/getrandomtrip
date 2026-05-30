import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const MAPBOX_CITY_RESPONSE = {
  features: [
    {
      text: 'Buenos Aires',
      place_name: 'Buenos Aires, Buenos Aires F.D., Argentina',
      context: [{ id: 'country.1', short_code: 'ar' }],
    },
    {
      text: 'Bahía Blanca',
      place_name: 'Bahía Blanca, Buenos Aires, Argentina',
      context: [{ id: 'country.1', short_code: 'ar' }],
    },
  ],
};

function makeRequest(q: string, countryCode?: string): Request {
  const params = new URLSearchParams({ q });
  if (countryCode) params.set('countryCode', countryCode);
  return new Request(`http://localhost/api/geo/cities?${params.toString()}`);
}

describe('GET /api/geo/cities', () => {
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
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('bue', 'AR'));
    expect(res.status).toBe(500);
  });

  it('returns 400/empty when countryCode is missing', async () => {
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('bue'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
  });

  it('returns { results: [] } when query is shorter than 2 chars', async () => {
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('b', 'AR'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns normalized city results on happy path', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(MAPBOX_CITY_RESPONSE), { status: 200 }),
    );
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('bue', 'AR'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0]).toMatchObject({
      name: 'Buenos Aires',
      placeName: 'Buenos Aires, Buenos Aires F.D., Argentina',
      countryCode: 'AR',
    });
  });

  it('returns 200 with empty results when Mapbox returns 5xx', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('error', { status: 503 }),
    );
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('bue', 'AR'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
  });

  it('returns 200 with empty results when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { GET } = await import('../cities/route');
    const res = await GET(makeRequest('bue', 'AR'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ results: [] });
  });
});
