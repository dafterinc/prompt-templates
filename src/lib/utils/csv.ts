/**
 * CSV helpers shared by the template and directory import/export flows.
 *
 * The parser is quote-aware across newlines. That matters here: template content is routinely
 * multi-line, `escapeCSVValue` quotes it on export, and a parser that splits the file on "\n"
 * would tear those records apart on the way back in.
 */

/** Quotes a value if it contains a comma, quote, or newline, doubling any embedded quotes. */
export function escapeCSVValue(value: unknown): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/** Builds a CSV document from a header row and data rows. Values are escaped for you. */
export function toCSV(headers: string[], rows: unknown[][]): string {
	return [
		headers.map(escapeCSVValue).join(','),
		...rows.map((row) => row.map(escapeCSVValue).join(','))
	].join('\n');
}

/**
 * Parses a whole CSV document into rows of fields.
 *
 * Handles quoted fields containing commas, escaped quotes (""), and newlines, plus CRLF line
 * endings. Entirely blank lines are dropped. Fields are returned trimmed unless they were quoted,
 * since a quoted field's leading/trailing whitespace is significant.
 */
export function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	let wasQuoted = false;

	const endField = () => {
		row.push(wasQuoted ? field : field.trim());
		field = '';
		wasQuoted = false;
	};

	const endRow = () => {
		endField();
		// Skip rows that are entirely empty (trailing newline, blank separator lines).
		if (row.some((value) => value !== '')) rows.push(row);
		row = [];
	};

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			wasQuoted = true;
		} else if (char === ',') {
			endField();
		} else if (char === '\n') {
			endRow();
		} else if (char === '\r') {
			// Swallow CR; the following LF ends the row. A lone CR also ends it.
			if (text[i + 1] !== '\n') endRow();
		} else {
			field += char;
		}
	}

	// Flush whatever the final line left behind.
	if (field !== '' || row.length > 0) endRow();

	return rows;
}

export interface CSVParseResult {
	headers: string[];
	/** One record per data row, keyed by header name. Short rows are padded with ''. */
	records: Record<string, string>[];
	/**
	 * Indices into `records` whose row had a different number of fields than the header.
	 * Those records are still returned (padded or truncated) so the caller decides whether to
	 * skip them or import what it can.
	 */
	malformedRows: Set<number>;
}

export class CSVFormatError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CSVFormatError';
	}
}

/**
 * Parses a CSV document into header-keyed records.
 *
 * Throws `CSVFormatError` when the file has no data rows or is missing a required header, so
 * callers can surface the message directly to the user.
 */
export function parseCSVRecords(text: string, requiredHeaders: string[] = []): CSVParseResult {
	const rows = parseCSV(text);

	if (rows.length < 2) {
		throw new CSVFormatError('CSV file must have at least a header row and one data row');
	}

	const headers = rows[0].map((header) => header.trim().replace(/^"|"$/g, ''));
	const missing = requiredHeaders.filter((header) => !headers.includes(header));
	if (missing.length > 0) {
		throw new CSVFormatError(`Missing required headers: ${missing.join(', ')}`);
	}

	const malformedRows = new Set<number>();
	const records = rows.slice(1).map((row, rowIndex) => {
		if (row.length !== headers.length) malformedRows.add(rowIndex);

		const record: Record<string, string> = {};
		headers.forEach((header, index) => {
			record[header] = row[index] ?? '';
		});
		return record;
	});

	return { headers, records, malformedRows };
}

/** Triggers a browser download of `content` as `filename`. */
export function downloadCSV(filename: string, content: string): void {
	// Prepend a BOM so Excel reads the file as UTF-8 rather than the local codepage.
	const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/** `prefix-YYYY-MM-DD.csv`, the naming both export flows use. */
export function timestampedFilename(prefix: string): string {
	return `${prefix}-${new Date().toISOString().split('T')[0]}.csv`;
}
