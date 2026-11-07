import type { Feature } from '@/lib/features';

export const skipLinkRedirects = {
  id: 'skip-link-redirects',
  name: 'Skip link redirects',
  description:
    'Sends links that Google, YouTube, Facebook, Instagram, Reddit, LinkedIn, Steam and others route through their own redirect or "You are leaving" page straight to the real page.',
  group: 'All websites',
  enabledByDefault: true,
} satisfies Feature;
