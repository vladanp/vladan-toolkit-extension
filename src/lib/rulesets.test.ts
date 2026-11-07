import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { type Feature, featureEnabled, pausedSites } from './features';
import { pausedSitesRuleId, syncPausedSites, syncRuleset } from './rulesets';

const feature: Feature = {
  id: 'test-rules',
  name: 'Test rules',
  description: 'For tests',
  group: 'All websites',
  enabledByDefault: true,
};

// The fake browser has no declarativeNetRequest; record what would be switched.
const updateEnabledRulesets = vi.fn(async (_options: object) => {});
const updateDynamicRules = vi.fn(async (_options: object) => {});
Object.assign(fakeBrowser, {
  declarativeNetRequest: { updateEnabledRulesets, updateDynamicRules },
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('syncRuleset', () => {
  it('enables the ruleset while the switch is on and follows it live', async () => {
    syncRuleset(feature);
    await settle();
    expect(updateEnabledRulesets).toHaveBeenLastCalledWith({ enableRulesetIds: ['test-rules'] });

    await featureEnabled(feature).setValue(false);
    await settle();
    expect(updateEnabledRulesets).toHaveBeenLastCalledWith({ disableRulesetIds: ['test-rules'] });

    await featureEnabled(feature).setValue(true);
    await settle();
    expect(updateEnabledRulesets).toHaveBeenLastCalledWith({ enableRulesetIds: ['test-rules'] });
  });

  it('starts disabled for features that are off by default', async () => {
    syncRuleset({ ...feature, enabledByDefault: false });
    await settle();
    expect(updateEnabledRulesets).toHaveBeenLastCalledWith({ disableRulesetIds: ['test-rules'] });
  });
});

describe('syncPausedSites', () => {
  it('lets requests to paused sites through, following the list live', async () => {
    syncPausedSites();
    await settle();
    expect(updateDynamicRules).toHaveBeenLastCalledWith({
      removeRuleIds: [pausedSitesRuleId],
      addRules: [],
    });

    await pausedSites.setValue(['news.example.com', 'shop.example.org']);
    await settle();
    expect(updateDynamicRules).toHaveBeenLastCalledWith({
      removeRuleIds: [pausedSitesRuleId],
      addRules: [
        {
          id: pausedSitesRuleId,
          priority: 100,
          action: { type: 'allow' },
          condition: {
            requestDomains: ['news.example.com', 'shop.example.org'],
            resourceTypes: ['main_frame', 'sub_frame'],
          },
        },
      ],
    });
  });
});
