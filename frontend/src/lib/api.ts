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

interface ChatSessionInfo {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  is_active: boolean;
}

/** Endpoints where a 401 means "wrong credentials", not "your session expired". */
const AUTH_ENDPOINTS = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh"];

export class ApiClient {
  private accessToken: string | null = null;
  /** In-flight refresh, shared so concurrent 401s trigger a single refresh call. */
  private refreshing: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.send(endpoint, options);

    if (response.status === 401 && !AUTH_ENDPOINTS.includes(endpoint)) {
      // The access token expired (or is invalid). Try to renew it once, then replay.
      if (await this.refreshSession()) {
        return this.parse<T>(await this.send(endpoint, options));
      }
      this.logout();
      this.redirectToLogin();
      throw new Error("Session expired. Please log in again.");
    }

    return this.parse<T>(response);
  }

  private send(endpoint: string, options: RequestInit): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    // 204 No Content — no body to parse (e.g. DELETE responses)
    if (response.status === 204) {
      return null as T;
    }
    return response.json();
  }

  /** Exchange the stored refresh token for a new pair. Resolves false if that is impossible. */
  private refreshSession(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refresh) return false;
    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/refresh?refresh_token=${encodeURIComponent(refresh)}`,
        { method: "POST" }
      );
      if (!response.ok) return false;
      const tokens = (await response.json()) as { access_token: string; refresh_token: string };
      this.setTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  private redirectToLogin() {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      // Hard navigation on purpose: this client lives outside React, and a reload drops stale state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
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

  async getSessions(): Promise<ChatSessionInfo[]> {
    const data = await this.request<{ sessions: ChatSessionInfo[]; total: number }>(
      "/api/v1/chat/sessions"
    );
    return data.sessions;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const data = await this.request<{ session_id: string; messages: ChatMessage[] }>(
      `/api/v1/chat/sessions/${sessionId}/messages`
    );
    return data.messages;
  }

  // ─── Health Profile ──────────────────────────────

  async getHealthProfile() {
    return this.request("/api/v1/health-profile/");
  }

  async createHealthProfile(data: Record<string, unknown>) {
    return this.request("/api/v1/health-profile/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateHealthProfile(data: Record<string, unknown>) {
    return this.request("/api/v1/health-profile/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteHealthProfile() {
    return this.request("/api/v1/health-profile/", {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
export type { AuthResponse, ChatMessage, ChatResponse, ChatSessionInfo };
