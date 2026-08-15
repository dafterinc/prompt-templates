// Shared {{variable}} parsing and rendering.
//
// This is the app's core algorithm and was previously copy-pasted across seven route files
// with subtle drift (some sites trimmed variable names, some did not; the renderer built a
// RegExp from the raw variable name, which throws on regex metacharacters). Centralising it
// here means placeholder semantics live in exactly one place.

// Matches {{ anything-but-a-closing-brace }}.
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

export interface TemplateVariable {
	name: string;
	description?: string | null;
	type?: string;
	default_value?: string | null;
	is_required?: boolean;
	[key: string]: unknown;
}

export interface ContentSegment<V = TemplateVariable> {
	type: 'text' | 'variable';
	content: string;
	variable?: V;
}

/** Escape a string so it can be embedded literally inside a RegExp. */
export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract the unique, trimmed variable names referenced in template content,
 * in first-seen order.
 */
export function extractVariableNames(content: string): string[] {
	if (!content) return [];
	const matches = content.matchAll(VARIABLE_REGEX);
	const seen = new Set<string>();
	const names: string[] = [];
	for (const match of matches) {
		const name = match[1].trim();
		if (name && !seen.has(name)) {
			seen.add(name);
			names.push(name);
		}
	}
	return names;
}

/**
 * Split template content into text and variable segments. Variable placeholders whose
 * (trimmed) name has no matching variable definition are emitted as plain text.
 */
export function parseTemplateContent<V extends { name: string }>(
	content: string,
	variables: V[]
): ContentSegment<V>[] {
	const segments: ContentSegment<V>[] = [];
	if (!content) return segments;

	const byName = new Map(variables.map((v) => [v.name, v]));
	const regex = new RegExp(VARIABLE_REGEX.source, 'g');
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		const variableName = match[1].trim();
		const matchedVariable = byName.get(variableName);

		if (match.index > lastIndex) {
			segments.push({ type: 'text', content: content.substring(lastIndex, match.index) });
		}

		if (matchedVariable) {
			segments.push({ type: 'variable', content: variableName, variable: matchedVariable });
		} else {
			// No matching variable — keep the raw placeholder as text.
			segments.push({ type: 'text', content: match[0] });
		}

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		segments.push({ type: 'text', content: content.substring(lastIndex) });
	}

	return segments;
}

/**
 * Substitute variable values into template content. Placeholders are matched on their trimmed
 * name, so `{{ name }}` and `{{name}}` both resolve. Missing values fall back to an empty string.
 */
export function generateText(content: string, variableValues: Record<string, string>): string {
	if (!content) return '';
	return content.replace(VARIABLE_REGEX, (whole, rawName: string) => {
		const name = rawName.trim();
		return Object.prototype.hasOwnProperty.call(variableValues, name)
			? (variableValues[name] ?? '')
			: whole;
	});
}
