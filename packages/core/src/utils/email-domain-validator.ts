/**
 * Validates if an email address belongs to the specified domain.
 * @param email - The email address to validate
 * @param allowedDomain - The domain that the email should belong to (e.g., 'company.com')
 * @returns true if the email domain matches the allowed domain, false otherwise
 */
export function validateEmailDomain(email: string, allowedDomain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const normalizedAllowedDomain = allowedDomain.toLowerCase();

  return emailDomain === normalizedAllowedDomain;
}

/**
 * Extracts the domain from an email address.
 * @param email - The email address
 * @returns The domain part of the email, or empty string if invalid
 */
export function extractEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}
