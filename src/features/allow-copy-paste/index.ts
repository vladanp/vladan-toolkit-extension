import type { Feature } from '@/lib/features';

export const allowCopyPaste = {
  id: 'allow-copy-paste',
  name: 'Allow copy, paste and right-click',
  description:
    'Lets you select and copy text, paste into form fields and open the right-click menu on sites that block them. Editors and custom menus keep working.',
  group: 'All websites',
  enabledByDefault: true,
} satisfies Feature;
