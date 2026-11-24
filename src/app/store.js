// Minimal observable state container.
export function createStore(initial) {
  const state = { ...initial };
  const subs = new Set();
  return {
    state,
    /** Merge a patch; subscribers get (changedKeys, state, meta). Returns true when something changed. */
    set(patch, meta) {
      const changed = [];
      for (const k of Object.keys(patch)) {
        if (!Object.is(state[k], patch[k])) {
          state[k] = patch[k];
          changed.push(k);
        }
      }
      if (changed.length) for (const fn of [...subs]) fn(changed, state, meta);
      return changed.length > 0;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
