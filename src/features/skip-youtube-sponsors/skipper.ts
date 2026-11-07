import { watchPageVideoId } from '@/lib/youtube';
import { skipYoutubeSponsors } from '.';
import { fetchSegments, type Segment, segmentToSkip, skippedCategories } from './segments';

interface VideoState {
  videoId: string;
  segments: Segment[];
  /** Segments the user chose to watch (seeked into, or pressed Undo). */
  allowed: Set<Segment>;
  /** Where the user seeked to; also applied to segments that arrive later. */
  userSeeks: number[];
}

function allowSegmentsAt(state: VideoState, time: number) {
  for (const s of state.segments) if (time >= s.start && time < s.end) state.allowed.add(s);
}

/**
 * Skips SponsorBlock segments in the main YouTube player while it plays, showing a short notice with
 * Undo. Returns a function that stops it.
 */
export function startSkipping(): () => void {
  const cache = new Map<string, Promise<Segment[]>>();
  let state: VideoState | undefined;
  let ownSeekTo: number | undefined;
  let notice: HTMLElement | undefined;

  const segmentsFor = (videoId: string) => {
    let segments = cache.get(videoId);
    if (!segments) {
      segments = fetchSegments(videoId).catch((error) => {
        // The service is down or blocked: not the extension's error, so not on the errors page.
        console.debug('Vladan Toolkit: SponsorBlock lookup failed', error);
        cache.delete(videoId); // Try again next time the video is opened.
        return [];
      });
      cache.set(videoId, segments);
    }
    return segments;
  };

  // Only the main player (not hover previews); media events don't bubble, so listen in capture phase.
  const mainVideo = (target: EventTarget | null) =>
    target instanceof HTMLVideoElement && target.closest('#movie_player') ? target : undefined;

  /** State of the video on this watch page, looking up its segments when it's new. */
  const currentState = () => {
    const videoId = watchPageVideoId(location.href);
    if (!videoId) return undefined;
    if (state?.videoId !== videoId) {
      const fresh: VideoState = { videoId, segments: [], allowed: new Set(), userSeeks: [] };
      state = fresh;
      segmentsFor(videoId).then((segments) => {
        fresh.segments = segments;
        for (const time of fresh.userSeeks) allowSegmentsAt(fresh, time);
      });
    }
    return state;
  };

  const onTimeUpdate = (event: Event) => {
    const video = mainVideo(event.target);
    if (!video || video.closest('.ad-showing')) return; // Ads play in the same <video>.
    const current = currentState();
    if (!current) return;
    const segment = segmentToSkip(
      current.segments,
      video.currentTime,
      video.duration,
      current.allowed,
    );
    if (!segment) return;
    ownSeekTo = Number.isFinite(video.duration)
      ? Math.min(segment.end, video.duration)
      : segment.end;
    video.currentTime = ownSeekTo;
    showNotice(video, segment);
  };

  // `seeking` (not `seeked`): the browser fires `timeupdate` at the new position before `seeked`.
  const onSeeking = (event: Event) => {
    const video = mainVideo(event.target);
    if (!video || video.closest('.ad-showing')) return;
    if (ownSeekTo !== undefined && Math.abs(video.currentTime - ownSeekTo) < 1) {
      ownSeekTo = undefined;
      return;
    }
    const current = currentState();
    if (!current) return;
    // The user jumped here: let them watch a segment they landed in.
    current.userSeeks.push(video.currentTime);
    allowSegmentsAt(current, video.currentTime);
  };

  const showNotice = (video: HTMLVideoElement, segment: Segment) => {
    notice?.remove();
    const box = document.createElement('div');
    box.dataset.vladanToolkit = skipYoutubeSponsors.id;
    box.setAttribute('role', 'status');
    box.style.cssText =
      'position:absolute;left:12px;bottom:72px;z-index:70;display:flex;gap:12px;align-items:center;' +
      'padding:8px 12px;border-radius:8px;background:rgba(0,0,0,.8);color:#fff;' +
      'font:500 14px/1.4 Roboto,Arial,sans-serif;pointer-events:auto';
    box.append(`Skipped ${skippedCategories[segment.category]}`);

    const undo = document.createElement('button');
    undo.type = 'button';
    undo.textContent = 'Undo';
    undo.style.cssText =
      'all:unset;cursor:pointer;color:#3ea6ff;font:inherit;font-weight:700;padding:0 2px';
    undo.addEventListener('click', (event) => {
      event.stopPropagation(); // Don't let the player toggle play/pause.
      state?.allowed.add(segment);
      video.currentTime = segment.start;
      box.remove();
    });
    box.append(undo);

    (video.closest('#movie_player') ?? document.body).append(box);
    setTimeout(() => box.remove(), 5000);
    notice = box;
  };

  document.addEventListener('timeupdate', onTimeUpdate, true);
  document.addEventListener('seeking', onSeeking, true);
  return () => {
    document.removeEventListener('timeupdate', onTimeUpdate, true);
    document.removeEventListener('seeking', onSeeking, true);
    notice?.remove();
  };
}
