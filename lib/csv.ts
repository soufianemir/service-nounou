export type CsvParseResult = {
  headers: string[];
  rows: string[][];
};

function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  let comma = 0;
  let semi = 0;
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i += 1) {
    const ch = firstLine[i];
    if (ch === "\"") {
      const next = firstLine[i + 1];
      if (inQuotes && next === "\"") {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (ch === ",") comma += 1;
      if (ch === ";") semi += 1;
    }
  }
  return semi > comma ? ";" : ",";
}

export function parseCsv(input: string): CsvParseResult {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (!text) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\"") {
      const next = text[i + 1];
      if (inQuotes && next === "\"") {
        field += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    field += ch;
  }

  row.push(field);
  rows.push(row);

  const cleaned = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (cleaned.length === 0) return { headers: [], rows: [] };

  const headers = cleaned.shift()!.map((h) => h.trim());
  const dataRows = cleaned.map((r) => r.map((cell) => cell.trim()));
  return { headers, rows: dataRows };
}

export function normalizeHeader(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function buildHeaderIndex(
  headers: string[],
  aliases: Record<string, string[]>
): Record<string, number> {
  const normalized = headers.map((h) => normalizeHeader(h));
  const index: Record<string, number> = {};
  Object.entries(aliases).forEach(([key, values]) => {
    for (const alias of values) {
      const idx = normalized.indexOf(normalizeHeader(alias));
      if (idx >= 0) {
        index[key] = idx;
        break;
      }
    }
  });
  return index;
}

export function getCell(row: string[], idx?: number): string {
  if (idx === undefined || idx < 0 || idx >= row.length) return "";
  return String(row[idx] ?? "").trim();
}
