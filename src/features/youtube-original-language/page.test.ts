// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { type AudioTrack, isOriginal, keepOriginalAudio, originalAudioAttribute } from './page';

/** A track as YouTube tags it: base64url protobuf, e.g. acont=dubbed lang=de (no padding). */
const track = (acont: string, lang: string): AudioTrack => {
  const tags = `\n\u000f\n\u0005acont\u0012${String.fromCharCode(acont.length)}${acont}\n\n\n\u0004lang\u0012${String.fromCharCode(lang.length)}${lang}`;
  const xtags = btoa(tags).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { getXtags: () => xtags };
};

describe('isOriginal', () => {
  it("reads YouTube's track tags", () => {
    // Taken from a live YouTube page: the German dub of a video.
    expect(isOriginal({ getXtags: () => 'Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICZGU' })).toBe(false);
    expect(isOriginal(track('original', 'en-US'))).toBe(true);
    expect(isOriginal(track('dubbed-auto', 'de'))).toBe(false);
    expect(isOriginal({ getXtags: () => '' })).toBe(false);
    expect(isOriginal({})).toBe(false);
  });
});

describe('keepOriginalAudio', () => {
  function setup(videoId = 'abc') {
    const dub = track('dubbed', 'de');
    const original = track('original', 'en');
    const player = Object.assign(document.createElement('div'), {
      id: 'movie_player',
      current: dub,
      getVideoData: () => ({ video_id: videoId }),
      getAvailableAudioTracks: () => [dub, original],
      getAudioTrack() {
        return this.current;
      },
      setAudioTrack: vi.fn(function (this: { current: AudioTrack }, t: AudioTrack) {
        this.current = t;
      }),
    });
    const video = document.createElement('video');
    player.append(video);
    document.body.replaceChildren(player);
    return { player, video, dub, original };
  }
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('switches a dubbed video to its original audio, once, only while on', async () => {
    document.documentElement.removeAttribute(originalAudioAttribute);
    const { player, video, dub, original } = setup();
    keepOriginalAudio(document);

    video.dispatchEvent(new Event('loadedmetadata'));
    expect(player.setAudioTrack).not.toHaveBeenCalled(); // Off.

    document.documentElement.setAttribute(originalAudioAttribute, ''); // Switched on: applies now.
    await settle();
    expect(player.setAudioTrack).toHaveBeenCalledWith(original);

    player.current = dub; // The user picks the dub again: it stays.
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(player.setAudioTrack).toHaveBeenCalledTimes(1);
  });
});
