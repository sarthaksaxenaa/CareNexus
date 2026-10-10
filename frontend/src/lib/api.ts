/** API client for CareNexus backend */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  message: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  triage_level: "green" | "yellow" | "red" | "none" | null;
  sources: string | null;
  created_at: string;
}

interface ChatResponse {
  session_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  disclaimer: string;
}

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ─── Auth ─────────────────────────────────

  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  }

  async getMe() {
    return this.request("/api/v1/auth/me");
  }

  private setTokens(access: string, refresh: string) {
    this.accessToken = access;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  }

  logout() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ─── Chat ─────────────────────────────────

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/v1/chat/message", {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id: sessionId || null,
      }),
    });
  }

  async getSessions() {
    return this.request("/api/v1/chat/sessions");
  }

  async getSessionMessages(sessionId: string) {
    return this.request(`/api/v1/chat/sessions/${sessionId}/messages`);
  }
}

export const api = new ApiClient();
export type { AuthResponse, ChatMessage, ChatResponse };
