import { useEffect, useState } from 'react';
import { pausedSites } from '@/lib/features';

/** Popup button that turns every feature off (or back on) for the site in the current tab. */
export function PauseSite() {
  const [host, setHost] = useState<string>();
  const [sites, setSites] = useState<string[]>();

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const url = URL.parse(tab?.url ?? '');
      if (url?.protocol === 'https:' || url?.protocol === 'http:') setHost(url.hostname);
    });
    pausedSites.getValue().then(setSites);
    return pausedSites.watch(setSites);
  }, []);

  if (!host || !sites) return null; // Not a web page (e.g. a new tab or chrome:// page).
  const paused = sites.includes(host);
  return (
    <div
      className={`mb-2 flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
        paused
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200'
          : 'bg-neutral-200/60 dark:bg-white/5'
      }`}
    >
      <span className="mr-auto min-w-0 truncate" title={host}>
        {paused ? `Paused on ${host}` : host}
      </span>
      <button
        type="button"
        className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600/10 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:bg-blue-400/10"
        onClick={() => {
          const next = paused ? sites.filter((site) => site !== host) : [...sites, host];
          setSites(next); // Update immediately (storage confirms asynchronously via watch).
          pausedSites.setValue(next);
        }}
      >
        {paused ? 'Resume' : 'Pause on this site'}
      </button>
    </div>
  );
}
