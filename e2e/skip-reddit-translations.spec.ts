import { expect, expectRuleset, setFeature, test } from './fixtures';

const post = 'https://www.reddit.com/r/test/comments/abc/a_post/';

test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/(www\.reddit\.com|other\.example\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Post</h1>' }),
  );
});

test('opens Reddit posts in their original language', async ({ page, serviceWorker }) => {
  await expectRuleset(serviceWorker, 'skip-reddit-translations', true);
  await page.goto(`${post}?tl=de`);
  expect(page.url()).toBe(post);
  await page.goto(`${post}?sort=new&tl=pt-br`);
  expect(page.url()).toBe(`${post}?sort=new`);

  // Other sites' "tl" stays.
  await page.goto('https://other.example.com/?tl=de');
  expect(page.url()).toBe('https://other.example.com/?tl=de');
});

test('switched off, keeps the translation', async ({
  context,
  page,
  extensionId,
  serviceWorker,
}) => {
  await setFeature(context, extensionId, 'Skip machine translated pages', false);
  await expectRuleset(serviceWorker, 'skip-reddit-translations', false);
  await page.goto(`${post}?tl=de`);
  expect(page.url()).toBe(`${post}?tl=de`);
});
