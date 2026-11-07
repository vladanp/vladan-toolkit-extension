import { FeatureToggles } from '@/components/FeatureToggles';
import { PauseSite } from '@/components/PauseSite';
import { getVersionLabel } from '@/lib/version';

export default function App() {
  return (
    // Chrome caps popups at 600px tall: the switches scroll between a fixed header and footer.
    <main className="flex max-h-[600px] w-[22rem] flex-col p-3 font-sans">
      <header className="mb-2 flex shrink-0 items-center gap-2.5 px-1">
        <img src="/icon/48.png" alt="" className="size-7 rounded-lg shadow-sm" />
        <h1 className="text-base font-semibold tracking-tight">Vladan Toolkit</h1>
        <span
          data-testid="version"
          className="ml-auto rounded-full bg-neutral-200/70 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
        >
          {getVersionLabel(browser.runtime.getManifest().version)}
        </span>
      </header>
      <PauseSite />
      {/* Side padding keeps the cards' shadows and focus rings unclipped; `relative` keeps the
          screen reader only descriptions (absolutely positioned) inside the scroll area. */}
      <div className="relative -mx-3 min-h-0 overflow-y-auto px-3 pb-1 [scrollbar-width:thin]">
        <FeatureToggles compact />
      </div>
      <button
        type="button"
        className="mt-2 w-full shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600/10 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:bg-blue-400/10"
        onClick={() => browser.runtime.openOptionsPage()}
      >
        All settings →
      </button>
    </main>
  );
}
