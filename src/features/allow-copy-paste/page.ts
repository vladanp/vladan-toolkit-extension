// Runs in the page's own JavaScript world (see lib/main-world.ts): no extension APIs here.

const types = ['copy', 'cut', 'paste', 'contextmenu', 'selectstart'] as const;
const wrapped = new WeakSet<object>();
/** Per event: whether a cancel by the handler running now only blocks the user. */
const verdicts = new WeakMap<Event, () => boolean>();

/**
 * While the feature is on, undoes the usual ways sites block copying, pasting, selecting text and the
 * right-click menu, and leaves editors and custom menus working:
 * - copy/cut: a cancel counts only if a handler puts its own data on the clipboard;
 * - paste: a cancel counts only if a handler reads the clipboard (to paste it itself);
 * - right-click, text selection: cancels by handlers of the whole page (window, document, <html>,
 *   <body>) don't count; handlers of specific elements (custom context menus) still work.
 * Covers preventDefault(), `returnValue = false` and `return false` from on… handlers. Must run
 * before the page's own scripts.
 */
export function defuseCopyBlockers(win: Window, isOn: () => boolean) {
  const doc = win.document;
  const pageWide = (node: EventTarget | null) =>
    node === win || node === doc || node === doc.documentElement || node === doc.body;

  for (const type of types) {
    win.addEventListener(
      type,
      (event) => {
        if (!isOn()) return;
        const preventDefault = event.preventDefault;
        const cancel = () => preventDefault.call(event);
        // A cancel that looked like blocking turns legit once a handler uses the clipboard itself
        // (handlers often cancel first, then read or write it).
        let held = false;
        let usesClipboard = false;
        const used = () => {
          usesClipboard = true;
          if (held) cancel();
        };
        const data = (event as ClipboardEvent).clipboardData;
        if (data) {
          const reading = type === 'paste';
          const { getData, setData } = data;
          Object.defineProperties(data, {
            getData: {
              configurable: true,
              value: (format: string) => {
                if (reading) used();
                return getData.call(data, format);
              },
            },
            setData: {
              configurable: true,
              value: (format: string, value: string) => {
                if (!reading) used();
                return setData.call(data, format, value);
              },
            },
          });
          for (const key of ['items', 'files'] as const) {
            const get = Object.getOwnPropertyDescriptor(DataTransfer.prototype, key)?.get;
            Object.defineProperty(data, key, {
              configurable: true,
              get: () => {
                used(); // Pasting files/images, or copying them via items.add().
                return get?.call(data);
              },
            });
          }
        }
        const blocks = () => {
          if (type === 'copy' || type === 'cut' || type === 'paste') return !usesClipboard;
          return pageWide(event.currentTarget);
        };
        verdicts.set(event, blocks);

        Object.defineProperties(event, {
          preventDefault: {
            configurable: true,
            value: () => {
              if (blocks()) held = true;
              else cancel();
            },
          },
          returnValue: {
            configurable: true,
            get: () => !event.defaultPrevented,
            set: (value: unknown) => {
              if (value === false) event.preventDefault();
            },
          },
        });

        // on… handlers (oncontextmenu="return false") cancel by their return value: wrap each one on
        // the event's way (once) so a blocking `false` is dropped while the feature is on.
        const property = `on${type}` as const;
        for (const node of event.composedPath() as unknown as Record<string, unknown>[]) {
          const handler = node[property];
          if (typeof handler !== 'function' || wrapped.has(handler)) continue;
          const wrapper = function (this: unknown, event: Event) {
            const result = handler.call(this, event);
            return result === false && isOn() && verdicts.get(event)?.() ? undefined : result;
          };
          wrapped.add(wrapper);
          node[property] = wrapper;
        }
      },
      true,
    );
  }
}
