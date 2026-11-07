/** Redirect pages that carry the real address in a query parameter. */
const wrappers: { host: RegExp; path: RegExp; params: string[] }[] = [
  // Google search, Gmail, Docs: google.com/url?q=… (also google.de, google.co.uk, …)
  {
    host: /^www\.google\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/,
    path: /^\/url$/,
    params: ['q', 'url'],
  },
  { host: /^www\.youtube\.com$/, path: /^\/redirect$/, params: ['q'] },
  { host: /^(?:l|lm)\.facebook\.com$/, path: /^\/l\.php$/, params: ['u'] },
  { host: /^l\.messenger\.com$/, path: /^\/l\.php$/, params: ['u'] },
  { host: /^l\.instagram\.com$/, path: /^\/$/, params: ['u'] },
  { host: /^l\.threads\.(?:net|com)$/, path: /^\/$/, params: ['u'] },
  { host: /^out\.reddit\.com$/, path: /^\//, params: ['url'] },
  { host: /^www\.linkedin\.com$/, path: /^\/safety\/go\/?$/, params: ['url'] },
  { host: /^steamcommunity\.com$/, path: /^\/linkfilter\/?$/, params: ['u', 'url'] },
  { host: /^slack-redir\.net$/, path: /^\/link$/, params: ['url'] },
  { host: /^t\.umblr\.com$/, path: /^\/redirect$/, params: ['z'] },
  { host: /^away\.vk\.com$/, path: /^\/away\.php$/, params: ['to'] },
  // GMX and WEB.DE webmail
  { host: /^deref-(?:gmx|web)\.(?:net|de|com)$/, path: /dereferrer/, params: ['redirectUrl'] },
];

/** The real address behind a redirect link, if `href` is one (only http/https targets). */
export function unwrapLink(href: string): string | undefined {
  const url = URL.parse(href);
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return undefined;
  const wrapper = wrappers.find((w) => w.host.test(url.hostname) && w.path.test(url.pathname));
  for (const param of wrapper?.params ?? []) {
    const target = URL.parse(url.searchParams.get(param) ?? '');
    if (target && (target.protocol === 'https:' || target.protocol === 'http:')) return target.href;
  }
  return undefined;
}

/**
 * Takes links to redirect pages straight to the real page: on a redirect page itself, goes on at
 * once; on other pages, rewrites a wrapped link when it's clicked (before the browser follows it)
 * or right-clicked (so "Copy link address" copies the real one). Returns a function that stops.
 */
export function startSkippingRedirects(win: Window = window): () => void {
  const target = win === win.top ? unwrapLink(win.location.href) : undefined;
  if (target) {
    win.location.replace(target);
    return () => {};
  }
  const fix = (event: Event) => {
    // composedPath: also links inside shadow roots.
    const link = event
      .composedPath()
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    const real = link && unwrapLink(link.href);
    if (link && real) link.href = real;
  };
  const types = ['click', 'auxclick', 'contextmenu'];
  for (const type of types) win.addEventListener(type, fix, true);
  return () => {
    for (const type of types) win.removeEventListener(type, fix, true);
  };
}
