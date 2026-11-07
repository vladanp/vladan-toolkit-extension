import { keepOriginalAudio } from '@/features/youtube-original-language/page';

// Page world: switches YouTube's player to the original audio track while <html> has the attribute.
export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    keepOriginalAudio();
  },
});
