import { injectStyle } from '@/lib/style';
import { watchPageVideoId } from '@/lib/youtube';
import { youtubeOriginalLanguage } from '.';
import css from './title.css?inline';

/** The title as uploaded, from YouTube's own oEmbed endpoint (the page shows a translation). */
export async function fetchOriginalTitle(videoId: string): Promise<string> {
  const page = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(page)}`,
    { credentials: 'omit' },
  );
  if (!response.ok) throw new Error(`YouTube oEmbed responded ${response.status}`);
  const { title } = (await response.json()) as { title?: unknown };
  if (typeof title !== 'string' || !title) throw new Error('YouTube oEmbed sent no title');
  return title;
}

const titleSelector = 'ytd-watch-metadata h1';
const titleAttribute = 'data-vladan-toolkit-original-title';

/** Shows the watched video's original title in place of YouTube's translation. Returns a function that stops. */
export function startShowingOriginalTitles(doc: Document = document): () => void {
  const removeStyle = injectStyle(css, youtubeOriginalLanguage.id, doc);
  const requested = new Set<string>();
  const titles = new Map<string, string>(); // Video id → original title, once it has arrived.
  let stopped = false;

  const lookUp = (videoId: string) => {
    if (requested.has(videoId)) return;
    requested.add(videoId);
    fetchOriginalTitle(videoId).then(
      (title) => {
        titles.set(videoId, title);
        if (!stopped) render();
      },
      (error) => {
        console.warn('Vladan Toolkit: original title lookup failed', error);
        requested.delete(videoId); // Try again next time the video is opened.
      },
    );
  };

  // YouTube rerenders the title and swaps videos without loading a new page: check on every change.
  const render = () => {
    const videoId = watchPageVideoId(doc.location.href);
    if (videoId) lookUp(videoId);
    const title = videoId && titles.get(videoId);
    for (const heading of doc.querySelectorAll(titleSelector)) {
      let original = heading.querySelector(`:scope > [${titleAttribute}]`);
      if (!title) {
        original?.remove(); // Never leave the previous video's title up.
        continue;
      }
      if (!original) {
        original = doc.createElement('span');
        original.setAttribute(titleAttribute, '');
        heading.append(original);
      }
      if (original.textContent !== title) original.textContent = title;
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
    for (const original of doc.querySelectorAll(`[${titleAttribute}]`)) original.remove();
    removeStyle();
  };
}
