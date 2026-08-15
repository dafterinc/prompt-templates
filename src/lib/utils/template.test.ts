import { describe, it, expect } from 'vitest';
import {
	escapeRegExp,
	extractVariableNames,
	parseTemplateContent,
	generateText
} from './template';

describe('extractVariableNames', () => {
	it('extracts unique, trimmed names in first-seen order', () => {
		expect(extractVariableNames('Hi {{ name }}, you owe {{ amount }}. Bye {{name}}.')).toEqual([
			'name',
			'amount'
		]);
	});

	it('returns an empty array when there are no placeholders', () => {
		expect(extractVariableNames('no variables here')).toEqual([]);
		expect(extractVariableNames('')).toEqual([]);
	});
});

describe('generateText', () => {
	it('substitutes values, matching on the trimmed name', () => {
		const out = generateText('Hello {{name}}, {{ name }} again', { name: 'World' });
		expect(out).toBe('Hello World, World again');
	});

	it('handles variable names containing regex metacharacters without throwing', () => {
		// The old implementation built `new RegExp` from the raw name and threw / mis-matched here.
		const content = 'Total: {{price (USD)}} and {{a*b}}';
		const values = { 'price (USD)': '5', 'a*b': 'x' };
		expect(generateText(content, values)).toBe('Total: 5 and x');
	});

	it('leaves placeholders without a provided value untouched', () => {
		expect(generateText('Hi {{name}}', {})).toBe('Hi {{name}}');
	});
});

describe('parseTemplateContent', () => {
	it('splits content into text and variable segments', () => {
		const segments = parseTemplateContent('a {{x}} b', [{ name: 'x' }]);
		expect(segments).toEqual([
			{ type: 'text', content: 'a ' },
			{ type: 'variable', content: 'x', variable: { name: 'x' } },
			{ type: 'text', content: ' b' }
		]);
	});

	it('matches variables by trimmed name', () => {
		const segments = parseTemplateContent('{{ x }}', [{ name: 'x' }]);
		expect(segments).toHaveLength(1);
		expect(segments[0].type).toBe('variable');
	});

	it('renders unmatched placeholders as plain text', () => {
		const segments = parseTemplateContent('{{unknown}}', [{ name: 'x' }]);
		expect(segments).toEqual([{ type: 'text', content: '{{unknown}}' }]);
	});
});

describe('escapeRegExp', () => {
	it('escapes regex metacharacters', () => {
		expect(escapeRegExp('a.b*c(')).toBe('a\\.b\\*c\\(');
	});
});
