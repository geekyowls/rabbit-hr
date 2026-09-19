export interface SavedView {
  name: string;
  filters: Record<string, string>;
}

export interface PagePreference {
  savedViews?: SavedView[];
  columns?: string[];
}

export type PagePreferences = Record<string, PagePreference>;
