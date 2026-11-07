// Network level features: one static declarativeNetRequest ruleset each (ruleset id = feature id).
// wxt.config.ts imports this to generate `rules/<id>.json` and the manifest entries, so it may only
// import the rules modules (relative paths, no runtime `@/` or `#imports`).
import { trackingParamsRuleset } from './remove-tracking-params/rules';
import { ampRuleset } from './skip-amp-pages/rules';
import { redditTranslationsRuleset } from './skip-reddit-translations/rules';

export const rulesets = [trackingParamsRuleset, ampRuleset, redditTranslationsRuleset];
