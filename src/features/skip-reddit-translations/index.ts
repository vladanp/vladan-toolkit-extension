import type { Feature } from '@/lib/features';

export const skipRedditTranslations = {
  id: 'skip-reddit-translations',
  name: 'Skip machine translated pages',
  description:
    'Opens Reddit posts in their original language when a link (often from Google) asks for Reddit\'s machine translation ("?tl=…").',
  group: 'Reddit',
  enabledByDefault: true,
} satisfies Feature;
