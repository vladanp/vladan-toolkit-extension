import { allowCopyPaste } from '@/features/allow-copy-paste';
import { defuseCopyBlockers } from '@/features/allow-copy-paste/page';
import { mainWorldSwitch } from '@/lib/main-world';

// Page world, before the page's own scripts: defuses copy, paste and right-click blockers.
export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    defuseCopyBlockers(window, mainWorldSwitch(allowCopyPaste.id).now);
  },
});
