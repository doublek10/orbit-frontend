export interface Session {
  userId: string;
  email: string | null;
  companyId: string;
  companyName: string | null;
  role: string | null;
  permissions: string[];
}

export interface SessionResponse {
  session: Session | null;
}
