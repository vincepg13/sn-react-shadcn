import { useRef } from 'react';

type Callback = () => void | Promise<void>;

export function useUiActionLifecycle() {
  const preCallbacks = useRef<Map<string, Callback>>(new Map());
  const postCallbacks = useRef<Map<string, Callback>>(new Map());

  const registerPreUiActionCallback = (fieldKey: string, cb: Callback) => {
    preCallbacks.current.set(fieldKey, cb);
  };

  const registerPostUiActionCallback = (fieldKey: string, cb: Callback) => {
    postCallbacks.current.set(fieldKey, cb);
  };

  const runUiActionCallbacks = async (type: 'pre' | 'post') => {
    const map = type === 'post' ? postCallbacks.current : preCallbacks.current;
    const callbacks = Array.from(map.values());

    for (const cb of callbacks) {
      await cb();
    }

    map.clear();
  };

  return {
    registerPreUiActionCallback,
    registerPostUiActionCallback,
    runUiActionCallbacks,
  };
}
