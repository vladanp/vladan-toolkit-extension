// Imported by wxt.config.ts at build time: keep imports type only.
import type { Ruleset } from '@/lib/rulesets';

// Reddit serves a machine translation when the address has "tl=<language>" (Google links to those).
export const redditTranslationsRuleset: Ruleset = {
  id: 'skip-reddit-translations',
  rules: [
    {
      id: 1,
      action: {
        type: 'redirect',
        redirect: { transform: { queryTransform: { removeParams: ['tl'] } } },
      },
      condition: {
        urlFilter: '^tl=',
        isUrlFilterCaseSensitive: true,
        requestDomains: ['reddit.com'],
        resourceTypes: ['main_frame'],
      },
    },
  ],
};
