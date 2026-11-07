import type { Page } from '@playwright/test';
import { expect, servePage, setFeature, test } from './fixtures';

const site = 'https://recipes.example.com/';

test.beforeEach(async ({ context, page }) => {
  await context.route(`${site}**`, (route) => route.fulfill(servePage('copy-blockers.html')));
  await page.goto(site);
  await page.waitForTimeout(300); // The page world script learns the switch asynchronously.
});

/** What the page made of the user's actions: one "<event> <element id>: allowed|blocked" each. */
async function verdicts(page: Page, act: () => Promise<void>) {
  await page.evaluate(() => {
    (window as unknown as { verdicts: string[] }).verdicts = [];
  });
  await act();
  return page.evaluate(() => (window as unknown as { verdicts: string[] }).verdicts);
}

const userActions = (page: Page) => async () => {
  await page.locator('#text').click({ button: 'right' });
  await page.keyboard.press('Escape');
  await page.locator('#text').click({ clickCount: 3 }); // Selects the paragraph.
  await page.keyboard.press('Control+C');
  await page.locator('#confirm-email').click();
  await page.keyboard.press('Control+V');
  await page.locator('#iban').click();
  await page.keyboard.press('Control+V');
};

test('lets you right-click, select, copy and paste where the site blocks it', async ({ page }) => {
  const seen = await verdicts(page, userActions(page));
  for (const verdict of [
    'contextmenu text: allowed',
    'selectstart text: allowed',
    'copy text: allowed',
    'paste confirm-email: allowed',
    'paste iban: allowed',
  ]) {
    expect(seen).toContain(verdict);
  }
  expect(seen.join()).not.toContain('blocked');
  const userSelect = await page.locator('#text').evaluate((p) => getComputedStyle(p).userSelect);
  expect(userSelect).toBe('text');
});

test("keeps an app's own right-click menu and an editor's own paste", async ({ page }) => {
  const seen = await verdicts(page, async () => {
    await page.locator('#app-menu').click({ button: 'right' });
    await page.keyboard.press('Escape');
    await page.locator('#editor').click();
    await page.keyboard.press('Control+V');
  });
  expect(seen).toContain('contextmenu app-menu: blocked');
  expect(seen).toContain('paste editor: blocked');
});

test('switched off, the site blocks again', async ({ context, page, extensionId }) => {
  await setFeature(context, extensionId, 'Allow copy, paste and right-click', false);
  const seen = await verdicts(page, userActions(page));
  // (Nothing gets selected, so the copy comes from the page itself.)
  for (const verdict of [
    'contextmenu text: blocked',
    'copy : blocked',
    'paste confirm-email: blocked',
    'paste iban: blocked',
  ]) {
    expect(seen).toContain(verdict);
  }
  const userSelect = await page.locator('#text').evaluate((p) => getComputedStyle(p).userSelect);
  expect(userSelect).toBe('none');
});
