export function buildSlugFromDomain(domain: string): string | undefined {
  const domainWithoutTLD = domain.split('.')[0];
  return domainWithoutTLD;
}
