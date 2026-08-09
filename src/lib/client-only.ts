import { useCallback, useSyncExternalStore } from "react";

const neverChanges = () => () => {};

/**
 * Reads a value that only exists in the browser, without a hydration mismatch:
 * the server renders `serverValue`, the client swaps in the real one.
 *
 * Prefer this over reading the value in an effect and calling setState — that
 * costs an extra render pass and trips react-hooks/set-state-in-effect.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(neverChanges, read, () => serverValue);
}

/**
 * Tracks a media query. Unlike a one-shot read on mount, this keeps up with
 * the viewport, so resizing across the breakpoint is reflected live.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
