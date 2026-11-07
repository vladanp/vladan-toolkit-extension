// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { startSkippingRedirects, unwrapLink } from './unwrap';

describe('unwrapLink', () => {
  it('finds the real address behind known redirect links', () => {
    const cases: [string, string][] = [
      [
        'https://www.google.com/url?q=https://example.com/a?b%3D1%26c%3D2&sa=D&source=gmail',
        'https://example.com/a?b=1&c=2',
      ],
      ['https://www.google.de/url?url=https%3A%2F%2Fexample.org%2F&rct=j', 'https://example.org/'],
      [
        'https://www.youtube.com/redirect?event=video_description&q=https%3A%2F%2Fshop.example%2Fx',
        'https://shop.example/x',
      ],
      [
        'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F%3Fp%3D1&h=AT0',
        'https://example.com/?p=1',
      ],
      ['https://l.instagram.com/?u=https%3A%2F%2Fexample.com%2F&e=AT1', 'https://example.com/'],
      [
        'https://out.reddit.com/t3_abc?url=https%3A%2F%2Fexample.com%2Fpost&token=x',
        'https://example.com/post',
      ],
      [
        'https://www.linkedin.com/safety/go?url=https%3A%2F%2Fexample.com&trk=x',
        'https://example.com/',
      ],
      [
        'https://steamcommunity.com/linkfilter/?u=https%3A%2F%2Fexample.com',
        'https://example.com/',
      ],
      [
        'https://deref-gmx.net/mail/client/abc/dereferrer/?redirectUrl=https%3A%2F%2Fexample.com',
        'https://example.com/',
      ],
    ];
    for (const [wrapped, real] of cases) expect(unwrapLink(wrapped), wrapped).toBe(real);
  });

  it('leaves everything else alone', () => {
    for (const href of [
      'https://www.google.com/search?q=https://example.com',
      'https://www.google.com/url?q=javascript:alert(1)', // Only http(s) targets.
      'https://www.google.com/url?q=not%20a%20url',
      'https://www.google.evil.example/url?q=https://example.com', // Not a Google host.
      'https://www.youtube.com/watch?v=abc&q=https://example.com',
      'https://example.com/l.php?u=https://example.org',
      'mailto:someone@example.com',
      'not a url',
    ]) {
      expect(unwrapLink(href), href).toBeUndefined();
    }
  });
});

describe('startSkippingRedirects', () => {
  it('rewrites a wrapped link when clicked, and stops when switched off', () => {
    document.body.innerHTML = `
      <a id="wrapped" href="https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F">x</a>
      <a id="plain" href="https://example.org/">y</a>`;
    const stop = startSkippingRedirects(window);
    const wrapped = document.querySelector<HTMLAnchorElement>('#wrapped');
    const plain = document.querySelector<HTMLAnchorElement>('#plain');
    const click = (link: HTMLAnchorElement | null) =>
      link?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true }));

    click(wrapped);
    click(plain);
    expect(wrapped?.href).toBe('https://example.com/');
    expect(plain?.href).toBe('https://example.org/');

    stop();
    if (wrapped) wrapped.href = 'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F';
    click(wrapped);
    expect(wrapped?.href).toContain('l.facebook.com');
  });
});
