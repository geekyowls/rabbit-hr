import { escapeHtml } from '@shared/helpers/html-escape';

const MERGE_FIELD_PATTERN = /\{\{\s*([a-zA-Z]+\.[a-zA-Z]+)\s*\}\}/g;

export type MergeFieldValues = Record<string, string | null | undefined>;

export function renderMergeFields(
  template: string,
  values: MergeFieldValues,
): string {
  return template.replace(
    MERGE_FIELD_PATTERN,
    (_match, key: string) => values[key] ?? '',
  );
}

export function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '<br />');
}
