'use client';

import { BriefPanel } from './brief-panel';

/**
 * Desktop home for the brief artifact: a sticky rail beside the form column. `self-start`
 * plus internal overflow means it can never grow the page or fight the flow's scroll
 * positioning. Hidden below lg — the mobile drawer takes over there.
 */
export function BriefRail() {
  return (
    <aside
      aria-label="Your brief"
      className="hidden lg:block lg:h-full"
      data-brief-rail
    >
      {/* Sticks 2rem below the viewport top (1rem on short screens) and scrolls
          internally when the document outgrows the viewport — the paper is never taller
          than the screen and never overlaps the form column. */}
      <div className="sticky top-8 max-h-[calc(100dvh-4rem)] overflow-y-auto pb-4 [@media(max-height:760px)]:top-4 [@media(max-height:760px)]:max-h-[calc(100dvh-2rem)]">
        <BriefPanel />
      </div>
    </aside>
  );
}
