import type { MpesaImportRow } from "./types";

export type MpesaMapping = {
  transactionCode?: string;
  transactionDate?: string;
  transactionTime?: string;
  description?: string;
  amount?: string;
  balance?: string;
  phoneNumber?: string;
};

export function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("This file needs a header row and at least one transaction.");
  const parseLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim());
    return values;
  };
  const headers = parseLine(lines[0]);
  return { headers, rows: lines.slice(1).map((line) => {
    const values = parseLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => ({ ...row, [header]: values[index] ?? "" }), {});
  }) };
}

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function detectMpesaMapping(headers: string[]): MpesaMapping {
  const find = (...needles: string[]) => headers.find((header) => needles.some((needle) => normalise(header).includes(needle)));
  return {
    transactionCode: find("transactioncode", "code", "receiptno", "receipt"),
    transactionDate: find("transactiondate", "date"),
    transactionTime: find("transactiontime", "time"),
    description: find("description", "details", "narration"),
    amount: find("amount", "paidin", "paidout"),
    balance: find("balance"),
    phoneNumber: find("phonenumber", "phone", "mobile", "party"),
  };
}

const asAmount = (value?: string) => Number((value ?? "0").replace(/[^0-9.-]/g, "")) || 0;

export function mapMpesaRows(rows: Record<string, string>[], mapping: MpesaMapping): MpesaImportRow[] {
  return rows.map((row) => ({
    transactionCode: row[mapping.transactionCode ?? ""]?.trim().toUpperCase() || "",
    transactionDate: row[mapping.transactionDate ?? ""]?.trim(),
    transactionTime: row[mapping.transactionTime ?? ""]?.trim(),
    description: row[mapping.description ?? ""]?.trim(),
    amount: asAmount(row[mapping.amount ?? ""]),
    balance: asAmount(row[mapping.balance ?? ""]),
    phoneNumber: row[mapping.phoneNumber ?? ""]?.trim(),
  })).filter((row) => row.transactionCode && row.amount > 0);
}
