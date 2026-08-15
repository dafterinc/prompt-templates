import { describe, it, expect } from 'vitest';
import { parseCSV, escapeCSVField, toCSV } from './csv';

describe('parseCSV', () => {
	it('parses simple rows', () => {
		expect(parseCSV('a,b,c\n1,2,3')).toEqual([
			['a', 'b', 'c'],
			['1', '2', '3']
		]);
	});

	it('keeps commas inside quoted fields', () => {
		expect(parseCSV('"a,b",c')).toEqual([['a,b', 'c']]);
	});

	it('keeps newlines inside quoted fields (the multiline-content case)', () => {
		expect(parseCSV('"line one\nline two",next')).toEqual([['line one\nline two', 'next']]);
	});

	it('unescapes doubled quotes', () => {
		expect(parseCSV('"she said ""hi"""')).toEqual([['she said "hi"']]);
	});

	it('does not trim significant whitespace inside quotes', () => {
		expect(parseCSV('"  spaced  "')).toEqual([['  spaced  ']]);
	});
});

describe('escapeCSVField', () => {
	it('quotes fields containing separators and escapes quotes', () => {
		expect(escapeCSVField('a,b')).toBe('"a,b"');
		expect(escapeCSVField('has "quote"')).toBe('"has ""quote"""');
		expect(escapeCSVField('multi\nline')).toBe('"multi\nline"');
		expect(escapeCSVField('plain')).toBe('plain');
		expect(escapeCSVField(null)).toBe('');
	});
});

describe('toCSV + parseCSV round-trip', () => {
	it('round-trips multiline template content the app exports', () => {
		const headers = ['Title', 'Content'];
		const rows = [['Greeting', 'Hello {{name}},\n\nWelcome aboard!']];
		const csv = toCSV(headers, rows);
		const parsed = parseCSV(csv);
		expect(parsed[0]).toEqual(headers);
		expect(parsed[1]).toEqual(rows[0]);
	});
});
