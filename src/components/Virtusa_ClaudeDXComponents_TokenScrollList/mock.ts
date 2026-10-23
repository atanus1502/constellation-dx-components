// Simulates a third-party API that pages with a continuation token, mapped by a Pega data page into
// { Entries: [...], NextIdentifier: 'TOKEN_51', IsLastPage: false }.

export type MockTransaction = {
  transactionId: string;
  postedDate: string;
  description: string;
  amount: number;
  status: string;
};

const MERCHANTS = [
  'Northwind Grocers',
  'Contoso Fuel Station',
  'Fabrikam Electronics',
  'Adventure Works Outdoor',
  'Tailspin Airlines',
  'Wide World Importers',
  'Litware Software Subscription',
  'Coho Winery',
  'Margie’s Travel — Hotel & Resort Booking, Lisbon (3 nights)',
  'Proseware Pharmacy'
];
const statusFor = (i: number) => {
  if (i % 19 === 0) return 'Reversed';
  if (i % 7 === 0) return 'Pending';
  return 'Posted';
};

export const buildTransactions = (total: number): MockTransaction[] =>
  Array.from({ length: total }, (_, i) => ({
    transactionId: `TXN-${String(100001 + i)}`,
    postedDate: new Date(Date.UTC(2024, 6, 15, 1, 4) - i * 3_600_000 * 7).toISOString(),
    description: MERCHANTS[i % MERCHANTS.length],
    amount: Math.round(((i * 37) % 900) * 100 + 1250) / 100,
    status: statusFor(i)
  }));

export type MockApiOptions = {
  /** Total number of records the fake API holds. */
  total: number;
  /** Simulated network latency in ms. */
  delayMs?: number;
  /** Fail the first request that carries this token, to exercise retry. */
  failOnceOnToken?: string;
  /** Always return the same token, to exercise the non-advancing token guard. */
  stuckToken?: string;
};

export type DataPageCall = {
  dataPage: string;
  context?: string;
  parameters: Record<string, unknown>;
};

/**
 * Returns a getPageDataAsync implementation backed by an in-memory token chain.
 * Tokens follow the sample API: TOKEN_<index of first record in the next chunk + 1>.
 */
export const createMockDataPage = ({
  total,
  delayMs = 0,
  failOnceOnToken,
  stuckToken
}: MockApiOptions) => {
  const records = buildTransactions(total);
  const calls: DataPageCall[] = [];
  let failed = false;

  const getPageDataAsync = (
    dataPage: string,
    context?: string,
    parameters?: Record<string, unknown>
  ) => {
    const params = parameters ?? {};
    calls.push({ dataPage, context, parameters: { ...params } });
    const token = String(params.startIdentifier ?? '');
    const size = Number(params.maxRecords ?? 50);

    return new Promise<object>((resolve, reject) => {
      setTimeout(() => {
        if (failOnceOnToken !== undefined && token === failOnceOnToken && !failed) {
          failed = true;
          reject(new Error('Service SYSTEM_A timed out (correlationId ABC123XYZ)'));
          return;
        }
        if (token && !/^TOKEN_\d+$/.test(token)) {
          reject(new Error(`Unknown continuation token ${token}`));
          return;
        }
        const start = token ? Number(token.replace('TOKEN_', '')) - 1 : 0;
        const entries = records.slice(start, start + size);
        const nextStart = start + entries.length;
        const isLastPage = nextStart >= records.length;
        resolve({
          Entries: entries,
          NextIdentifier: stuckToken ?? (isLastPage ? '' : `TOKEN_${nextStart + 1}`),
          IsLastPage: stuckToken ? false : isLastPage,
          RecordCount: entries.length
        });
      }, delayMs);
    });
  };

  return { getPageDataAsync, calls };
};

/** Installs a minimal PCore on window with the given data page implementation. */
export const installMockPCore = (
  getPageDataAsync: ReturnType<typeof createMockDataPage>['getPageDataAsync']
) => {
  (window as unknown as { PCore: unknown }).PCore = {
    getConstants: () => ({ CASE_INFO: { CASE_INFO_ID: 'caseInfo.ID' } }),
    getDataPageUtils: () => ({ getPageDataAsync })
  };
};

export const mockGetPConnect = () =>
  ({
    getContextName: () => 'app/primary_1',
    getValue: () => 'PEGA-BANK-WORK DISPUTE-1001',
    getLocalizedValue: (value: string) => value
  }) as unknown;

export const defaultConfig = {
  heading: 'Card transactions',
  dataPage: 'D_TransactionsChunk',
  columns:
    'transactionId:Transaction ID, postedDate:Posted:datetime, description:Description, amount:Amount:number, status:Status',
  pageSize: 25,
  tokenParam: 'startIdentifier',
  pageSizeParam: 'maxRecords',
  additionalParams: '{"fromDate":"2024-07-12T06:55:56.871Z","toDate":"2024-08-12T06:55:56.871Z"}',
  entriesProperty: 'Entries',
  nextTokenProperty: 'NextIdentifier',
  lastPageProperty: 'IsLastPage',
  setCaseID: false,
  listHeight: 'medium' as const
};
