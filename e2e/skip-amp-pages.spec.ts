import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, expectRuleset, servePage, setFeature, test } from './fixtures';

test.beforeEach(async ({ context }) => {
  await context.route('https://news.example.com/**', (route) =>
    route.fulfill(
      servePage(
        new URL(route.request().url()).pathname.endsWith('/amp')
          ? 'amp-page.html'
          : 'news-page.html',
      ),
    ),
  );
  // Only reached when the network rules don't redirect.
  await context.route(/^https:\/\/(www\.google\.com\/amp|[^/]+\.cdn\.ampproject\.org)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: 'Not redirected' }),
  );
});

const googleAmpLink = 'https://www.google.com/amp/s/news.example.com/story/amp';
const ampCacheLink = 'https://news-example-com.cdn.ampproject.org/c/s/news.example.com/story/amp';

test('opens the normal page for AMP links and AMP pages', async ({ page, serviceWorker }) => {
  await expectRuleset(serviceWorker, 'skip-amp-pages', true);
  for (const url of [googleAmpLink, ampCacheLink, 'https://news.example.com/story/amp']) {
    await page.goto(url);
    await page.waitForURL('https://news.example.com/story');
    await expect(page.getByRole('heading')).toHaveText('Story');
  }

  // A normal page stays, even though its canonical link is another page.
  await page.goto('https://news.example.com/other');
  await page.waitForTimeout(1000); // Give a (wrong) redirect the chance to happen.
  expect(page.url()).toBe('https://news.example.com/other');
});

test('stays on the AMP page when the site sends the browser back to it', async ({ page }) => {
  // A real local server: Playwright sometimes misses the request a routed redirect leads to.
  const ampPage = await readFile(servePage('amp-page.html').path);
  let normalPageVisits = 0;
  const server = createServer((request, response) => {
    if (request.url === '/story') {
      // Like a site redirecting phones to its AMP pages.
      normalPageVisits++;
      response.writeHead(302, { location: '/story/amp' }).end();
    } else {
      response.writeHead(200, { 'content-type': 'text/html' }).end(ampPage);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const ampUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/story/amp`;

  try {
    await page.goto(ampUrl);
    await expect.poll(() => normalPageVisits).toBe(1);
    await page.waitForTimeout(1000); // A loop would keep going.
    expect(normalPageVisits).toBe(1);
    expect(page.url()).toBe(ampUrl);
  } finally {
    server.close();
  }
});

test('switched off, leaves AMP links and pages alone', async ({
  context,
  page,
  extensionId,
  serviceWorker,
}) => {
  await setFeature(context, extensionId, 'Open original pages instead of AMP', false);
  await expectRuleset(serviceWorker, 'skip-amp-pages', false);

  await page.goto(googleAmpLink);
  await expect(page.getByText('Not redirected')).toBeVisible();
  await page.goto('https://news.example.com/story/amp');
  await page.waitForTimeout(1000);
  expect(page.url()).toBe('https://news.example.com/story/amp');
});
