import { test, expect } from "../fixtures/auth.fixture";
import {
  createIsolatedTask,
  cleanupTestData,
  disconnectPrisma,
} from "../fixtures/test-data.fixture";

/**
 * Horizon Portal — Journey 5: Kanban Task Board Card Movement E2E Tests
 * tests/e2e/tasks/move-task-card.spec.ts
 *
 * Verifies:
 * 1. Independent data provisioning: creates a dedicated test task in "To Do" status.
 * 2. Interactive drag-and-drop: moves card from "To Do" column to "In Progress" column.
 * 3. Optimistic UI update and API persistence via PATCH /api/v1/tasks/[id].
 * 4. Page reload persistence: confirms task retains updated status across page refresh.
 * 5. Strict cleanup of test records.
 */

test.describe("Journey 5: Interactive Kanban Task Board Card Movement", () => {
  let isolatedTask: Awaited<ReturnType<typeof createIsolatedTask>>;

  test.beforeEach(async () => {
    // Seed an independent test task in "To Do" status
    isolatedTask = await createIsolatedTask({
      status: "To Do",
      priority: "P2",
      taskType: "Feature",
      storyPoints: 3,
    });
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test("5.1 Move task card from 'To Do' to 'In Progress' with optimistic update and persistence", async ({
    authenticatedEmployeePage: page,
  }) => {
    // Navigate to /task-board
    await page.goto("/task-board");
    await page.waitForLoadState("domcontentloaded");

    // Verify Kanban board headers
    await expect(page.locator("h1")).toContainText(/Team Task Board/i);

    // Columns
    const todoColumn = page.locator('section[aria-label*="To Do column"]');
    const inProgressColumn = page.locator('section[aria-label*="In Progress column"]');

    await expect(todoColumn).toBeVisible({ timeout: 12000 });
    await expect(inProgressColumn).toBeVisible({ timeout: 12000 });

    // Locate the specific test card
    const taskCard = page.locator(`article:has-text("${isolatedTask.id}")`);
    await expect(taskCard).toBeVisible({ timeout: 10000 });

    // Assert it starts in the To Do column
    await expect(todoColumn.locator(`article:has-text("${isolatedTask.id}")`)).toBeVisible();

    // Get bounding box of target column
    const targetBox = await inProgressColumn.boundingBox();
    expect(targetBox).not.toBeNull();

    // Perform drag-and-drop movement to In Progress column
    // Listen for PATCH API response
    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/tasks/${encodeURIComponent(isolatedTask.id)}`) &&
        res.request().method() === "PATCH" &&
        res.status() === 200,
      { timeout: 15000 }
    );

    // Simulate drag via mouse actions with steps to activate dnd-kit pointer sensor
    const cardBox = await taskCard.boundingBox();
    expect(cardBox).not.toBeNull();

    if (cardBox && targetBox) {
      const startX = cardBox.x + cardBox.width / 2;
      const startY = cardBox.y + cardBox.height / 2;
      const endX = targetBox.x + targetBox.width / 2;
      const endY = targetBox.y + 120; // Drop near top of column cards

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Move in increments to exceed activation distance (> 5px)
      await page.mouse.move(startX + 10, startY + 10, { steps: 5 });
      await page.mouse.move(endX, endY, { steps: 20 });
      await page.mouse.up();
    }

    // Wait for the PATCH API response to complete
    const patchResponse = await patchPromise;
    expect(patchResponse.status()).toBe(200);

    // Verify optimistic UI update: card now resides in In Progress column
    await expect(
      inProgressColumn.locator(`article:has-text("${isolatedTask.id}")`)
    ).toBeVisible({ timeout: 8000 });

    // Verify persistence across page refresh
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Wait for tasks to load
    await expect(inProgressColumn).toBeVisible({ timeout: 12000 });

    // Assert that the card is still in the "In Progress" column after full reload
    await expect(
      inProgressColumn.locator(`article:has-text("${isolatedTask.id}")`)
    ).toBeVisible({ timeout: 10000 });

    // Assert it is no longer in the "To Do" column
    await expect(
      todoColumn.locator(`article:has-text("${isolatedTask.id}")`)
    ).not.toBeVisible();
  });
});
