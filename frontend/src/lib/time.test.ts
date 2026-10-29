import { describe, expect, it } from "vitest";
import { parseApiDate } from "./time";

describe("parseApiDate", () => {
  it("treats a naive API timestamp as UTC", () => {
    expect(parseApiDate("2026-10-29T18:25:00").toISOString()).toBe("2026-10-29T18:25:00.000Z");
  });

  it("keeps an explicit Z", () => {
    expect(parseApiDate("2026-10-29T18:25:00Z").toISOString()).toBe("2026-10-29T18:25:00.000Z");
  });

  it("keeps an explicit offset", () => {
    expect(parseApiDate("2026-10-29T23:55:00+05:30").toISOString()).toBe("2026-10-29T18:25:00.000Z");
  });

  it("handles fractional seconds", () => {
    expect(parseApiDate("2026-10-29T18:25:00.123456").getTime()).toBe(Date.UTC(2026, 9, 29, 18, 25, 0, 123));
  });
});
