import { useCallback, useSyncExternalStore } from "react";

const neverChanges = () => () => {};

/**
 * Reads a value that only exists in the browser, without a hydration mismatch:
 * the server renders `serverValue`, the client reads the real one.
 *
 * Prefer this over reading the value in an effect and calling setState — that
 * costs an extra render pass and trips react-hooks/set-state-in-effect.
 *
 * `read` is re-run on every render and the result compared with `Object.is`,
 * so it is deliberately constrained to primitives. Returning a fresh object or
 * array would never compare equal and would re-render forever.
 *
 * Note this is not pinned at mount either: if `read` starts returning something
 * different, the next render picks it up. That is fine for a value that changes
 * slowly, like the time of day.
 */
export function useClientValue<T extends string | number | boolean | null>(
  read: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(neverChanges, read, () => serverValue);
}

const queryCache = new Map<string, MediaQueryList>();

/** Cached so repeated renders don't allocate a MediaQueryList each time. */
function mediaQuery(query: string) {
  let mql = queryCache.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    queryCache.set(query, mql);
  }
  return mql;
}

/**
 * Tracks a media query. Unlike a one-shot read on mount, this keeps up with
 * the viewport, so resizing across the breakpoint is reflected live.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = mediaQuery(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    // jsdom has no matchMedia, so a component test rendering this would throw
    // rather than simply fall back to the server value.
    () => (typeof window.matchMedia === "function" ? mediaQuery(query).matches : serverValue),
    () => serverValue,
  );
}
