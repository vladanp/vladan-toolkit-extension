import { browser } from 'wxt/browser';
import { type Feature, featureEnabled, pausedSites } from './features';

/**
 * A declarativeNetRequest rule (the subset this extension uses). Chrome applies these itself, before
 * pages load, without running any extension code on the page.
 * https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#type-Rule
 */
export interface Rule {
  id: number;
  priority?: number;
  action:
    | {
        type: 'redirect';
        redirect: {
          transform?: { queryTransform?: { removeParams?: string[] } };
          regexSubstitution?: string;
        };
      }
    | { type: 'allow' };
  condition: {
    urlFilter?: string;
    regexFilter?: string;
    isUrlFilterCaseSensitive?: boolean;
    requestDomains?: string[];
    resourceTypes: ('main_frame' | 'sub_frame')[];
  };
}

/** A static ruleset, shipped as `rules/<id>.json`; `id` is the id of the feature that switches it. */
export interface Ruleset {
  id: string;
  rules: Rule[];
}

/**
 * Background: keeps the feature's ruleset enabled exactly while its switch is on (Chrome resets
 * static rulesets to "disabled" on every extension update, so this runs at each service worker start).
 */
export function syncRuleset(feature: Feature) {
  const setting = featureEnabled(feature);
  let queue = Promise.resolve();
  const sync = () => {
    // Serialized and rereading the setting, so a late result can't overwrite a newer one.
    queue = queue
      .then(async () => {
        const on = await setting.getValue();
        await browser.declarativeNetRequest.updateEnabledRulesets(
          on ? { enableRulesetIds: [feature.id] } : { disableRulesetIds: [feature.id] },
        );
      })
      .catch((error) => console.error(`Couldn't switch the ${feature.id} rules`, error));
  };
  setting.watch(sync);
  sync();
}

/** Id of the dynamic rule that exempts paused sites (dynamic rules have their own id space). */
export const pausedSitesRuleId = 1;

/** The rule letting requests to paused sites through untouched: an allow rule outranks the redirects. */
export function pausedSitesRule(sites: string[]): Rule[] {
  if (sites.length === 0) return [];
  return [
    {
      id: pausedSitesRuleId,
      priority: 100,
      action: { type: 'allow' },
      condition: { requestDomains: sites, resourceTypes: ['main_frame', 'sub_frame'] },
    },
  ];
}

/** Background: keeps the network rules away from the sites the user paused (now and on changes). */
export function syncPausedSites() {
  let queue = Promise.resolve();
  const sync = () => {
    queue = queue
      .then(async () => {
        await browser.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [pausedSitesRuleId],
          addRules: pausedSitesRule(await pausedSites.getValue()),
        });
      })
      .catch((error) => console.error("Couldn't exempt the paused sites", error));
  };
  pausedSites.watch(sync);
  sync();
}
