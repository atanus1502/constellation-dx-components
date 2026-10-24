import { useState } from 'react';
import { Input, Text, withConfiguration, type Action } from '@pega/cosmos-react-core';

import type { PConnFieldProps } from './PConnProps';
import './create-nonce';

import StyledClaudeDxComponentsPiiRedactorWrapper from './styles';

type Preset = 'Card Number' | 'SSN' | 'Phone' | 'Email' | 'Generic';

// interface for props
interface ClaudeDxComponentsPiiRedactorProps extends PConnFieldProps {
  /** Which PII format to redact as */
  preset?: Preset;
  /** Number of trailing characters left visible — only used by the Generic preset */
  visibleChars?: number;
}

// interface for StateProps object
interface StateProps {
  value: string;
  hasSuggestions: boolean;
}

const redactCardNumber = (digits: string): string => {
  if (digits.length <= 4) return '•'.repeat(digits.length);
  const last4 = digits.slice(-4);
  const maskedGroups = Math.ceil((digits.length - 4) / 4);
  const maskedPart = Array.from({ length: maskedGroups }, () => '••••').join(' ');
  return `${maskedPart} ${last4}`;
};

const redactSSN = (digits: string): string => {
  const last4 = digits.slice(-4).padStart(4, '•');
  return `•••-••-${last4}`;
};

const redactPhone = (digits: string): string => {
  const last4 = digits.slice(-4).padStart(4, '•');
  return `(•••) •••-${last4}`;
};

const redactEmail = (value: string): string => {
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return '•'.repeat(value.length);
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex);
  const visible = local.slice(0, 1);
  const masked = '•'.repeat(Math.max(local.length - 1, 1));
  return `${visible}${masked}${domain}`;
};

const redactGeneric = (value: string, visibleChars: number): string => {
  const n = Math.max(0, visibleChars);
  if (value.length <= n) return '•'.repeat(value.length);
  return `${'•'.repeat(value.length - n)}${value.slice(-n)}`;
};

export const redactValue = (preset: Preset, value: string, visibleChars = 4): string => {
  if (!value) return '';
  switch (preset) {
    case 'Card Number':
      return redactCardNumber(value.replace(/\D/g, ''));
    case 'SSN':
      return redactSSN(value.replace(/\D/g, ''));
    case 'Phone':
      return redactPhone(value.replace(/\D/g, ''));
    case 'Email':
      return redactEmail(value);
    case 'Generic':
    default:
      return redactGeneric(value, visibleChars);
  }
};

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
function ClaudeDxComponentsPiiRedactor(props: ClaudeDxComponentsPiiRedactorProps) {
  const {
    getPConnect,
    value,
    placeholder,
    displayMode,
    label,
    hideLabel = false,
    testId,
    preset = 'Generic',
    visibleChars = 4
  } = props;

  let { readOnly, required, disabled } = props;
  [readOnly, required, disabled] = [readOnly, required, disabled].map(
    prop => prop === true || (typeof prop === 'string' && prop === 'true')
  );

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const stateProps = pConn.getStateProps() as StateProps;
  const propName: string = stateProps.value;
  const [revealed, setRevealed] = useState(false);

  const handleOnChange = (event: any) => {
    const { value: updatedValue } = event.target;
    actions.updateFieldValue(propName, updatedValue);
  };

  const redacted = redactValue(preset, value, visibleChars);

  if (displayMode === 'DISPLAY_ONLY' || readOnly) {
    return (
      <StyledClaudeDxComponentsPiiRedactorWrapper>
        <Text data-testid={testId}>{redacted || <span aria-hidden='true'>&ndash;&ndash;</span>}</Text>
      </StyledClaudeDxComponentsPiiRedactorWrapper>
    );
  }

  const revealToggle: Action = {
    id: 'toggle-reveal',
    text: revealed ? 'Hide value' : 'Show value',
    icon: revealed ? 'eye-off' : 'eye',
    onClick: () => setRevealed(current => !current)
  };

  return (
    <StyledClaudeDxComponentsPiiRedactorWrapper>
      <Input
        type={revealed ? 'text' : 'password'}
        value={value}
        label={label}
        labelHidden={hideLabel}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={handleOnChange}
        actions={[revealToggle]}
        testId={testId}
      />
    </StyledClaudeDxComponentsPiiRedactorWrapper>
  );
}

export default withConfiguration(ClaudeDxComponentsPiiRedactor);
