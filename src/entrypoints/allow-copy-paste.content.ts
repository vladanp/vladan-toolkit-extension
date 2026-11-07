import { allowCopyPaste } from '@/features/allow-copy-paste';
import css from '@/features/allow-copy-paste/selectable.css?inline';
import { whileEnabled } from '@/lib/features';
import { shareSwitchWithPage } from '@/lib/page-switch';
import { injectStyle } from '@/lib/style';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  async main(ctx) {
    ctx.onInvalidated(shareSwitchWithPage(allowCopyPaste));
    const stop = await whileEnabled(allowCopyPaste, () => injectStyle(css, allowCopyPaste.id));
    ctx.onInvalidated(stop);
  },
});
