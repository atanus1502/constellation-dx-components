/* eslint-disable react/jsx-no-useless-fragment */
import type { Meta, StoryObj } from '@storybook/react';

import ClaudeDxComponentsSlaDeadlineTracker from './index';
import configProps, { slaRows } from './mock';

const meta: Meta<typeof ClaudeDxComponentsSlaDeadlineTracker> = {
  title: 'ClaudeDxComponentsSlaDeadlineTracker',
  component: ClaudeDxComponentsSlaDeadlineTracker,
  excludeStories: /.*Data$/
};

export default meta;
type Story = StoryObj<typeof ClaudeDxComponentsSlaDeadlineTracker>;

if (!window.PCore) {
  window.PCore = {} as any;
}

window.PCore.getSemanticUrlUtils = () =>
  ({
    getResolvedSemanticURL: () => '/case/case-1',
    getActions: () => ({ ACTION_OPENWORKBYHANDLE: 'openWorkByHandle' })
  }) as any;

// exported (excluded from Storybook via the `Data$` suffix) so tests can assert on action calls
// without pulling a test-runner mock library into a file that also runs in the real Storybook browser
export const actionCallsData: { openWorkByHandle?: [string, string]; showCasePreview?: [string, any] } = {};

const getPConnect = () => {
  return {
    getContextName: () => 'app/primary_1',
    getLocalizedValue: (value: any) => value,
    getActionsApi: () => ({
      updateFieldValue: () => {/* nothing */},
      triggerFieldChange: () => {/* nothing */},
      openWorkByHandle: (insKey: string, caseClassName: string) => {
        actionCallsData.openWorkByHandle = [insKey, caseClassName];
      },
      showCasePreview: (insKey: string, opts: any) => {
        actionCallsData.showCasePreview = [insKey, opts];
      }
    }),
    ignoreSuggestion: () => {/* nothing */},
    acceptSuggestion: () => {/* nothing */},
    setInheritedProps: () => {/* nothing */},
    resolveConfigProps: () => {/* nothing */}
  } as any;
};

const mockDataPage = (rows: unknown[]) => {
  window.PCore.getDataApiUtils = () =>
    ({
      getData: () => Promise.resolve({ data: { data: rows } })
    }) as any;
};

export const Default: Story = (args: any) => {
  mockDataPage(slaRows);
  return <ClaudeDxComponentsSlaDeadlineTracker {...configProps} getPConnect={getPConnect} {...args} />;
};
Default.args = { ...configProps };

export const AllOnTrack: Story = (args: any) => {
  mockDataPage(slaRows.map(row => ({ ...row, status: 'On Track', percentUsed: 35 })));
  return <ClaudeDxComponentsSlaDeadlineTracker {...configProps} getPConnect={getPConnect} {...args} />;
};
AllOnTrack.args = { ...configProps };

export const ManyRows: Story = (args: any) => {
  const extraRows = Array.from({ length: 6 }, (_, i) => ({
    ...slaRows[i % slaRows.length],
    caseID: `C-1${1000 + i}`
  }));
  mockDataPage(extraRows);
  return <ClaudeDxComponentsSlaDeadlineTracker {...configProps} getPConnect={getPConnect} {...args} />;
};
ManyRows.args = { ...configProps };

export const Empty: Story = (args: any) => {
  mockDataPage([]);
  return <ClaudeDxComponentsSlaDeadlineTracker {...configProps} getPConnect={getPConnect} {...args} />;
};
Empty.args = { ...configProps };
