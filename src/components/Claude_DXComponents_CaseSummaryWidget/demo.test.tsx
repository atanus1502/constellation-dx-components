import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import '@testing-library/jest-dom';

import * as DemoStories from './demo.stories';

const { Default, Empty, LongContent, Resolved, Urgent } = composeStories(DemoStories);

describe('ClaudeDxComponentsCaseSummaryWidget', () => {
  it('renders case ID, status, customer name and last updated', async () => {
    render(<Default />);

    expect(await screen.findByText('MYAPP-WORK C-10234')).toBeVisible();
    expect(await screen.findByText('In Progress')).toBeVisible();
    expect(await screen.findByText('Priya Nair')).toBeVisible();
    expect(await screen.findByText(/Last updated:/)).toBeVisible();
  });

  it('handles missing data gracefully', async () => {
    render(<Empty />);

    expect(await screen.findByText('Case Summary')).toBeVisible();
  });

  it('renders long content without crashing', async () => {
    render(<LongContent />);

    expect(await screen.findByText('Alexandria Montgomery-Fitzgerald-Whitmore III')).toBeVisible();
  });

  it('renders a success status variant for Resolved', async () => {
    render(<Resolved />);

    expect(await screen.findByText('Resolved')).toBeVisible();
  });

  it('renders an urgent status variant for Urgent', async () => {
    render(<Urgent />);

    expect(await screen.findByText('Urgent')).toBeVisible();
  });
});
