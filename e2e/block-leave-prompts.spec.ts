import type { BrowserContext } from '@playwright/test';
import { expect, servePage, setFeature, test } from './fixtures';

const site = 'https://blog.example.com/';

test.beforeEach(async ({ context }) => {
  await context.route(`${site}**`, (route) => route.fulfill(servePage('leave-prompts.html')));
});

/** Opens the page, lets `act` interact with it, closes the tab: returns the dialogs Chrome showed. */
async function closeDialogs(
  context: BrowserContext,
  url: string,
  act: (page: import('@playwright/test').Page) => Promise<void> = async () => {},
) {
  const page = await context.newPage();
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.type());
    void dialog.accept();
  });
  await page.goto(url);
  await page.waitForTimeout(300); // The page world script learns the switch asynchronously.
  await page.getByRole('heading').click(); // Chrome only asks once the user interacted.
  await act(page);
  const closed = page.waitForEvent('close');
  await page.close({ runBeforeUnload: true });
  await closed;
  return dialogs;
}

test('closing a page you only clicked on asks nothing', async ({ context }) => {
  expect(await closeDialogs(context, site)).toEqual([]);
  expect(await closeDialogs(context, `${site}?property`)).toEqual([]);
});

test('a page you typed on still warns you', async ({ context }) => {
  const type = (page: import('@playwright/test').Page) =>
    page.getByRole('textbox', { name: 'Note' }).pressSequentially('draft');
  expect(await closeDialogs(context, site, type)).toEqual(['beforeunload']);
  expect(await closeDialogs(context, `${site}?property`, type)).toEqual(['beforeunload']);
});

test('switched off, the page asks again', async ({ context, extensionId }) => {
  await setFeature(context, extensionId, 'Block "Leave site?" prompts', false);
  expect(await closeDialogs(context, site)).toEqual(['beforeunload']);
  expect(await closeDialogs(context, `${site}?property`)).toEqual(['beforeunload']);
});
