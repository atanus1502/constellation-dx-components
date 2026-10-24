import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import '@testing-library/jest-dom';

import * as DemoStories from './demo.stories';
import { slaRows } from './mock';

const { Default, AllOnTrack, ManyRows, Empty } = composeStories(DemoStories);

describe('ClaudeDxComponentsSlaDeadlineTracker', () => {
  it('renders heading, description and one card per data page row', async () => {
    render(<Default />);

    expect(await screen.findByText('SLA & Deadline Tracker')).toBeVisible();
    expect(await screen.findByText('Live SLA status across active cases')).toBeVisible();
    expect(await screen.findByText('C-12847')).toBeVisible();
    expect(await screen.findByText('C-12851')).toBeVisible();
    expect(await screen.findByText('C-12839')).toBeVisible();
  });

  it('shows the correct status pill for each row', async () => {
    render(<Default />);

    await screen.findByText('C-12847');
    const pills = Array.from(document.querySelectorAll('[data-testid=":status:"]')).map(
      el => el.textContent
    );
    expect(pills.sort()).toEqual(['At Risk', 'On Track', 'Overdue']);
  });

  it('shows "Overdue by" for a past-due row and "Remaining" for a future one', async () => {
    render(<Default />);

    expect(await screen.findByText('OVERDUE BY')).toBeVisible();
    expect((await screen.findAllByText('REMAINING')).length).toBeGreaterThan(0);
  });

  it('renders a summary count per status', async () => {
    render(<Default />);

    expect(await screen.findByText(/1 On Track/)).toBeVisible();
    expect(await screen.findByText(/1 At Risk/)).toBeVisible();
    expect(await screen.findByText(/1 Overdue/)).toBeVisible();
  });

  it('renders every row even when all share the same status', async () => {
    render(<AllOnTrack />);
    await screen.findByText('C-12847');
    expect(document.querySelectorAll('[data-testid=":status:"]').length).toBe(3);
  });

  it('renders a card for every row returned, regardless of count', async () => {
    render(<ManyRows />);
    expect(await screen.findByText('C-11005')).toBeVisible();
  });

  it('shows an empty state when no rows are returned', async () => {
    render(<Empty />);
    expect(await screen.findByText(/No active cases with tracked SLAs/)).toBeVisible();
  });

  it('opens the case in place when a case ID is clicked', async () => {
    render(<Default />);

    const caseLink = await screen.findByText('C-12847');
    fireEvent.click(caseLink);

    const row = slaRows.find(r => r.caseID === 'C-12847')!;
    expect(DemoStories.actionCallsData.openWorkByHandle).toEqual([row.insKey, row.caseClassName]);
  });
});
