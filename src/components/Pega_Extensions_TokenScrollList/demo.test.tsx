import { act, fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import '@testing-library/jest-dom';

import * as DemoStories from './demo.stories';
import { PegaExtensionsTokenScrollList, type TokenScrollListProps } from './index';
import {
  createMockDataPage,
  defaultConfig,
  installMockPCore,
  mockGetPConnect,
  type MockApiOptions
} from './mock';
import { getByPath, inferColumns, parseAdditionalParams, parseColumns, toPageSize } from './utils';

const { Default } = composeStories(DemoStories);

const setup = (api: MockApiOptions, props: Partial<TokenScrollListProps> = {}) => {
  const mock = createMockDataPage(api);
  installMockPCore(mock.getPageDataAsync);
  const utils = render(
    <PegaExtensionsTokenScrollList
      {...defaultConfig}
      pageSize={10}
      getPConnect={mockGetPConnect as unknown as TokenScrollListProps['getPConnect']}
      {...props}
    />
  );
  return { ...mock, ...utils };
};

const tokensSent = (calls: { parameters: Record<string, unknown> }[]) =>
  calls.map(call => call.parameters.startIdentifier);

describe('PegaExtensionsTokenScrollList', () => {
  test('renders the Default story with the first chunk', async () => {
    render(<Default />);
    expect(await screen.findByText('Card transactions')).toBeVisible();
    expect(await screen.findByText('TXN-100001', {}, { timeout: 3000 })).toBeVisible();
  });

  test('first request sends an empty token, page size and additional parameters', async () => {
    const { calls } = setup({ total: 30 });
    expect(await screen.findByText('TXN-100001')).toBeVisible();
    expect(calls).toHaveLength(1);
    expect(calls[0].dataPage).toBe('D_TransactionsChunk');
    expect(calls[0].context).toBe('app/primary_1');
    expect(calls[0].parameters).toEqual({
      startIdentifier: '',
      maxRecords: 10,
      fromDate: '2024-07-12T06:55:56.871Z',
      toDate: '2024-08-12T06:55:56.871Z'
    });
  });

  test('Load more passes the token returned by the previous response', async () => {
    const { calls } = setup({ total: 30 });
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    expect(await screen.findByText('TXN-100020')).toBeVisible();
    expect(tokensSent(calls)).toEqual(['', 'TOKEN_11']);
    // Earlier rows are kept — chunks are appended
    expect(screen.getByText('TXN-100001')).toBeVisible();
  });

  test('scrolling the sentinel into view loads the next chunk', async () => {
    const { calls } = setup({ total: 30 });
    await screen.findByText('TXN-100010');
    const observerMock = window.IntersectionObserver as unknown as jest.Mock;
    const callback = observerMock.mock.calls[observerMock.mock.calls.length - 1][0];
    await act(async () => {
      callback([{ isIntersecting: true }]);
    });
    expect(await screen.findByText('TXN-100020')).toBeVisible();
    expect(tokensSent(calls)).toEqual(['', 'TOKEN_11']);
  });

  test('stops at the last page and reports the total', async () => {
    const { calls } = setup({ total: 15 });
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    expect(await screen.findByText('All 15 records loaded')).toBeVisible();
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    expect(calls).toHaveLength(2);
  });

  test('retry after an error re-sends the same token', async () => {
    const { calls } = setup({ total: 30, failOnceOnToken: 'TOKEN_11' });
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    expect(await screen.findByText(/timed out/)).toBeVisible();
    fireEvent.click(screen.getByText('Try again'));
    expect(await screen.findByText('TXN-100020')).toBeVisible();
    expect(tokensSent(calls)).toEqual(['', 'TOKEN_11', 'TOKEN_11']);
  });

  test('refresh restarts the token chain from the beginning', async () => {
    const { calls } = setup({ total: 30 });
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    await screen.findByText('TXN-100020');
    fireEvent.click(screen.getByText('Refresh'));
    await screen.findByText('TXN-100010');
    expect(screen.queryByText('TXN-100020')).not.toBeInTheDocument();
    expect(tokensSent(calls)).toEqual(['', 'TOKEN_11', '']);
  });

  test('a token that does not advance ends the list instead of looping', async () => {
    const { calls } = setup({ total: 30, stuckToken: '' });
    expect(await screen.findByText('All 10 records loaded')).toBeVisible();
    expect(calls).toHaveLength(1);
  });

  test('a repeated non-empty token ends the list after one extra request', async () => {
    const { calls } = setup({ total: 30, stuckToken: 'TOKEN_11' });
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    expect(await screen.findByText('All 20 records loaded')).toBeVisible();
    expect(tokensSent(calls)).toEqual(['', 'TOKEN_11']);
  });

  test('shows the empty state when the API returns no entries', async () => {
    setup({ total: 0 });
    expect(await screen.findByText('No records found')).toBeVisible();
  });

  test('passes CaseInstanceKey when case context is enabled (string "true" accepted)', async () => {
    const { calls } = setup({ total: 5 }, { setCaseID: 'true' });
    await screen.findByText('TXN-100001');
    expect(calls[0].parameters.CaseInstanceKey).toBe('PEGA-BANK-WORK DISPUTE-1001');
  });

  test('supports custom parameter and response property names', async () => {
    const mock = createMockDataPage({ total: 12 });
    installMockPCore((dataPage, context, parameters) =>
      mock
        .getPageDataAsync(dataPage, context, {
          startIdentifier: parameters?.from,
          maxRecords: parameters?.limit
        })
        .then(
          result => result as { Entries: unknown[]; NextIdentifier: string; IsLastPage: boolean }
        )
        .then(res => ({
          data: { entries: res.Entries },
          header: { nextIdentifier: res.NextIdentifier, isLastPage: res.IsLastPage }
        }))
    );
    render(
      <PegaExtensionsTokenScrollList
        {...defaultConfig}
        pageSize={10}
        tokenParam='from'
        pageSizeParam='limit'
        entriesProperty='data.entries'
        nextTokenProperty='header.nextIdentifier'
        lastPageProperty='header.isLastPage'
        getPConnect={mockGetPConnect as unknown as TokenScrollListProps['getPConnect']}
      />
    );
    await screen.findByText('TXN-100010');
    fireEvent.click(screen.getByText('Load more'));
    expect(await screen.findByText('All 12 records loaded')).toBeVisible();
  });

  test('shows configuration guidance without a data page', () => {
    setup({ total: 5 }, { dataPage: '' });
    expect(screen.getByText('Configure a data page to load records')).toBeVisible();
  });

  test('shows an error for invalid additional parameters', () => {
    const { calls } = setup({ total: 5 }, { additionalParams: '{not json' });
    expect(screen.getByText('Additional parameters is not valid JSON')).toBeVisible();
    expect(calls).toHaveLength(0);
  });

  test('renders without optional props', async () => {
    const mock = createMockDataPage({ total: 3 });
    installMockPCore(mock.getPageDataAsync);
    render(
      <PegaExtensionsTokenScrollList
        dataPage='D_TransactionsChunk'
        getPConnect={mockGetPConnect as unknown as TokenScrollListProps['getPConnect']}
      />
    );
    expect(await screen.findByText('Records')).toBeVisible();
    // Columns are inferred from the first record
    expect(await screen.findByText('transactionId')).toBeVisible();
  });
});

describe('utils', () => {
  test('parseColumns handles labels, types and defaults', () => {
    expect(parseColumns('a, b:Bee, c:See:number, d:Dee:unknown')).toEqual([
      { field: 'a', label: 'a', type: 'text' },
      { field: 'b', label: 'Bee', type: 'text' },
      { field: 'c', label: 'See', type: 'number' },
      { field: 'd', label: 'Dee', type: 'text' }
    ]);
  });

  test('inferColumns skips nested values', () => {
    expect(inferColumns({ id: 1, nested: { x: 1 }, name: 'n' }).map(c => c.field)).toEqual([
      'id',
      'name'
    ]);
    expect(inferColumns(undefined)).toEqual([]);
  });

  test('getByPath reads nested values', () => {
    expect(getByPath({ header: { nextIdentifier: 'TOKEN_51' } }, 'header.nextIdentifier')).toBe(
      'TOKEN_51'
    );
    expect(getByPath({ a: 1 }, 'a.b')).toBeUndefined();
    expect(getByPath({ a: 1 }, '')).toBeUndefined();
  });

  test('parseAdditionalParams validates input', () => {
    expect(parseAdditionalParams('')).toEqual({ params: {} });
    expect(parseAdditionalParams('{"n":5,"o":{"x":1},"z":null}')).toEqual({
      params: { n: '5', o: '{"x":1}' }
    });
    expect(parseAdditionalParams('[1]').error).toBe('Additional parameters must be a JSON object');
  });

  test('toPageSize clamps and falls back', () => {
    expect(toPageSize('25')).toBe(25);
    expect(toPageSize(0)).toBe(50);
    expect(toPageSize('abc')).toBe(50);
    expect(toPageSize(10000)).toBe(500);
  });
});
