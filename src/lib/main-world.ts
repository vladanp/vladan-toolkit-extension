// Scripts in the page's own JavaScript world (`world: 'MAIN'`) can override page APIs, but can't read
// extension storage. An isolated world script announces the feature's switch to them with DOM events
// (see shareSwitchWithPage in ./page-switch.ts). This file has no imports: it runs in the page world.

export const askEvent = 'vladan-toolkit:ask';
export const switchEvent = 'vladan-toolkit:switch';

/** `detail` of a switch event: "<feature-id>=1" (on) or "<feature-id>=0" (off). */
export const switchDetail = (featureId: string, on: boolean) => `${featureId}=${on ? 1 : 0}`;

/**
 * Page world: returns a function resolving whether the feature is switched on. Until the first
 * announcement arrives it waits (up to `timeout` ms, then answers "off").
 */
export function mainWorldSwitch(featureId: string, doc: Document = document, timeout = 3000) {
  let on: boolean | undefined;
  const waiting = new Set<(on: boolean) => void>();
  doc.addEventListener(switchEvent, (event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (typeof detail !== 'string') return;
    const [id, value] = detail.split('=');
    if (id !== featureId) return;
    on = value === '1';
    for (const resolve of waiting) resolve(on);
    waiting.clear();
  });
  doc.dispatchEvent(new CustomEvent(askEvent, { detail: featureId }));

  const isOn = (): Promise<boolean> => {
    if (on !== undefined) return Promise.resolve(on);
    return new Promise((resolve) => {
      waiting.add(resolve);
      setTimeout(() => {
        waiting.delete(resolve);
        resolve(on ?? false);
      }, timeout);
    });
  };
  /** The answer right now, for code that can't wait (e.g. inside a beforeunload event): "off" until known. */
  isOn.now = () => on ?? false;
  return isOn;
}
