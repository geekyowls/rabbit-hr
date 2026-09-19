export type CoBrandingOrder =
  | 'rabbithr-first'
  | 'partner-first'
  | 'partner-only';

export interface OrgFeatureControls {
  maxActiveClients?: number | null;
  maxUsers?: number | null;

  canInviteUsers?: boolean;
  canUseRbac?: boolean;
  canBulkImport?: boolean;

  canExportPdf?: boolean;
  canUseAI?: boolean;
  canUseTemplates?: boolean;
  canUseTypesenseSearch?: boolean;
  canUseRecipes?: boolean;
  canUseGuidelines?: boolean;
  canUseShareLinkMealPhotos?: boolean;

  canUseIntegrations?: boolean;
  canUseApi?: boolean;
  canUseWebhooks?: boolean;

  canUseClientApp?: boolean;
  canUsePushNotifications?: boolean;
  canUseWhiteLabel?: boolean;
  iapEnabled?: boolean;

  coBrandingEnabled?: boolean;
  coBrandingOrder?: CoBrandingOrder;

  canExportReports?: boolean;
  canUseAdvancedAnalytics?: boolean;
  canUseDemoScreens?: boolean;

  paymentPopupMode?: 'modal' | 'banner' | 'both';
  expiredAccessMode?: 'lockout' | 'read_only';

  reEngagementEmailsEnabled?: boolean;
  dailyDigestEnabled?: boolean;
}

export const FEATURE_CONTROL_DEFAULTS: Required<OrgFeatureControls> = {
  maxActiveClients: null,
  maxUsers: null,
  canInviteUsers: true,
  canUseRbac: true,
  canBulkImport: true,
  canExportPdf: true,
  canUseAI: false,
  canUseTemplates: true,
  canUseTypesenseSearch: true,
  canUseRecipes: true,
  canUseGuidelines: true,
  canUseShareLinkMealPhotos: false,
  canUseIntegrations: true,
  canUseApi: false,
  canUseWebhooks: false,
  canUseClientApp: true,
  canUsePushNotifications: true,
  canUseWhiteLabel: false,
  iapEnabled: false,
  coBrandingEnabled: false,
  coBrandingOrder: 'rabbithr-first',
  canExportReports: true,
  canUseAdvancedAnalytics: true,
  canUseDemoScreens: false,
  paymentPopupMode: 'both',
  expiredAccessMode: 'lockout',
  reEngagementEmailsEnabled: true,
  dailyDigestEnabled: true,
};

export function getFeatureControl<K extends keyof OrgFeatureControls>(
  controls: OrgFeatureControls | null | undefined,
  key: K,
): Required<OrgFeatureControls>[K] {
  const value = controls?.[key];
  return (
    value !== undefined && value !== null
      ? value
      : FEATURE_CONTROL_DEFAULTS[key]
  ) as Required<OrgFeatureControls>[K];
}
