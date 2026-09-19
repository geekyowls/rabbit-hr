import type { AppConfig, AppConfigUpdate } from './schema';

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-merges `patch` into `base`. Plain-object values are merged recursively;
 * arrays and primitives in `patch` overwrite. `undefined` values in `patch`
 * are ignored, but `null` overwrites.
 */
function deepMerge(
  base: AnyRecord,
  patch: AnyRecord | undefined | null,
): AnyRecord {
  if (!patch) return base;
  const result: AnyRecord = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const baseValue = base[key];
    if (isPlainObject(value) && isPlainObject(baseValue)) {
      result[key] = deepMerge(baseValue, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Builds the effective config served to the mobile app: layers a stored
 * partial override on top of the defaults, then injects the per-tenant block
 * from the organization row.
 */
export function buildEffectiveAppConfig(
  defaults: AppConfig,
  override: AppConfigUpdate | null | undefined,
  tenant: { id: string; slug: string; name: string },
): AppConfig {
  const merged = deepMerge(
    defaults as unknown as AnyRecord,
    (override ?? undefined) as AnyRecord | undefined,
  ) as unknown as AppConfig;
  return { ...merged, tenant };
}

export { deepMerge as deepMergeAppConfig };
