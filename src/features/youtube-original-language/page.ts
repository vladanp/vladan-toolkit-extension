// Runs in the page's own JavaScript world (no imports): YouTube's player API is only visible there.

/** Attribute on <html> present while the feature is on (set by the isolated world). */
export const originalAudioAttribute = 'data-vladan-toolkit-original-audio';

/** The bits of YouTube's player API (methods on the #movie_player element) this uses. */
export interface AudioTrack {
  getXtags?(): string;
}
interface Player extends HTMLElement {
  getAvailableAudioTracks?(): AudioTrack[];
  getAudioTrack?(): AudioTrack;
  setAudioTrack?(track: AudioTrack): void;
  getVideoData?(): { video_id?: string };
}

/** Whether YouTube tags the track as the original audio: base64 protobuf tags with "acont"="original". */
export function isOriginal(track: AudioTrack): boolean {
  try {
    return atob((track.getXtags?.() ?? '').replace(/-/g, '+').replace(/_/g, '/')).includes(
      'original',
    );
  } catch {
    return false;
  }
}

/**
 * Page world: when a video with several audio tracks loads (or the switch turns on), plays its
 * original track. Once per video, so a track the user picks afterwards stays.
 */
export function keepOriginalAudio(doc: Document = document) {
  let done: string | undefined;
  const apply = (player: Player | null) => {
    if (!player || !doc.documentElement.hasAttribute(originalAudioAttribute)) return;
    const video = player.getVideoData?.().video_id;
    const tracks = player.getAvailableAudioTracks?.() ?? [];
    if (!video || video === done || tracks.length < 2) return;
    done = video;
    const original = tracks.find(isOriginal);
    const current = player.getAudioTrack?.();
    if (original && current && !isOriginal(current)) player.setAudioTrack?.(original);
  };
  // Every video (also after in page navigation) loads into the same <video>. Media events don't bubble.
  doc.addEventListener(
    'loadedmetadata',
    (event) => {
      if (event.target instanceof HTMLVideoElement) apply(event.target.closest('#movie_player'));
    },
    true,
  );
  new MutationObserver(() => apply(doc.querySelector('#movie_player'))).observe(
    doc.documentElement,
    { attributeFilter: [originalAudioAttribute] },
  );
}
