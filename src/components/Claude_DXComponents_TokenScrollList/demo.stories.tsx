import type { Meta, StoryObj } from '@storybook/react';

import { ClaudeDxComponentsTokenScrollList, type TokenScrollListProps } from './index';
import {
  createMockDataPage,
  defaultConfig,
  installMockPCore,
  mockGetPConnect,
  type MockApiOptions
} from './mock';
import { createWikipediaDataPage, recentWindow } from './liveApi';

type StoryArgs = Omit<TokenScrollListProps, 'getPConnect'>;

const meta: Meta<StoryArgs> = {
  title: 'ClaudeDxComponentsTokenScrollList',
  component: ClaudeDxComponentsTokenScrollList as unknown as Meta<StoryArgs>['component'],
  argTypes: {
    heading: { control: 'text' },
    dataPage: { control: 'text' },
    columns: { control: 'text' },
    pageSize: { control: { type: 'number', min: 1, max: 500 } },
    listHeight: { control: 'select', options: ['small', 'medium', 'large'] },
    setCaseID: { control: 'boolean' },
    additionalParams: { control: 'text' },
    tokenParam: { control: 'text' },
    pageSizeParam: { control: 'text' },
    entriesProperty: { control: 'text' },
    nextTokenProperty: { control: 'text' },
    lastPageProperty: { control: 'text' },
    testId: { table: { disable: true } }
  },
  args: defaultConfig
};

export default meta;
type Story = StoryObj<StoryArgs>;

const withMockApi =
  (options: MockApiOptions): Story['render'] =>
  args => {
    const { getPageDataAsync } = createMockDataPage(options);
    installMockPCore(getPageDataAsync);
    return (
      <ClaudeDxComponentsTokenScrollList
        {...args}
        getPConnect={mockGetPConnect as unknown as TokenScrollListProps['getPConnect']}
      />
    );
  };

const withLiveApi: Story['render'] = args => {
  installMockPCore(createWikipediaDataPage());
  return (
    <ClaudeDxComponentsTokenScrollList
      {...args}
      getPConnect={mockGetPConnect as unknown as TokenScrollListProps['getPConnect']}
    />
  );
};

const liveConfig = {
  heading: 'Wikipedia — live edits',
  dataPage: 'D_WikiRecentChanges',
  columns:
    'timestamp:Time:datetime, title:Article, user:Editor, comment:Summary, newlen:Size:number',
  pageSize: 50
};

/**
 * Live API (default): real English Wikipedia edits from the last 15 minutes, paged with Wikipedia's
 * continuation token (rccontinue). Scroll to fetch each next chunk; watch the browser Network tab
 * to see the token from one response sent with the next request. Needs internet access.
 */
export const LiveWikipedia: Story = {
  name: 'Live API — Wikipedia',
  args: { ...liveConfig, additionalParams: JSON.stringify(recentWindow(15)) },
  render: withLiveApi
};

/**
 * Live API, short window: the last 2 minutes of edits. Usually 1–3 chunks, then the response has
 * no continue token and the footer shows "All N records loaded".
 */
export const LiveWikipediaShortWindow: Story = {
  name: 'Live API — last 2 minutes',
  args: {
    ...liveConfig,
    heading: 'Wikipedia — last 2 minutes',
    additionalParams: JSON.stringify(recentWindow(2))
  },
  render: withLiveApi
};

/** Mock API: 240 records served 25 at a time with TOKEN_<n> continuation tokens. Works offline. */
export const MockApi: Story = {
  name: 'Mock API — transactions',
  render: withMockApi({ total: 240, delayMs: 600 })
};

/** The API returns everything in one response with IsLastPage = true. */
export const SinglePage: Story = {
  render: withMockApi({ total: 8, delayMs: 300 })
};

/** The API returns no entries. */
export const Empty: Story = {
  render: withMockApi({ total: 0, delayMs: 300 })
};

/** The second chunk fails once; Try again re-sends the same continuation token. */
export const ErrorAndRetry: Story = {
  render: withMockApi({ total: 120, delayMs: 400, failOnceOnToken: 'TOKEN_26' })
};

/** Columns left blank — they are inferred from the first record. */
export const InferredColumns: Story = {
  args: { columns: '', heading: 'Transactions (auto columns)' },
  render: withMockApi({ total: 60, delayMs: 300 })
};

/** Small scroll area — shows the list filling and scrolling inside a compact utility panel. */
export const CompactUtility: Story = {
  args: { listHeight: 'small', pageSize: 10, heading: 'Recent transactions' },
  render: withMockApi({ total: 45, delayMs: 300 })
};

/** No data page configured — guidance shown to the App Studio author. */
export const NotConfigured: Story = {
  args: { dataPage: '' },
  render: withMockApi({ total: 0 })
};
