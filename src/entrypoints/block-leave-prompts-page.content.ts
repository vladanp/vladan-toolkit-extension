import { blockLeavePrompts } from '@/features/block-leave-prompts';
import { defuseLeavePrompts } from '@/features/block-leave-prompts/page';
import { mainWorldSwitch } from '@/lib/main-world';

// Page world, before the page's own scripts: defuses beforeunload handlers.
export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    defuseLeavePrompts(window, mainWorldSwitch(blockLeavePrompts.id).now);
  },
});
