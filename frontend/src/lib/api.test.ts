import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api";

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("ApiClient 401 handling", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = memoryStorage({ access_token: "old-access", refresh_token: "good-refresh" });
    assign = vi.fn();
    vi.stubGlobal("window", { location: { assign, pathname: "/chat" } });
    vi.stubGlobal("localStorage", storage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("refreshes once on 401 and retries the original request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { detail: "Invalid or expired token" }))
      .mockResolvedValueOnce(json(200, { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ApiClient().request<{ ok: boolean }>("/api/v1/chat/sessions");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(String(refreshUrl)).toMatch(/\/api\/v1\/auth\/refresh$/);
    expect(JSON.parse(refreshInit.body)).toEqual({ refresh_token: "good-refresh" });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer new-access");
    expect(storage.getItem("access_token")).toBe("new-access");
    expect(storage.getItem("refresh_token")).toBe("new-refresh");
  });

  it("logs out and redirects to /login when the refresh also fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { detail: "Invalid or expired token" }))
      .mockResolvedValueOnce(json(401, { detail: "Invalid or expired refresh token" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient();

    await expect(client.request("/api/v1/chat/sessions")).rejects.toThrow("Session expired");

    expect(client.isAuthenticated()).toBe(false);
    expect(storage.getItem("access_token")).toBeNull();
    expect(storage.getItem("refresh_token")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("does not try to refresh a failed login (wrong password is not an expired session)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(401, { detail: "Incorrect email or password" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ApiClient().request("/api/v1/auth/login", { method: "POST" })).rejects.toThrow(
      "Incorrect email or password"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("shares one refresh between concurrent requests (single-flight)", async () => {
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/auth/refresh")) {
        refreshCalls += 1;
        return json(200, { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" });
      }
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === "Bearer new-access" ? json(200, { ok: true }) : json(401, { detail: "Invalid or expired token" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient();

    await Promise.all([client.request("/a"), client.request("/b"), client.request("/c")]);

    expect(refreshCalls).toBe(1);
  });
});

describe("ApiClient error messages", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { assign: vi.fn(), pathname: "/register" } });
    vi.stubGlobal("localStorage", memoryStorage());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("turns a validation error into a readable sentence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json(422, { message: "Invalid request data", detail: [{ field: "body.email", message: "value is not a valid email address" }] }),
      ),
    );
    await expect(new ApiClient().request("/api/v1/auth/register", { method: "POST" })).rejects.toThrow(
      "Email: Value is not a valid email address",
    );
  });

  it("reports an unreachable server instead of 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(new ApiClient().request("/api/v1/chat/sessions")).rejects.toThrow(/Cannot reach the CareNexus server/);
  });
});
