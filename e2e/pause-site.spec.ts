import type { Worker } from '@playwright/test';
import { expect, servePage, test } from './fixtures';

const site = 'https://support.example.com/';

test.beforeEach(async ({ context }) => {
  await context.route(`${site}**`, (route) => route.fulfill(servePage('chat-widgets.html')));
});

/** Waits until Chrome has (or no longer has) the rule exempting paused sites from network rules. */
async function expectExempt(serviceWorker: Worker, hosts: string[]) {
  type Globals = {
    chrome: {
      declarativeNetRequest: {
        getDynamicRules(): Promise<{ condition: { requestDomains?: string[] } }[]>;
      };
    };
  };
  await expect
    .poll(async () => {
      const rules = await serviceWorker.evaluate(() =>
        (globalThis as unknown as Globals).chrome.declarativeNetRequest.getDynamicRules(),
      );
      return rules.flatMap((rule) => rule.condition.requestDomains ?? []);
    })
    .toEqual(hosts);
}

test('the popup pauses every feature on the current site, live, and resumes them', async ({
  context,
  page,
  extensionId,
  serviceWorker,
}) => {
  await page.goto(site);
  await expect(page.locator('#intercom')).toBeHidden();

  // The popup acts on the active tab: open it in the background, the site's tab in front.
  const popup = await context.newPage();
  await page.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('button', { name: 'Pause on this site' }).click();
  await expect(popup.getByText('Paused on support.example.com')).toBeVisible();

  await expect(page.locator('#intercom')).toBeVisible(); // Content scripts, live.
  await expectExempt(serviceWorker, ['support.example.com']); // Network rules.
  await page.goto(`${site}?utm_source=news`);
  expect(page.url()).toBe(`${site}?utm_source=news`);

  await popup.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('#intercom')).toBeHidden();
  await expectExempt(serviceWorker, []);
  await page.goto(`${site}?utm_source=news`);
  expect(page.url()).toBe(site);
});

test('other sites stay on', async ({ page, serviceWorker }) => {
  await serviceWorker.evaluate(() =>
    (
      globalThis as unknown as { chrome: { storage: { sync: { set(v: object): Promise<void> } } } }
    ).chrome.storage.sync.set({ pausedSites: ['other.example.com'] }),
  );
  await expectExempt(serviceWorker, ['other.example.com']);
  await page.goto(site);
  await expect(page.locator('#intercom')).toBeHidden();
});
