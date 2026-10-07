export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  phone: string;
  address: string;
  createdAt: string;
}

export interface AiConfigItem {
  id: number;
  name: string;
  maskedKey: string;
  rawKey?: string;
  model: string;
  isActive: boolean;
  createdAt: string;
}

export interface AiTestResult {
  success: boolean;
  status: "ready" | "error" | "timeout";
  model: string;
  latencyMs: number;
  message?: string;
  error?: string;
  sampleReply?: string;
}

export interface RowPingState {
  loading: boolean;
  latencyMs?: number;
  success?: boolean;
  error?: string;
}
