import { describe, expect, it } from "vitest";
import { NETWORK_ERROR, errorMessage } from "./errors";

describe("errorMessage", () => {
  it("uses a plain string detail", () => {
    expect(errorMessage(401, { detail: "Invalid email or password" })).toBe("Invalid email or password");
  });

  it("reads the message inside a rate-limit detail object", () => {
    const body = { detail: { error: "RateLimitExceeded", message: "Too many requests. Please try again in 42 seconds." } };
    expect(errorMessage(429, body)).toBe("Too many requests. Please try again in 42 seconds.");
  });

  it("names the field for validation errors", () => {
    const body = {
      error: "ValidationError",
      message: "Invalid request data",
      detail: [{ field: "body.email", message: "value is not a valid email address", type: "value_error" }],
    };
    expect(errorMessage(422, body)).toBe("Email: Value is not a valid email address");
  });

  it("handles FastAPI's default validation shape too", () => {
    const body = { detail: [{ loc: ["body", "full_name"], msg: "String should have at least 2 characters" }] };
    expect(errorMessage(422, body)).toBe("Full name: String should have at least 2 characters");
  });

  it("falls back to the top-level message", () => {
    expect(errorMessage(500, { error: "InternalServerError", message: "An unexpected error occurred" })).toBe(
      "An unexpected error occurred",
    );
  });

  it("never returns [object Object]", () => {
    for (const body of [{ detail: {} }, { detail: [] }, { detail: [{}] }, {}, null, "oops"]) {
      expect(errorMessage(400, body)).not.toContain("[object");
    }
  });

  it("explains server errors without a body", () => {
    expect(errorMessage(502, null)).toMatch(/server ran into a problem/);
  });

  it("explains a network failure", () => {
    expect(errorMessage(0, null)).toBe(NETWORK_ERROR);
  });
});
