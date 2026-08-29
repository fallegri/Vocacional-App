import { describe, it, expect, afterEach } from "vitest";
import {
  authorizeStaff,
  authorizeStaffRequest,
  isStaffAuthEnabled,
  STAFF_TOKEN_HEADER,
} from "@/lib/auth/staff";

const ORIGINAL = process.env.STAFF_ACCESS_TOKEN;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STAFF_ACCESS_TOKEN;
  else process.env.STAFF_ACCESS_TOKEN = ORIGINAL;
});

describe("authorizeStaff (demo mode)", () => {
  it("allows any mutation when STAFF_ACCESS_TOKEN is not set", () => {
    delete process.env.STAFF_ACCESS_TOKEN;
    expect(isStaffAuthEnabled()).toBe(false);
    expect(authorizeStaff(null).ok).toBe(true);
    expect(authorizeStaff("").ok).toBe(true);
    expect(authorizeStaff("whatever").ok).toBe(true);
  });
});

describe("authorizeStaff (token enforced)", () => {
  it("rejects when no token is presented", () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect(isStaffAuthEnabled()).toBe(true);
    const res = authorizeStaff(null);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rejects an incorrect token", () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    const res = authorizeStaff("otro");
    expect(res.ok).toBe(false);
  });

  it("accepts the correct token (trimmed)", () => {
    process.env.STAFF_ACCESS_TOKEN = "secreto-123";
    expect(authorizeStaff("secreto-123").ok).toBe(true);
    expect(authorizeStaff("  secreto-123  ").ok).toBe(true);
  });
});

describe("authorizeStaffRequest", () => {
  it("reads the token from the x-staff-token header", () => {
    process.env.STAFF_ACCESS_TOKEN = "abc";
    const ok = new Request("https://x/api", {
      headers: { [STAFF_TOKEN_HEADER]: "abc" },
    });
    expect(authorizeStaffRequest(ok).ok).toBe(true);

    const bad = new Request("https://x/api", {
      headers: { [STAFF_TOKEN_HEADER]: "nope" },
    });
    expect(authorizeStaffRequest(bad).ok).toBe(false);
  });
});
