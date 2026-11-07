import { storage } from '#imports';

/** Where a feature works; the settings UI groups its switches by this, in this order. */
export const featureGroups = ['YouTube', 'Reddit', 'LinkedIn', 'Popups', 'All websites'] as const;
export type FeatureGroup = (typeof featureGroups)[number];

export interface Feature {
  /** Stable kebab case id; part of the storage key, so never rename it. */
  id: string;
  /** Short name shown next to the switch. */
  name: string;
  /** One sentence explaining what the feature does. */
  description: string;
  /** Settings section the switch appears in. */
  group: FeatureGroup;
  enabledByDefault: boolean;
  /** A value the user picks next to the switch (e.g. a video quality); `options` maps value to label. */
  choice?: { label: string; options: Readonly<Record<string, string>>; default: string };
}

/** The on/off switch of a feature, synced across the user's browsers. */
export function featureEnabled(feature: Feature) {
  return storage.defineItem<boolean>(`sync:features.${feature.id}.enabled`, {
    fallback: feature.enabledByDefault,
  });
}

/** The value picked for a feature's `choice`, synced like its switch. */
export function featureChoice(feature: Feature) {
  return storage.defineItem<string>(`sync:features.${feature.id}.choice`, {
    fallback: feature.choice?.default ?? '',
  });
}

/** Sites (host names) where the user paused every feature, from the popup. Synced like the switches. */
export const pausedSites = storage.defineItem<string[]>('sync:pausedSites', { fallback: [] });

/** The host name of the tab's page: the top frame's, also when running inside an iframe. */
export function tabHost(loc: Location | undefined = globalThis.location): string {
  const top = loc?.ancestorOrigins?.[loc.ancestorOrigins.length - 1];
  return top ? new URL(top).hostname : (loc?.hostname ?? '');
}

/**
 * Calls `apply` with whether the feature should act on this page (switched on, and the site not
 * paused), now and on every change. Returns a function that stops watching.
 */
export async function followFeature(
  feature: Feature,
  apply: (on: boolean) => void,
  host = tabHost(),
) {
  const setting = featureEnabled(feature);
  let enabled: boolean | undefined;
  let paused: boolean | undefined;
  const update = () => {
    if (enabled !== undefined && paused !== undefined) apply(enabled && !paused);
  };
  const unwatchSetting = setting.watch((value) => {
    enabled = value;
    update();
  });
  const unwatchPaused = pausedSites.watch((sites) => {
    paused = sites.includes(host);
    update();
  });
  const [on, sites] = await Promise.all([setting.getValue(), pausedSites.getValue()]);
  enabled ??= on;
  paused ??= sites.includes(host);
  update();
  return () => {
    unwatchSetting();
    unwatchPaused();
  };
}

/**
 * Runs `enable` while the feature is switched on (and its site not paused), and the cleanup it
 * returns when that ends, reacting live. Returns a function that stops watching (and cleans up).
 */
export async function whileEnabled(feature: Feature, enable: () => () => void) {
  let disable: (() => void) | undefined;
  const apply = (on: boolean) => {
    if (on && !disable) disable = enable();
    if (!on && disable) {
      disable();
      disable = undefined;
    }
  };
  const unwatch = await followFeature(feature, apply);
  return () => {
    unwatch();
    apply(false);
  };
}
