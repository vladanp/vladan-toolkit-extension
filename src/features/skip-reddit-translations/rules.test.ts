import { describe, expect, it } from 'vitest';
import { redditTranslationsRuleset } from './rules';

describe('Reddit translation rule', () => {
  it('removes only the "tl" parameter, only on Reddit pages opened in a tab', () => {
    expect(redditTranslationsRuleset.rules).toMatchObject([
      {
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
    ]);
  });
});
