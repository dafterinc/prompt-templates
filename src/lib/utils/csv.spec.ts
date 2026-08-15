import { describe, it, expect } from 'vitest';
import {
	CSVFormatError,
	escapeCSVValue,
	parseCSV,
	parseCSVRecords,
	timestampedFilename,
	toCSV
} from './csv';

describe('escapeCSVValue', () => {
	it('leaves plain values alone', () => {
		expect(escapeCSVValue('hello')).toBe('hello');
	});

	it('renders null and undefined as empty', () => {
		expect(escapeCSVValue(null)).toBe('');
		expect(escapeCSVValue(undefined)).toBe('');
	});

	it('quotes values containing commas, quotes, or newlines', () => {
		expect(escapeCSVValue('a,b')).toBe('"a,b"');
		expect(escapeCSVValue('say "hi"')).toBe('"say ""hi"""');
		expect(escapeCSVValue('line1\nline2')).toBe('"line1\nline2"');
	});
});

describe('parseCSV', () => {
	it('parses a simple document', () => {
		expect(parseCSV('a,b\n1,2')).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('keeps commas inside quoted fields', () => {
		expect(parseCSV('a,b\n"x,y",2')).toEqual([
			['a', 'b'],
			['x,y', '2']
		]);
	});

	it('unescapes doubled quotes', () => {
		expect(parseCSV('a\n"say ""hi"""')).toEqual([['a'], ['say "hi"']]);
	});

	it('keeps newlines inside quoted fields as one record', () => {
		const rows = parseCSV('Title,Content\nGreeting,"Hello {{name}},\n\nRegards"');
		expect(rows).toHaveLength(2);
		expect(rows[1]).toEqual(['Greeting', 'Hello {{name}},\n\nRegards']);
	});

	it('handles CRLF line endings', () => {
		expect(parseCSV('a,b\r\n1,2\r\n')).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('drops entirely blank rows', () => {
		expect(parseCSV('a\n\n1\n')).toEqual([['a'], ['1']]);
	});

	it('preserves whitespace inside quoted fields but trims bare ones', () => {
		expect(parseCSV('" padded ", bare ')).toEqual([[' padded ', 'bare']]);
	});
});

describe('toCSV / parseCSV round trip', () => {
	it('survives content with commas, quotes, and newlines', () => {
		const headers = ['Title', 'Content'];
		const rows = [['Greeting', 'Hi {{name}},\nThanks for the "note", truly.']];
		const parsed = parseCSV(toCSV(headers, rows));

		expect(parsed[0]).toEqual(headers);
		expect(parsed[1]).toEqual(rows[0]);
	});
});

describe('parseCSVRecords', () => {
	it('keys each row by header', () => {
		const { records } = parseCSVRecords('Title,Content\nA,B');
		expect(records).toEqual([{ Title: 'A', Content: 'B' }]);
	});

	it('pads short rows with empty strings and flags them', () => {
		const { records, malformedRows } = parseCSVRecords('Title,Content,Extra\nA,B');
		expect(records[0].Extra).toBe('');
		expect(malformedRows.has(0)).toBe(true);
	});

	it('does not flag rows whose field count matches the header', () => {
		const { malformedRows } = parseCSVRecords('Title,Content\nA,B\nC,D');
		expect(malformedRows.size).toBe(0);
	});

	it('rejects a file with no data rows', () => {
		expect(() => parseCSVRecords('Title,Content')).toThrow(CSVFormatError);
	});

	it('reports every missing required header', () => {
		expect(() => parseCSVRecords('Title\nA', ['Title', 'Content', 'Category Name'])).toThrow(
			'Missing required headers: Content, Category Name'
		);
	});
});

describe('timestampedFilename', () => {
	it('appends an ISO date and the csv extension', () => {
		expect(timestampedFilename('my-templates')).toMatch(/^my-templates-\d{4}-\d{2}-\d{2}\.csv$/);
	});
});
