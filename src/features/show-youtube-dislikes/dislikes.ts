import { injectStyle } from '@/lib/style';
import { videoLookups, watchPageVideoId } from '@/lib/youtube';
import { showYoutubeDislikes } from '.';
import css from './dislikes.css?inline';

// Return YouTube Dislike (https://returnyoutubedislike.com): archived counts from before YouTube hid
// them, extrapolated from its users' votes since.
const api = 'https://returnyoutubedislikeapi.com/votes?videoId=';

export async function fetchDislikes(videoId: string): Promise<number> {
  const response = await fetch(`${api}${encodeURIComponent(videoId)}`, { credentials: 'omit' });
  if (!response.ok) throw new Error(`Return YouTube Dislike responded ${response.status}`);
  const { dislikes } = (await response.json()) as { dislikes?: unknown };
  if (typeof dislikes !== 'number') throw new Error('Return YouTube Dislike sent no count');
  return dislikes;
}

const buttonSelector = 'ytd-watch-metadata dislike-button-view-model button';
const countAttribute = 'data-vladan-toolkit-dislikes';

/** Writes the watched video's dislike count into its dislike button. Returns a function that stops. */
export function startShowingDislikes(doc: Document = document): () => void {
  const removeStyle = injectStyle(css, showYoutubeDislikes.id, doc);
  const shown = new Map<string, string>(); // Video id → formatted count, once it has arrived.
  let stopped = false;

  const lookUp = videoLookups('dislike count', fetchDislikes, (videoId, dislikes) => {
    // Like YouTube's own counts: 1.2K, 12K, 521K, 19M.
    const format = new Intl.NumberFormat(doc.documentElement.lang || undefined, {
      notation: 'compact',
    });
    shown.set(videoId, format.format(dislikes));
    if (!stopped) render();
  });

  // YouTube rerenders the buttons and swaps videos without loading a new page: check on every change.
  const render = () => {
    const videoId = watchPageVideoId(doc.location.href);
    lookUp(videoId);
    const text = videoId && shown.get(videoId);
    for (const button of doc.querySelectorAll(buttonSelector)) {
      let count = button.querySelector(`[${countAttribute}]`);
      if (!text) {
        count?.remove(); // Never leave the previous video's count up.
        continue;
      }
      if (!count) {
        count = doc.createElement('span');
        count.setAttribute(countAttribute, '');
        button.append(count);
      }
      if (count.textContent !== text) count.textContent = text;
    }
  };

  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (!stopped) render();
    });
  });
  observer.observe(doc, { childList: true, subtree: true });
  render();

  return () => {
    stopped = true;
    observer.disconnect();
    removeStyle();
    for (const count of doc.querySelectorAll(`[${countAttribute}]`)) count.remove();
  };
}
