import type { Page } from '@playwright/test';
import { expect, serveYoutubeWatchPage, setFeature, test } from './fixtures';

const originalTitle = '$456,000 Squid Game In Real Life!';
const translatedTitle = '456.000$ Squid Game Im Echten Leben!';

test.beforeEach(async ({ context }) => {
  await serveYoutubeWatchPage(context);
  // YouTube's oEmbed endpoint: the title as uploaded.
  await context.route(/^https:\/\/www\.youtube\.com\/oembed\?/, (route) =>
    route.fulfill({ json: { title: originalTitle } }),
  );
});

async function openVideo(page: Page) {
  await page.goto('https://www.youtube.com/watch?v=0e3GPea1Tyg');
  await page
    .locator('#movie_player video')
    .evaluate(
      (video: HTMLVideoElement) =>
        video.readyState >= 1 ||
        new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true })),
    );
}

const audioCalls = (page: Page) =>
  page.evaluate(() => (window as { audioCalls?: string[] }).audioCalls ?? []);
const title = (page: Page) => page.getByRole('heading', { level: 1 });

test('plays the original audio and shows the original title', async ({ page }) => {
  await openVideo(page);
  await expect.poll(() => audioCalls(page)).toEqual(['English (original)']);
  await expect(title(page)).toHaveText(originalTitle, { useInnerText: true });
});

test('switched off live, shows YouTube’s title again; off, leaves the audio alone', async ({
  context,
  page,
  extensionId,
}) => {
  await openVideo(page);
  await expect(title(page)).toHaveText(originalTitle, { useInnerText: true });

  await setFeature(context, extensionId, 'Original audio and title', false);
  await expect(title(page)).toHaveText(translatedTitle, { useInnerText: true });

  await openVideo(page);
  await page.waitForTimeout(500); // The extension's script reads its settings asynchronously.
  expect(await audioCalls(page)).toEqual([]);
  await expect(title(page)).toHaveText(translatedTitle, { useInnerText: true });
});
