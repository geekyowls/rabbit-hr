export function portalUploadPrefix(
  organizationId: string,
  candidateId: string,
): string {
  return `organizations/${organizationId}/portal/${candidateId}/`;
}
