import { skipLinkRedirects } from '@/features/skip-link-redirects';
import { startSkippingRedirects } from '@/features/skip-link-redirects/unwrap';
import { whileEnabled } from '@/lib/features';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  async main(ctx) {
    const stop = await whileEnabled(skipLinkRedirects, () => startSkippingRedirects());
    ctx.onInvalidated(stop);
  },
});
