// Runs in the page's own JavaScript world (see lib/main-world.ts): no extension APIs here.

/**
 * While the feature is on, a page's beforeunload handlers can't make Chrome ask "Leave site?", unless
 * the user typed on the page (then the warning may protect unsaved text, so it stays). Must run before
 * the page's own scripts.
 */
export function defuseLeavePrompts(win: Window, isOn: () => boolean) {
  let typed = false;
  win.addEventListener('input', () => (typed = true), true); // Only user input fires "input".
  const blocking = () => isOn() && !typed;

  // Listeners ask with event.preventDefault() or event.returnValue = "…": make both do nothing.
  // Registered first, so it runs before every listener the page adds.
  win.addEventListener(
    'beforeunload',
    (event) => {
      if (!blocking()) return;
      Object.defineProperties(event, {
        preventDefault: { configurable: true, value: () => {} },
        returnValue: { configurable: true, get: () => '', set: () => {} },
      });
    },
    true,
  );

  // `window.onbeforeunload = () => "…"` asks by returning a value: drop it.
  // ponytail: <body onbeforeunload="…"> in the HTML bypasses this setter; rare, add if a site needs it.
  let owner: object | null = win;
  while (owner && !Object.hasOwn(owner, 'onbeforeunload')) owner = Object.getPrototypeOf(owner);
  const native = owner && Object.getOwnPropertyDescriptor(owner, 'onbeforeunload');
  if (!native?.set) return;
  let handler: ((event: BeforeUnloadEvent) => unknown) | null = null;
  Object.defineProperty(win, 'onbeforeunload', {
    configurable: true,
    enumerable: true,
    get: () => handler,
    set(value: unknown) {
      handler = typeof value === 'function' ? (value as typeof handler) : null;
      const page = handler;
      native.set?.call(
        win,
        page &&
          function (this: Window, event: BeforeUnloadEvent) {
            const result = page.call(this, event);
            return blocking() ? undefined : result;
          },
      );
    },
  });
}
