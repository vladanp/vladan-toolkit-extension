import { expect, servePage, setFeature, test } from './fixtures';

const redirectPages: string[] = [];

test.beforeEach(async ({ context }) => {
  redirectPages.length = 0;
  await context.route('https://forum.example.com/**', (route) =>
    route.fulfill(servePage('redirect-links.html')),
  );
  await context.route('https://example.org/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Real page</h1>' }),
  );
  // The redirect pages: only reached when the extension doesn't skip them.
  await context.route(/^https:\/\/(l\.facebook\.com|www\.google\.com)\//, (route) => {
    redirectPages.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<h1>You are leaving</h1>' });
  });
});

test('a clicked link goes straight to the real page, past the redirect page', async ({ page }) => {
  await page.goto('https://forum.example.com/');
  await page.locator('#facebook').click();
  await page.waitForURL('https://example.org/from-facebook?x=1');
  expect(redirectPages).toEqual([]);

  await page.goto('https://forum.example.com/');
  await page.locator('#plain').click();
  await page.waitForURL('https://example.org/plain');
});

test('opening a redirect page (e.g. from an email) goes on to the real page', async ({ page }) => {
  await page.goto('https://www.google.com/url?q=https://example.org/from-mail&source=gmail');
  await page.waitForURL('https://example.org/from-mail');
  await expect(page.getByRole('heading')).toHaveText('Real page');
});

test('switched off, links go through the redirect page', async ({ context, page, extensionId }) => {
  await setFeature(context, extensionId, 'Skip link redirects', false);
  await page.goto('https://forum.example.com/');
  await page.locator('#facebook').click();
  await page.waitForURL(/^https:\/\/l\.facebook\.com\//);
  expect(redirectPages).toHaveLength(1);
});
