// Same lists as the API (Sadikoi-API, src/models.py), which rejects any other value.
// The labels are in the i18n files, under feedback.bugCategories and reportUser.categories.

export const OTHER_CATEGORY = 'other';

export const BUG_CATEGORIES = [
  'crash', 'display', 'performance', 'feature', 'account', 'notifications', 'connection', OTHER_CATEGORY,
] as const;

export const REPORT_CATEGORIES = [
  'harassment', 'hate_speech', 'sexual_content', 'violence', 'self_harm', 'spam', 'impersonation', 'privacy',
  'inappropriate_profile', OTHER_CATEGORY,
] as const;

export type BugCategory = typeof BUG_CATEGORIES[number];
export type ReportCategory = typeof REPORT_CATEGORIES[number];
