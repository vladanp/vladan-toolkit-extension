import type { Feature } from '@/lib/features';

export const blockLeavePrompts = {
  id: 'block-leave-prompts',
  name: 'Block "Leave site?" prompts',
  description:
    'Stops sites asking "Leave site? Changes you made may not be saved" when you haven\'t typed anything on the page. Pages you typed on still warn you.',
  group: 'Popups',
  enabledByDefault: true,
} satisfies Feature;
