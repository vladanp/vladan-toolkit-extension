import { describe, expect, it, vi } from 'vitest';
import {
  type Feature,
  featureEnabled,
  followFeature,
  pausedSites,
  tabHost,
  whileEnabled,
} from './features';

const feature: Feature = {
  id: 'test-feature',
  name: 'Test feature',
  description: 'For tests',
  group: 'All websites',
  enabledByDefault: true,
};

// Storage change events are delivered asynchronously.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('featureEnabled', () => {
  it('falls back to the feature default', async () => {
    expect(await featureEnabled(feature).getValue()).toBe(true);
    expect(await featureEnabled({ ...feature, enabledByDefault: false }).getValue()).toBe(false);
  });

  it('persists a user choice', async () => {
    await featureEnabled(feature).setValue(false);
    expect(await featureEnabled(feature).getValue()).toBe(false);
  });
});

describe('whileEnabled', () => {
  it('enables immediately when on, and follows the setting live', async () => {
    const disable = vi.fn();
    const enable = vi.fn(() => disable);
    await whileEnabled(feature, enable);
    expect(enable).toHaveBeenCalledTimes(1);

    await featureEnabled(feature).setValue(false);
    await settle();
    expect(disable).toHaveBeenCalledTimes(1);

    await featureEnabled(feature).setValue(true);
    await settle();
    expect(enable).toHaveBeenCalledTimes(2);
  });

  it('does nothing while off', async () => {
    await featureEnabled(feature).setValue(false);
    const enable = vi.fn(() => () => {});
    await whileEnabled(feature, enable);
    expect(enable).not.toHaveBeenCalled();
  });

  it('stop() cleans up and ignores later changes', async () => {
    const disable = vi.fn();
    const enable = vi.fn(() => disable);
    const stop = await whileEnabled(feature, enable);
    stop();
    expect(disable).toHaveBeenCalledTimes(1);

    await featureEnabled(feature).setValue(false);
    await featureEnabled(feature).setValue(true);
    await settle();
    expect(enable).toHaveBeenCalledTimes(1);
  });
});

describe('paused sites', () => {
  it('turn the feature off on that site, live, and back on when resumed', async () => {
    const seen: boolean[] = [];
    await followFeature(feature, (on) => seen.push(on), 'news.example.com');
    expect(seen.at(-1)).toBe(true);

    await pausedSites.setValue(['news.example.com']);
    await settle();
    expect(seen.at(-1)).toBe(false);

    await featureEnabled(feature).setValue(true); // The switch alone doesn't override the pause.
    await settle();
    expect(seen.at(-1)).toBe(false);

    await pausedSites.setValue([]);
    await settle();
    expect(seen.at(-1)).toBe(true);
  });

  it('leave other sites alone', async () => {
    await pausedSites.setValue(['other.example.com', 'example.com']);
    const seen: boolean[] = [];
    await followFeature(feature, (on) => seen.push(on), 'news.example.com');
    expect(seen).toEqual([true]);
  });

  it("count by the tab's page, also inside its iframes", () => {
    const frame = {
      hostname: 'consent.cmp.example',
      ancestorOrigins: ['https://news.example.com'],
    };
    expect(tabHost(frame as unknown as Location)).toBe('news.example.com');
    expect(tabHost({ hostname: 'news.example.com' } as Location)).toBe('news.example.com');
    expect(tabHost(undefined)).toBe('');
  });
});
