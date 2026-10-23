export type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'boolean';

export type ColumnDef = {
  field: string;
  label: string;
  type: ColumnType;
};

const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'date', 'datetime', 'boolean'];

/** Pega passes booleans from the property panel as either true or 'true'. */
export const toBool = (value: unknown): boolean => value === true || value === 'true';

/** Reads a dot-separated path such as 'header.nextIdentifier' from a data page response. */
export const getByPath = (source: unknown, path: string): unknown => {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key.trim()];
    }
    return undefined;
  }, source);
};

/**
 * Parses 'field:Label:type, field2:Label2' into column definitions.
 * Label defaults to the field name, type defaults to text.
 */
export const parseColumns = (columns: string): ColumnDef[] =>
  columns
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const [field, label, type] = entry.split(':').map(part => part.trim());
      const columnType = (type || 'text').toLowerCase() as ColumnType;
      return {
        field,
        label: label || field,
        type: COLUMN_TYPES.includes(columnType) ? columnType : 'text'
      };
    });

/** Builds columns from the primitive-valued keys of the first record when none are configured. */
export const inferColumns = (record: Record<string, unknown> | undefined): ColumnDef[] =>
  record
    ? Object.keys(record)
        .filter(key => record[key] === null || typeof record[key] !== 'object')
        .map(key => ({ field: key, label: key, type: 'text' as ColumnType }))
    : [];

export type ParsedParams = {
  params: Record<string, string>;
  error?: string;
};

/** Parses the optional JSON object of extra data page parameters, e.g. {"fromDate":"2024-07-12"}. */
export const parseAdditionalParams = (json: string): ParsedParams => {
  if (!json || !json.trim()) return { params: {} };
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { params: {}, error: 'Additional parameters must be a JSON object' };
    }
    const params: Record<string, string> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    });
    return { params };
  } catch {
    return { params: {}, error: 'Additional parameters is not valid JSON' };
  }
};

/** Coerces the configured page size to a sensible positive integer. */
export const toPageSize = (value: unknown, fallback = 50): number => {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 1) return fallback;
  return Math.min(Math.floor(size), 500);
};
