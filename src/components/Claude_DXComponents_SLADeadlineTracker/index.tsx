import { useEffect, useState, type MouseEvent } from 'react';
import { withConfiguration, Text, Status, Link, type StatusProps } from '@pega/cosmos-react-core';
import type { PConnProps } from './PConnProps';
import './create-nonce';

import StyledClaudeDxComponentsSlaDeadlineTrackerWrapper from './styles';

type SLAStatus = 'On Track' | 'At Risk' | 'Overdue';

interface SLARow {
  caseID: string;
  /** Full case instance key (pzInsKey) — required to open the case */
  insKey: string;
  /** Case class name (pxObjClass) — required to open the case */
  caseClassName: string;
  slaType: string;
  status: SLAStatus;
  percentUsed: number;
  dueDateTime: string;
}

// interface for props
interface ClaudeDxComponentsSlaDeadlineTrackerProps extends PConnProps {
  /** Widget heading */
  heading?: string;
  /** Widget subheading */
  description?: string;
  /** Name of the data page returning active-case SLA rows */
  dataPage: string;
}

const STATUS_COLOR: Record<SLAStatus, string> = {
  'On Track': '#2E7D32',
  'At Risk': '#B76E00',
  Overdue: '#C62828'
};

const STATUS_VARIANT: Record<SLAStatus, StatusProps['variant']> = {
  'On Track': 'success',
  'At Risk': 'warn',
  Overdue: 'urgent'
};

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.round(Math.abs(ms) / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(totalMinutes, 1)}m`;
};

const getRemaining = (dueDateTime: string, now: Date) => {
  const due = new Date(dueDateTime);
  const diff = due.getTime() - now.getTime();
  if (diff <= 0) return { label: 'Overdue by', value: formatDuration(diff) };
  return { label: 'Remaining', value: formatDuration(diff) };
};

const formatDueDate = (dueDateTime: string): string => {
  const due = new Date(dueDateTime);
  if (Number.isNaN(due.getTime())) return dueDateTime;
  const datePart = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timePart = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
};

const formatUpdatedAt = (updatedAt: Date | null, now: Date): string => {
  if (!updatedAt) return '';
  const minutes = Math.round((now.getTime() - updatedAt.getTime()) / 60000);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.round(minutes / 60)}h ago`;
};

function SLARing({ percentUsed, status }: { percentUsed: number; status: SLAStatus }) {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentUsed, 0), 100);
  const offset = circumference * (1 - clamped / 100);
  const color = STATUS_COLOR[status];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role='img' aria-label={`${clamped}% used`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke='#E5E7EB'
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x='50%' y='46%' textAnchor='middle' dominantBaseline='middle' fontSize='20' fontWeight='700' fill={color}>
        {clamped}%
      </text>
      <text x='50%' y='64%' textAnchor='middle' dominantBaseline='middle' fontSize='10' fill='#6B7280'>
        USED
      </text>
    </svg>
  );
}

function SLACard({
  row,
  now,
  getPConnect
}: {
  row: SLARow;
  now: Date;
  getPConnect: () => typeof PConnect;
}) {
  const { caseID, insKey, caseClassName, slaType, status, percentUsed, dueDateTime } = row;
  const remaining = getRemaining(dueDateTime, now);
  const color = STATUS_COLOR[status];
  const linkURL = PCore.getSemanticUrlUtils().getResolvedSemanticURL(
    PCore.getSemanticUrlUtils().getActions().ACTION_OPENWORKBYHANDLE,
    { caseClassName },
    { workID: caseID }
  );

  return (
    <div className='sla-card' style={{ borderColor: color }}>
      <div className='sla-card-header'>
        <Text variant='secondary'>{slaType.toUpperCase()}</Text>
        <Status variant={STATUS_VARIANT[status]}>{status}</Status>
      </div>
      <Link
        href={linkURL}
        previewable
        onPreview={() => {
          getPConnect().getActionsApi().showCasePreview(encodeURI(insKey), { caseClassName });
        }}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          // for links — need to set onClick for SPA to avoid full reload — (cmd | ctrl) + click still opens in a new tab
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            getPConnect().getActionsApi().openWorkByHandle(insKey, caseClassName);
          }
        }}
      >
        {caseID}
      </Link>
      <div className='sla-card-body'>
        <SLARing percentUsed={percentUsed} status={status} />
        <div className='sla-card-remaining'>
          <Text variant='secondary'>{remaining.label.toUpperCase()}</Text>
          <Text variant='h3' as='div' style={{ color }}>
            {remaining.value}
          </Text>
          <Text variant='secondary'>DUE</Text>
          <Text as='div'>{formatDueDate(dueDateTime)}</Text>
        </div>
      </div>
      <div className='sla-card-track'>
        <div className='sla-card-track-fill' style={{ width: `${Math.min(percentUsed, 100)}%`, backgroundColor: color }} />
      </div>
      <div className='sla-card-track-labels'>
        <Text variant='secondary'>Start</Text>
        <Text variant='secondary'>Deadline</Text>
      </div>
    </div>
  );
}

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
function ClaudeDxComponentsSlaDeadlineTracker(props: ClaudeDxComponentsSlaDeadlineTrackerProps) {
  const {
    getPConnect,
    heading = 'SLA & Deadline Tracker',
    description = 'Live SLA status across active cases',
    dataPage
  } = props;

  const pConn = getPConnect();
  const context = pConn.getContextName();
  const [rows, setRows] = useState<SLARow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const now = new Date();

  useEffect(() => {
    PCore.getDataApiUtils()
      .getData(dataPage, {}, context)
      .then((response: any) => {
        setIsLoading(false);
        setUpdatedAt(new Date());
        setRows(response?.data?.data ?? []);
      })
      .catch(() => {
        setIsLoading(false);
        setRows([]);
      });
  }, [dataPage, context]);

  const counts = rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<SLAStatus, number>
  );

  return (
    <StyledClaudeDxComponentsSlaDeadlineTrackerWrapper>
      <div className='sla-header'>
        <div>
          <Text variant='h2' as='div'>
            {heading}
          </Text>
          <Text variant='secondary'>{description}</Text>
        </div>
        <div className='sla-legend'>
          {(['On Track', 'At Risk', 'Overdue'] as SLAStatus[]).map(status => (
            <span key={status} className='sla-legend-item'>
              <span className='sla-legend-dot' style={{ backgroundColor: STATUS_COLOR[status] }} />
              <Text variant='secondary'>{status}</Text>
            </span>
          ))}
        </div>
      </div>

      {!isLoading && rows.length === 0 ? (
        <Text variant='secondary'>{pConn.getLocalizedValue('No active cases with tracked SLAs', '', '')}</Text>
      ) : (
        <div className='sla-cards'>
          {rows.map(row => (
            <SLACard
              key={`${row.caseID}-${row.slaType}`}
              row={row}
              now={now}
              getPConnect={getPConnect}
            />
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className='sla-summary'>
          <Text variant='secondary'>SUMMARY</Text>
          {(['On Track', 'At Risk', 'Overdue'] as SLAStatus[]).map(status => (
            <span key={status} className='sla-summary-item' style={{ color: STATUS_COLOR[status] }}>
              {counts[status] ?? 0} {status}
            </span>
          ))}
          <Text variant='secondary' className='sla-summary-updated'>
            {formatUpdatedAt(updatedAt, now)}
          </Text>
        </div>
      )}
    </StyledClaudeDxComponentsSlaDeadlineTrackerWrapper>
  );
}

export default withConfiguration(ClaudeDxComponentsSlaDeadlineTracker);
