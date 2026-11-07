import { describe, expect, it, vi } from 'vitest';
import { videoLookups, watchPageVideoId } from './youtube';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('videoLookups', () => {
  it('looks a video up once while open; a failure is retried only when it is opened again', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const lookUp = vi.fn(async (videoId: string) => {
      if (videoId === 'offline') throw new Error('Failed to fetch');
      return videoId.length;
    });
    const found = vi.fn();
    const check = videoLookups('test', lookUp, found);

    check('offline');
    await settle();
    check('offline'); // YouTube changes the page all the time: no new request each time.
    check('offline');
    await settle();
    expect(lookUp).toHaveBeenCalledTimes(1);
    expect(debug).toHaveBeenCalledTimes(1);

    check('abc');
    await settle();
    check('abc');
    expect(found).toHaveBeenCalledWith('abc', 3);

    check('offline'); // Opened again: tried again.
    check(undefined);
    expect(lookUp.mock.calls.map(([videoId]) => videoId)).toEqual(['offline', 'abc', 'offline']);
  });
});

describe('watchPageVideoId', () => {
  it('reads the id of watch pages only', () => {
    expect(watchPageVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1')).toBe('dQw4w9WgXcQ');
    expect(watchPageVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBeUndefined();
    expect(watchPageVideoId('https://www.youtube.com/watch?v=short')).toBeUndefined();
  });
});
