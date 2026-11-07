import { youtubeOriginalLanguage } from '@/features/youtube-original-language';
import { originalAudioAttribute } from '@/features/youtube-original-language/page';
import { startShowingOriginalTitles } from '@/features/youtube-original-language/title';
import { whileEnabled } from '@/lib/features';

// Shows original titles, and tells the page world script (youtube-original-language-page) to pick
// the original audio, while the switch is on.
export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  runAt: 'document_start',
  async main(ctx) {
    const html = document.documentElement;
    const stop = await whileEnabled(youtubeOriginalLanguage, () => {
      html.setAttribute(originalAudioAttribute, '');
      const stopTitles = startShowingOriginalTitles();
      return () => {
        html.removeAttribute(originalAudioAttribute);
        stopTitles();
      };
    });
    ctx.onInvalidated(stop);
  },
});
