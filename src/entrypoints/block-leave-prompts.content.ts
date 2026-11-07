import { blockLeavePrompts } from '@/features/block-leave-prompts';
import { shareSwitchWithPage } from '@/lib/page-switch';

// Tells the page world script (block-leave-prompts-page) the switch, now and on every change.
export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  main(ctx) {
    ctx.onInvalidated(shareSwitchWithPage(blockLeavePrompts));
  },
});
