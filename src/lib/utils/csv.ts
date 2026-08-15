// Shared CSV parsing/serialisation.
//
// Previously each page split the file on '\n' BEFORE quote-aware parsing, which shatters any
// quoted field that legitimately contains a newline (template content is routinely multiline),
// so the app could not re-import its own exports. This parser is a single pass over the whole
// text that respects quotes across newlines, and it does NOT trim field contents.

/**
 * Parse CSV text into rows of fields. Handles quoted fields containing commas, quotes
 * (escaped as ""), and newlines. Trailing blank lines are ignored.
 */
export function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let field = '';
	let row: string[] = [];
	let inQuotes = false;
	let sawAny = false;

	// Normalise Windows/Mac line endings so a quoted "\r\n" round-trips predictably.
	const input = text.replace(/\r\n?/g, '\n');

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (inQuotes) {
			if (char === '"') {
				if (input[i + 1] === '"') {
					field += '"';
					i++; // skip the escaped quote
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
		} else if (char === ',') {
			row.push(field);
			field = '';
			sawAny = true;
		} else if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			sawAny = false;
		} else {
			field += char;
			sawAny = true;
		}
	}

	// Flush the final field/row unless the input ended on a clean newline.
	if (sawAny || field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}

/** Escape a single value for inclusion in a CSV cell. */
export function escapeCSVField(value: unknown): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/** Build CSV text from a header row and data rows. */
export function toCSV(headers: string[], rows: unknown[][]): string {
	const lines = [headers.map(escapeCSVField).join(',')];
	for (const row of rows) {
		lines.push(row.map(escapeCSVField).join(','));
	}
	return lines.join('\n');
}
