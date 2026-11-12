export const SAFE_USER_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
] as const;

export function safeUserSelect(alias: string): string[] {
  return SAFE_USER_FIELDS.map((field) => `${alias}.${field}`);
}
