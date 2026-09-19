/**
 * Formats a user's full name from firstName and lastName.
 * Falls back to email if name is not available.
 *
 * @param user - User object with firstName, lastName, and email
 * @returns Formatted name string or null if user is null/undefined
 */
export function formatUserName(
  user:
    | {
        firstName: string | null;
        lastName: string | null;
        email: string;
      }
    | null
    | undefined,
): string | null {
  if (!user) {
    return null;
  }

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return user.email ?? null;
}
