/**
 * Looks up something per video, once while it's open: a failed lookup is tried again only when the
 * video is opened again, not on every page change (constant on YouTube). Failures (the service is
 * down, rate limited or blocked) are logged at debug level: not the extension's errors. Returns the
 * function to call with the open video's id on every check.
 */
export function videoLookups<T>(
  what: string,
  lookUp: (videoId: string) => Promise<T>,
  found: (videoId: string, value: T) => void,
) {
  const requested = new Set<string>();
  const failed = new Set<string>();
  let open: string | undefined;
  return (videoId: string | undefined) => {
    if (videoId !== open) {
      open = videoId;
      for (const id of failed) requested.delete(id);
      failed.clear();
    }
    if (!videoId || requested.has(videoId)) return;
    requested.add(videoId);
    lookUp(videoId).then(
      (value) => found(videoId, value),
      (error) => {
        console.debug(`Vladan Toolkit: ${what} lookup failed`, error);
        failed.add(videoId);
      },
    );
  };
}

/** The video id of a watch page URL (youtube.com/watch?v=…), if it is one. */
export function watchPageVideoId(url: string): string | undefined {
  const { pathname, searchParams } = new URL(url);
  const id = searchParams.get('v');
  return pathname === '/watch' && id && /^[\w-]{11}$/.test(id) ? id : undefined;
}
