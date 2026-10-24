// Storybook-only adapter for the live Wikipedia Recent Changes API (see README "Part 4").
// It does in the browser what the D_WikiRecentChanges data page and its request/response
// data transforms do in Pega, so the widget can run against a real continuation-token API.

export const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

type WikiChange = {
  rcid: number;
  title: string;
  user: string;
  comment: string;
  timestamp: string;
  oldlen: number;
  newlen: number;
};

type WikiResponse = {
  continue?: { rccontinue?: string };
  query?: { recentchanges?: WikiChange[] };
  error?: { code: string; info: string };
};

/** Request data transform: data page parameters → Wikipedia query string. */
export const buildWikipediaUrl = (parameters: Record<string, unknown> = {}): string => {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    list: 'recentchanges',
    rctype: 'edit',
    rcnamespace: '0',
    rcprop: 'title|timestamp|user|comment|sizes|ids',
    rclimit: String(parameters.maxRecords ?? 50)
  });
  // Newest first: rcstart is the newer bound (toDate), rcend the older one (fromDate).
  if (parameters.toDate) query.set('rcstart', String(parameters.toDate));
  if (parameters.fromDate) query.set('rcend', String(parameters.fromDate));
  // Never send an empty token: Wikipedia rejects rccontinue= with "badcontinue".
  if (parameters.startIdentifier) query.set('rccontinue', String(parameters.startIdentifier));
  return `${WIKIPEDIA_API}?${query.toString()}`;
};

/** Response data transform: Wikipedia response → { Entries, NextIdentifier, IsLastPage }. */
export const mapWikipediaResponse = (response: WikiResponse) => {
  if (response.error) {
    throw new Error(`Wikipedia API error ${response.error.code}: ${response.error.info}`);
  }
  const nextToken = response.continue?.rccontinue ?? '';
  return {
    Entries: response.query?.recentchanges ?? [],
    NextIdentifier: nextToken,
    IsLastPage: !nextToken
  };
};

/** getPageDataAsync implementation backed by the live API. */
export const createWikipediaDataPage =
  (fetchImpl: typeof fetch = (...args) => fetch(...args)) =>
  async (_dataPage: string, _context?: string, parameters?: Record<string, unknown>) => {
    const res = await fetchImpl(buildWikipediaUrl(parameters), {
      headers: {
        'Api-User-Agent': 'PegaDXTokenScrollListStorybook/1.0 (github.com/atanus1502/constellation-dx-components)'
      }
    });
    if (!res.ok) throw new Error(`Wikipedia API returned HTTP ${res.status}`);
    return mapWikipediaResponse((await res.json()) as WikiResponse);
  };

/** A window ending now, so the story always has recent edits to page through. */
export const recentWindow = (minutes: number, now = new Date()) => ({
  fromDate: new Date(now.getTime() - minutes * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
  toDate: now.toISOString().replace(/\.\d{3}Z$/, 'Z')
});
