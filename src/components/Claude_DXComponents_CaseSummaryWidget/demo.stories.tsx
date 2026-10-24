import type { Meta, StoryObj } from '@storybook/react';

import ClaudeDxComponentsCaseSummaryWidget from './index';
import mockProps from './mock';

const meta: Meta<typeof ClaudeDxComponentsCaseSummaryWidget> = {
  title: 'ClaudeDxComponentsCaseSummaryWidget',
  component: ClaudeDxComponentsCaseSummaryWidget,
  argTypes: {
    status: {
      control: 'select',
      options: ['New', 'In Progress', 'Pending', 'Resolved', 'Urgent', 'Rejected']
    }
  }
};

export default meta;
type Story = StoryObj<typeof ClaudeDxComponentsCaseSummaryWidget>;

if (!window.PCore) {
  window.PCore = {} as any;
}

const getPConnect = () => {
  return {
    getLocalizedValue: (value: any) => value,
    getActionsApi: () => ({
      updateFieldValue: () => {/* nothing */},
      triggerFieldChange: () => {/* nothing */}
    }),
    ignoreSuggestion: () => {/* nothing */},
    acceptSuggestion: () => {/* nothing */},
    setInheritedProps: () => {/* nothing */},
    resolveConfigProps: () => {/* nothing */}
  } as any;
};

export const Default: Story = {
  args: { getPConnect, ...mockProps } as any
};

export const Empty: Story = {
  args: { getPConnect, ...mockProps, caseID: '', status: '', customerName: '', lastUpdated: '' } as any
};

export const LongContent: Story = {
  args: {
    getPConnect,
    ...mockProps,
    customerName: 'Alexandria Montgomery-Fitzgerald-Whitmore III',
    status: 'Escalated — Awaiting Manager Review'
  } as any
};

export const Resolved: Story = {
  args: { getPConnect, ...mockProps, status: 'Resolved' } as any
};

export const Urgent: Story = {
  args: { getPConnect, ...mockProps, status: 'Urgent' } as any
};
