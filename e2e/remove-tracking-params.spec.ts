import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, expectRuleset, setFeature, test } from './fixtures';

// A real local web server (network rules act on real requests), logging every page it is asked for.
let server: Server;
let origin: string;
const requested: string[] = [];

test.beforeAll(async () => {
  server = createServer((request, response) => {
    // Not the icon: Chrome asks for it on its own, at any moment.
    if (request.url !== '/favicon.ico') requested.push(request.url ?? '');
    response.setHeader('content-type', 'text/html');
    response.end('<a id="next" href="/next?page=2&utm_campaign=newsletter">next</a>');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
test.beforeEach(async ({ serviceWorker }) => {
  requested.length = 0;
  await expectRuleset(serviceWorker, 'remove-tracking-params', true);
});

test('strips tracking parameters before the page loads', async ({ page }) => {
  await page.goto(`${origin}/article?id=7&utm_source=news&fbclid=abc&utm_medium=social#comments`);
  expect(page.url()).toBe(`${origin}/article?id=7#comments`);
  expect(requested).toEqual(['/article?id=7']); // The tracking ids never reached the server.

  await page.locator('#next').click(); // Also for links clicked on a page.
  await page.waitForURL(`${origin}/next?page=2`);
});

test('leaves lookalike parameters and paths alone', async ({ page }) => {
  for (const path of [
    '/search?q=utm_source&xutm_source=1&utm_sourcex=2',
    '/search?UTM_SOURCE=upper-case-is-not-the-tag',
    '/campaigns/utm_source=docs/page',
    '/watch?si=only-tracking-on-youtube-and-spotify',
  ]) {
    await page.goto(origin + path);
    expect(page.url()).toBe(origin + path);
  }
});

test('the popup switch turns it off and on', async ({
  context,
  page,
  extensionId,
  serviceWorker,
}) => {
  await setFeature(context, extensionId, 'Remove tracking from links', false);
  await expectRuleset(serviceWorker, 'remove-tracking-params', false);
  await page.goto(`${origin}/article?utm_source=news`);
  expect(page.url()).toBe(`${origin}/article?utm_source=news`);

  await setFeature(context, extensionId, 'Remove tracking from links', true);
  await expectRuleset(serviceWorker, 'remove-tracking-params', true);
  await page.goto(`${origin}/article?utm_source=news`);
  expect(page.url()).toBe(`${origin}/article`);
});
