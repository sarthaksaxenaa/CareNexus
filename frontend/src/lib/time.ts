/**
 * Parse a timestamp from the API.
 *
 * The backend stores naive UTC datetimes, so JSON carries them without an
 * offset ("2026-10-29T18:25:00"). `new Date()` reads such strings as LOCAL
 * time, which shifted every server time by the viewer's UTC offset (5 h 30
 * in India). Strings without an offset are therefore treated as UTC.
 */
export function parseApiDate(value: string): Date {
  const hasOffset = /([zZ]|[+-]\d\d:?\d\d)$/.test(value);
  return new Date(hasOffset ? value : `${value}Z`);
}
