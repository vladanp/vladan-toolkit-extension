import { features } from '@/features/registry';
import { rejectCookieBanners } from '@/features/reject-cookie-banners';
import { answerCookieBannerRequest } from '@/features/reject-cookie-banners/background';
import { isCookieBannerRequest } from '@/features/reject-cookie-banners/protocol';
import { rulesets } from '@/features/rulesets';
import { featureEnabled } from '@/lib/features';
import { syncPausedSites, syncRuleset } from '@/lib/rulesets';

export default defineBackground(() => {
  // Network level features: Chrome applies their rules while their switch is on, except on paused sites.
  for (const { id } of rulesets) {
    const feature = features.find((f) => f.id === id);
    if (feature) syncRuleset(feature);
  }
  syncPausedSites();

  const cookieBannersOn = featureEnabled(rejectCookieBanners);
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCookieBannerRequest(request)) return;
    cookieBannersOn
      .getValue()
      .then((on) => (on ? answerCookieBannerRequest(request, sender) : null))
      .then(sendResponse, () => sendResponse(null));
    return true; // Responds asynchronously.
  });
});
