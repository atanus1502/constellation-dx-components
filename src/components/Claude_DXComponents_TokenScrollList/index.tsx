import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  withConfiguration,
  Button,
  Card,
  CardContent,
  CardHeader,
  DateTimeDisplay,
  EmptyState,
  ErrorState,
  Flex,
  Progress,
  Table,
  Text
} from '@pega/cosmos-react-core';
import './create-nonce';
import StyledScrollArea, { StyledFooter } from './styles';
import {
  getByPath,
  inferColumns,
  parseAdditionalParams,
  parseColumns,
  toBool,
  toPageSize,
  type ColumnDef
} from './utils';

export type ListHeight = 'small' | 'medium' | 'large';

export type TokenScrollListProps = {
  heading?: string;
  dataPage: string;
  columns?: string;
  pageSize?: number | string;
  tokenParam?: string;
  pageSizeParam?: string;
  additionalParams?: string;
  entriesProperty?: string;
  nextTokenProperty?: string;
  lastPageProperty?: string;
  setCaseID?: boolean | string;
  listHeight?: ListHeight;
  getPConnect: () => typeof PConnect;
  testId?: string;
};

type Row = { id: number; record: Record<string, unknown> };

type Status = 'idle' | 'loading' | 'error' | 'done';

const renderValue = (value: unknown, type: ColumnDef['type']) => {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'date' || type === 'datetime') {
    return <DateTimeDisplay value={String(value)} variant={type} />;
  }
  if (type === 'boolean') return toBool(value) ? 'Yes' : 'No';
  if (type === 'number') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : String(value);
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

export const ClaudeDxComponentsTokenScrollList = (props: TokenScrollListProps) => {
  const {
    heading = 'Records',
    dataPage = '',
    columns = '',
    pageSize = 50,
    tokenParam = 'startIdentifier',
    pageSizeParam = 'maxRecords',
    additionalParams = '',
    entriesProperty = 'Entries',
    nextTokenProperty = 'NextIdentifier',
    lastPageProperty = 'IsLastPage',
    setCaseID = false,
    listHeight = 'medium',
    getPConnect,
    testId
  } = props;

  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // The continuation token lives in refs so the IntersectionObserver callback always sees the latest value.
  const nextTokenRef = useRef('');
  const inFlightRef = useRef(false);
  const doneRef = useRef(false);
  // Bumped on every reset so responses for an abandoned token chain are ignored.
  const generationRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const size = toPageSize(pageSize);
  const passCaseID = toBool(setCaseID);
  const { params: extraParams, error: paramsError } = useMemo(
    () => parseAdditionalParams(additionalParams),
    [additionalParams]
  );

  const loadMore = useCallback(async () => {
    if (!dataPage || paramsError || inFlightRef.current || doneRef.current) return;
    inFlightRef.current = true;
    const generation = generationRef.current;
    const requestToken = nextTokenRef.current;
    setStatus('loading');

    try {
      const pConn = getPConnect();
      const parameters: Record<string, string | number> = {
        ...extraParams,
        [pageSizeParam]: size,
        [tokenParam]: requestToken
      };
      if (passCaseID) {
        parameters.CaseInstanceKey = pConn.getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID);
      }

      const response = await PCore.getDataPageUtils().getPageDataAsync(
        dataPage,
        pConn.getContextName(),
        parameters,
        { invalidateCache: true }
      );
      if (generation !== generationRef.current) return;

      const entries = getByPath(response, entriesProperty);
      const records = Array.isArray(entries) ? (entries as Record<string, unknown>[]) : [];
      const rawToken = getByPath(response, nextTokenProperty);
      const nextToken = rawToken === null || rawToken === undefined ? '' : String(rawToken);

      // Stop when the API says so, when it gives no token, or when the token did not advance
      // (a repeated token would otherwise loop forever on the same chunk).
      const finished =
        toBool(getByPath(response, lastPageProperty)) || !nextToken || nextToken === requestToken;

      nextTokenRef.current = nextToken;
      doneRef.current = finished;
      setRows(prev => [...prev, ...records.map((record, i) => ({ id: prev.length + i, record }))]);
      setStatus(finished ? 'done' : 'idle');
    } catch (e) {
      if (generation !== generationRef.current) return;
      // The token is left unchanged, so a retry re-requests the same chunk.
      setErrorMessage(e instanceof Error ? e.message : 'Unable to load records');
      setStatus('error');
    } finally {
      if (generation === generationRef.current) inFlightRef.current = false;
    }
  }, [
    dataPage,
    paramsError,
    getPConnect,
    extraParams,
    pageSizeParam,
    size,
    tokenParam,
    passCaseID,
    entriesProperty,
    nextTokenProperty,
    lastPageProperty
  ]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    nextTokenRef.current = '';
    inFlightRef.current = false;
    doneRef.current = false;
    setRows([]);
    setErrorMessage('');
    setStatus('idle');
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0;
  }, []);

  // Start a fresh token chain whenever the configuration changes.
  useEffect(() => {
    reset();
    loadMore();
  }, [reset, loadMore]);

  // Re-observe after every chunk: a new observer reports the sentinel's current visibility, so the list
  // keeps filling until it overflows the scroll area even if the user never scrolls.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (status !== 'idle' || !sentinel || typeof IntersectionObserver === 'undefined')
      return undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) loadMore();
      },
      { root: scrollAreaRef.current, rootMargin: '0px 0px 200px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, rows.length, loadMore]);

  const columnDefs = useMemo(
    () => (columns.trim() ? parseColumns(columns) : inferColumns(rows[0]?.record)),
    [columns, rows]
  );

  const tableColumns = useMemo(
    () =>
      columnDefs.map(col => {
        const Cell: ComponentType<Row> = ({ record }) => (
          <>{renderValue(record[col.field], col.type)}</>
        );
        Cell.displayName = `TokenScrollListCell_${col.field}`;
        return {
          label: col.label,
          renderer: Cell,
          align: col.type === 'number' ? ('right' as const) : ('left' as const)
        };
      }),
    [columnDefs]
  );

  const refresh = () => {
    reset();
    loadMore();
  };

  if (!dataPage || paramsError) {
    return (
      <Card data-testid={testId}>
        <CardHeader>
          <Text variant='h2'>{heading}</Text>
        </CardHeader>
        <CardContent>
          <EmptyState message={paramsError || 'Configure a data page to load records'} />
        </CardContent>
      </Card>
    );
  }

  const isFirstLoad = rows.length === 0 && status === 'loading';

  return (
    <Card data-testid={testId}>
      <CardHeader
        actions={
          <Button variant='secondary' compact onClick={refresh} disabled={status === 'loading'}>
            Refresh
          </Button>
        }
      >
        <Flex container={{ alignItems: 'baseline', gap: 1 }}>
          <Text variant='h2'>{heading}</Text>
          {rows.length > 0 && (
            <Text variant='secondary'>{`${rows.length}${status === 'done' ? '' : '+'}`}</Text>
          )}
        </Flex>
      </CardHeader>
      <CardContent>
        <StyledScrollArea
          ref={scrollAreaRef}
          $listHeight={listHeight}
          tabIndex={0}
          aria-label={heading}
        >
          {rows.length > 0 && <Table<Row> columns={tableColumns} data={rows} hoverHighlight />}
          {rows.length === 0 && status === 'done' && <EmptyState message='No records found' />}
          <StyledFooter ref={sentinelRef}>
            {status === 'loading' && (
              <Progress
                placement='inline'
                message={isFirstLoad ? 'Loading records…' : 'Loading more records…'}
              />
            )}
            {status === 'error' && <ErrorState message={errorMessage} onRetry={loadMore} />}
            {status === 'idle' && (
              <Button variant='simple' onClick={loadMore}>
                Load more
              </Button>
            )}
            {status === 'done' && rows.length > 0 && (
              <Text variant='secondary'>{`All ${rows.length} records loaded`}</Text>
            )}
          </StyledFooter>
        </StyledScrollArea>
      </CardContent>
    </Card>
  );
};

export default withConfiguration(ClaudeDxComponentsTokenScrollList);
