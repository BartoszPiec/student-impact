export function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
