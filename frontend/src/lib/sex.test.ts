import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEX_OPTIONS, isSex, needsSex, readStoredUser, safeNext, storeUser } from "./sex";

describe("sex options", () => {
  it("offers exactly female and male", () => {
    expect(SEX_OPTIONS.map((o) => o.value)).toEqual(["female", "male"]);
  });

  it.each([
    ["male", true],
    ["female", true],
    ["Male", false],
    ["other", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("isSex(%j) is %s", (value, expected) => {
    expect(isSex(value)).toBe(expected);
  });
});

describe("needsSex", () => {
  it("asks accounts that have none", () => {
    expect(needsSex({ sex: null })).toBe(true);
    expect(needsSex({})).toBe(true);
    expect(needsSex({ sex: "other" })).toBe(true);
  });

  it("does not ask accounts that have one, or nobody at all", () => {
    expect(needsSex({ sex: "female" })).toBe(false);
    expect(needsSex(null)).toBe(false);
  });
});

describe("stored user", () => {
  // Node test environment: give the module a window and a memory store.
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      clear: () => data.clear(),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("round-trips", () => {
    storeUser({ id: "1", email: "a@example.com", full_name: "Asha", sex: "female" });
    expect(readStoredUser()?.sex).toBe("female");
  });

  it("treats corrupt or foreign values as no user", () => {
    localStorage.setItem("user", "{not json");
    expect(readStoredUser()).toBeNull();
    localStorage.setItem("user", JSON.stringify({ name: "x" }));
    expect(readStoredUser()).toBeNull();
  });
});

describe("safeNext", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/chat?session=1", "/chat?session=1"],
    [null, "/chat"],
    ["", "/chat"],
    ["https://evil.example", "/chat"],
    ["//evil.example", "/chat"],
    ["/\\evil.example", "/chat"],
    ["/onboarding", "/chat"],
  ])("safeNext(%j) is %j", (next, expected) => {
    expect(safeNext(next)).toBe(expected);
  });
});
