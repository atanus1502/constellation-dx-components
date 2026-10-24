/* eslint-disable react/jsx-no-useless-fragment */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { stateProps, configProps } from './mock';

import ClaudeDxComponentsPiiRedactor from './index';

const meta: Meta<typeof ClaudeDxComponentsPiiRedactor> = {
  title: 'ClaudeDxComponentsPiiRedactor',
  component: ClaudeDxComponentsPiiRedactor,
  excludeStories: /.*Data$/,
  argTypes: {
    preset: {
      control: 'select',
      options: ['Card Number', 'SSN', 'Phone', 'Email', 'Generic']
    }
  }
};

export default meta;
type Story = StoryObj<typeof ClaudeDxComponentsPiiRedactor>;

const Template = (args: any) => {
  const [value, setValue] = useState(args.value ?? configProps.value);

  const props = {
    value,
    hasSuggestions: configProps.hasSuggestions,
    getPConnect: () => {
      return {
        getStateProps: () => stateProps,
        getActionsApi: () => ({
          updateFieldValue: (propName: string, theValue: any) => setValue(theValue),
          triggerFieldChange: () => {/* nothing */}
        }),
        ignoreSuggestion: () => {/* nothing */},
        acceptSuggestion: () => {/* nothing */},
        setInheritedProps: () => {/* nothing */},
        resolveConfigProps: () => {/* nothing */}
      };
    }
  };

  return <ClaudeDxComponentsPiiRedactor {...props} {...args} value={value} />;
};

const baseArgs = {
  testId: configProps.testId,
  hideLabel: configProps.hideLabel,
  disabled: configProps.disabled,
  required: configProps.required,
  displayMode: 'DISPLAY_ONLY'
};

// Preset stories — display-only, showcasing the redacted view for each PII format
export const CardNumber: Story = {
  render: Template,
  args: { ...baseArgs, label: 'Card Number', value: '4111111111111234', preset: 'Card Number' }
};

export const SSN: Story = {
  render: Template,
  args: { ...baseArgs, label: 'SSN', value: '123456789', preset: 'SSN' }
};

export const Phone: Story = {
  render: Template,
  args: { ...baseArgs, label: 'Phone', value: '5551234567', preset: 'Phone' }
};

export const Email: Story = {
  render: Template,
  args: { ...baseArgs, label: 'Email', value: 'jsmith@example.com', preset: 'Email' }
};

export const Generic: Story = {
  render: Template,
  args: {
    ...baseArgs,
    label: 'Account reference',
    value: 'ACCT-9988776655',
    preset: 'Generic',
    visibleChars: 4
  }
};

// Edit mode — a normal input showing the raw value, so the person entering data can verify it
export const EditMode: Story = {
  render: Template,
  args: {
    testId: configProps.testId,
    hideLabel: configProps.hideLabel,
    disabled: configProps.disabled,
    required: configProps.required,
    displayMode: '',
    label: 'Card Number',
    value: '4111111111111234',
    preset: 'Card Number'
  }
};

// readOnly (not displayMode) — still shows the redacted view, never the raw value
export const ReadOnly: Story = {
  render: Template,
  args: { ...CardNumber.args, displayMode: '', readOnly: true }
};

export const Empty: Story = {
  render: Template,
  args: { ...baseArgs, label: 'Card Number', value: '', preset: 'Card Number' }
};
