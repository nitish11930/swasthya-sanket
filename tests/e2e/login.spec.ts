import { test, expect } from "@playwright/test";

/**
 * E2E Smoke Tests — Phase 0
 *
 * These tests verify the foundation renders correctly.
 * Phase 1: Add authentication flow tests.
 * Phase 2: Add inventory, transfer, and audit flow tests.
 */

test.describe("Login Page", () => {
  test("renders SWASTHYA-SANKET branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Swasthya-Sanket");
  });

  test("has employee ID and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#employeeId")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("has a sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#login-btn")).toBeVisible();
    await expect(page.locator("#login-btn")).toBeEnabled();
  });

  test("shows role chips", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("ANM")).toBeVisible();
    await expect(page.getByText("MO")).toBeVisible();
  });
});

test.describe("Health API", () => {
  test("GET /api/health returns 200 with ok status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("swasthya-sanket");
  });
});

test.describe("Root redirect", () => {
  test("/ redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
