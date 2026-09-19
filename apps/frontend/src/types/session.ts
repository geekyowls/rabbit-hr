export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
}
