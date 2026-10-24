import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import '@testing-library/jest-dom';

import * as DemoStories from './demo.stories';
import { redactValue } from './index';

const { CardNumber, SSN, Phone, Email, Generic, EditMode, ReadOnly, Empty } =
  composeStories(DemoStories);

describe('redactValue', () => {
  it('redacts a card number showing only the last 4 digits', () => {
    expect(redactValue('Card Number', '4111111111111234')).toBe('•••• •••• •••• 1234');
  });

  it('redacts an SSN', () => {
    expect(redactValue('SSN', '123456789')).toBe('•••-••-6789');
  });

  it('redacts a phone number', () => {
    expect(redactValue('Phone', '5551234567')).toBe('(•••) •••-4567');
  });

  it('redacts an email, keeping the first local character and full domain', () => {
    expect(redactValue('Email', 'jsmith@example.com')).toBe('j•••••@example.com');
  });

  it('redacts a generic value using visibleChars', () => {
    expect(redactValue('Generic', 'ACCT-9988776655', 4)).toBe('•••••••••••6655');
  });

  it('returns empty string for empty input', () => {
    expect(redactValue('Card Number', '')).toBe('');
  });
});

describe('ClaudeDxComponentsPiiRedactor', () => {
  it('displays a redacted card number', async () => {
    render(<CardNumber />);
    expect(await screen.findByText('•••• •••• •••• 1234')).toBeVisible();
    expect(screen.queryByText('4111111111111234')).not.toBeInTheDocument();
  });

  it('displays a redacted SSN', async () => {
    render(<SSN />);
    expect(await screen.findByText('•••-••-6789')).toBeVisible();
  });

  it('displays a redacted phone number', async () => {
    render(<Phone />);
    expect(await screen.findByText('(•••) •••-4567')).toBeVisible();
  });

  it('displays a redacted email', async () => {
    render(<Email />);
    expect(await screen.findByText('j•••••@example.com')).toBeVisible();
  });

  it('displays a redacted generic value', async () => {
    render(<Generic />);
    expect(await screen.findByText('•••••••••••6655')).toBeVisible();
  });

  it('shows the redacted value, not the raw value, when readOnly', async () => {
    render(<ReadOnly />);
    expect(await screen.findByText('•••• •••• •••• 1234')).toBeVisible();
    expect(screen.queryByText('4111111111111234')).not.toBeInTheDocument();
  });

  it('renders an editable input showing the raw value in edit mode', async () => {
    render(<EditMode />);
    const input = screen.getByTestId(
      `${DemoStories.EditMode.args?.testId}:input:control`
    ) as HTMLInputElement;
    expect(input.value).toBe('4111111111111234');
  });

  it('masks the input by default and reveals the value via the toggle', async () => {
    render(<EditMode />);
    const input = screen.getByTestId(
      `${DemoStories.EditMode.args?.testId}:input:control`
    ) as HTMLInputElement;

    expect(input.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: /show value/i }));
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: /hide value/i }));
    expect(input.type).toBe('password');
  });

  it('handles empty values gracefully', async () => {
    render(<Empty />);
    expect(await screen.findByText('––')).toBeVisible();
  });
});
