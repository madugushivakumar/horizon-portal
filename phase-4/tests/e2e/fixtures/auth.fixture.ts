import { test as base, Page } from "@playwright/test";
import {
  getAdminCredentials,
  getEmployeeCredentials,
  getManagerCredentials,
  getHRCredentials,
  AccountCredentials,
} from "../helpers/authentication";
import { loginAs } from "../helpers/test-helpers";

/**
 * Horizon Portal — Authentication Fixture
 * tests/e2e/fixtures/auth.fixture.ts
 *
 * Provides pre-authenticated test fixtures for each core organizational role:
 * - employeePage: Authenticated as Sophie Chen (EMP-0188)
 * - managerPage: Authenticated as Marcus Brody (EMP-0547)
 * - adminPage: Authenticated as Alexander Wright (EMP-0099)
 * - hrPage: Authenticated as Eleanor Vance (EMP-0011)
 *
 * All credentials are resolved securely through environment variables first,
 * with strictly no hardcoded passwords in test source.
 */

type AuthFixtures = {
  employeeCredentials: AccountCredentials;
  managerCredentials: AccountCredentials;
  adminCredentials: AccountCredentials;
  hrCredentials: AccountCredentials;
  authenticatedEmployeePage: Page;
  authenticatedManagerPage: Page;
  authenticatedAdminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  employeeCredentials: async ({}, use) => {
    await use(getEmployeeCredentials());
  },

  managerCredentials: async ({}, use) => {
    await use(getManagerCredentials());
  },

  adminCredentials: async ({}, use) => {
    await use(getAdminCredentials());
  },

  hrCredentials: async ({}, use) => {
    await use(getHRCredentials());
  },

  authenticatedEmployeePage: async ({ page, employeeCredentials }, use) => {
    await loginAs(page, employeeCredentials);
    await use(page);
  },

  authenticatedManagerPage: async ({ page, managerCredentials }, use) => {
    await loginAs(page, managerCredentials);
    await use(page);
  },

  authenticatedAdminPage: async ({ page, adminCredentials }, use) => {
    await loginAs(page, adminCredentials);
    await use(page);
  },
});

export { expect } from "@playwright/test";
