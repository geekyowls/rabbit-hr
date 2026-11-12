export interface JobFeedUrls {
  indeed: string;
  linkedin: string;
}

export interface JobFeedSettings {
  enabled: boolean;
  includeClientNames: boolean;
  lastAccessedAt: string | null;
  updatedAt: string | null;
  feedUrls: JobFeedUrls | null;
}

export interface UpdateJobFeedSettingsRequest {
  enabled?: boolean;
  includeClientNames?: boolean;
  regenerateToken?: boolean;
}
