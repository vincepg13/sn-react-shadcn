import { SnFormConfig } from './../../../types/form-schema';
import { createContext, useContext } from 'react'

type SnFormLifecycleContextType = {
  formConfig: SnFormConfig,
  registerPreUiActionCallback: (fieldKey: string, cb: () => void | Promise<void>) => void,
  registerPostUiActionCallback: (fieldKey: string, cb: () => void | Promise<void>) => void
};

export const SnFormLifecycleContext = createContext<SnFormLifecycleContextType | null>(null);

export const useFormLifecycle = () => {
  const ctx = useContext(SnFormLifecycleContext)
  if (!ctx) throw new Error("useFormLifecycle must be used within SnForm")
  return ctx
}
