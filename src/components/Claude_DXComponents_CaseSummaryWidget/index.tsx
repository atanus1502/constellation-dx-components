import {
  withConfiguration,
  Card,
  CardHeader,
  CardContent,
  Flex,
  Text,
  Status,
  type StatusProps
} from '@pega/cosmos-react-core';
import type { PConnProps } from './PConnProps';
import './create-nonce';

import StyledClaudeDxComponentsCaseSummaryWidgetWrapper from './styles';

// interface for props
export interface ClaudeDxComponentsCaseSummaryWidgetProps extends PConnProps {
  /** Widget label, shown as a heading fallback when no caseID is available */
  label?: string;
  /** Case identifier (e.g. MYAPP-WORK C-1001) */
  caseID: string;
  /** Case status label (e.g. New, Pending, Resolved) */
  status: string;
  /** Name of the customer associated with the case */
  customerName: string;
  /** ISO datetime the case was last updated */
  lastUpdated: string;
}

/* Map a free-text status label to a Cosmos Status variant */
const getStatusVariant = (value: string): StatusProps['variant'] => {
  const normalized = (value || '').toLowerCase();
  if (/resolved|closed|complete/.test(normalized)) return 'success';
  if (/pending|hold/.test(normalized)) return 'pending';
  if (/urgent|escalat/.test(normalized)) return 'urgent';
  if (/reject|fail|error/.test(normalized)) return 'warn';
  return 'info';
};

const formatLastUpdated = (value: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function ClaudeDxComponentsCaseSummaryWidget(
  props: ClaudeDxComponentsCaseSummaryWidgetProps
) {
  const { getPConnect, label = 'Case Summary', caseID, status, customerName, lastUpdated } = props;
  const pConn = getPConnect();

  return (
    <StyledClaudeDxComponentsCaseSummaryWidgetWrapper>
      <Card>
        <CardHeader>
          <Flex container={{ justify: 'between', alignItems: 'center' }}>
            <Text variant='h3'>{caseID || pConn.getLocalizedValue(label, '', '')}</Text>
            {status ? <Status variant={getStatusVariant(status)}>{status}</Status> : null}
          </Flex>
        </CardHeader>
        <CardContent>
          <Flex container={{ direction: 'column', gap: 1 }}>
            {customerName ? <Text>{customerName}</Text> : null}
            {lastUpdated ? (
              <Text variant='secondary'>
                {pConn.getLocalizedValue('Last updated', '', '')}: {formatLastUpdated(lastUpdated)}
              </Text>
            ) : null}
          </Flex>
        </CardContent>
      </Card>
    </StyledClaudeDxComponentsCaseSummaryWidgetWrapper>
  );
}

export default withConfiguration(ClaudeDxComponentsCaseSummaryWidget);
