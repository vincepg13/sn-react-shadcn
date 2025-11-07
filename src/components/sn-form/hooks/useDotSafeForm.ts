/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from 'react';
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';

// ---- name mapping (bijective, no special chars) ----
export const toSafe = (name: string) =>
  name
    .replaceAll('.', '__DOT__')
    .replaceAll('[', '__L__')
    .replaceAll(']', '__R__');

export const toRaw = (safe: string) =>
  safe
    .replaceAll('__DOT__', '.')
    .replaceAll('__L__', '[')
    .replaceAll('__R__', ']');

// shallow key map (your values object is flat by field name)
const mapKeysShallow = (obj: any, mapKey: (k: string) => string) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [mapKey(k), v]));
};

export function useDotSafeForm<
  TFieldValues extends Record<string, any> = Record<string, any>
>(
  props: UseFormProps<TFieldValues> = {}
): UseFormReturn<TFieldValues> & {
  toSafe: (name: string) => string;
  toRaw: (name: string) => string;
} {
  // Map defaultValues once
  const mappedDefaults = useMemo(
    () =>
      props.defaultValues
        ? (mapKeysShallow(props.defaultValues as any, toSafe) as UseFormProps<TFieldValues>['defaultValues'])
        : undefined,
    [props.defaultValues]
  );

  const form = useForm<TFieldValues>({ ...props, defaultValues: mappedDefaults });

  // capture originals so our wrappers never recurse
  const orig = useMemo(
    () => ({
      register: form.register,
      setValue: form.setValue,
      getValues: form.getValues,
      watch: form.watch,
      trigger: form.trigger,
      clearErrors: form.clearErrors,
      setError: form.setError,
      setFocus: form.setFocus,
      unregister: form.unregister,
      reset: form.reset,
      control: form.control,
    }),
    [form]
  );

  // ---- Wrappers that accept RAW names and translate to SAFE ----
  const register = useCallback(
    ((name: string, options?: any) =>
      (orig.register as any)(toSafe(name), options)) as typeof form.register,
    [orig]
  );

  const setValue = useCallback(
    ((name: string, ...rest: any[]) =>
      (orig.setValue as any)(toSafe(name), ...rest)) as typeof form.setValue,
    [orig]
  );

  const getValues = useCallback(
    ((name?: string | string[]) => {
      if (typeof name === 'string') return (orig.getValues as any)(toSafe(name));
      if (Array.isArray(name)) return (orig.getValues as any)(name.map(toSafe));
      return orig.getValues(); // full object (with SAFE keys)
    }) as typeof form.getValues,
    [orig]
  );

  const watch = useCallback(
    ((name?: string | string[], defaultValue?: any) => {
      if (typeof name === 'string') return (orig.watch as any)(toSafe(name), defaultValue);
      if (Array.isArray(name)) return (orig.watch as any)(name.map(toSafe), defaultValue);
      return orig.watch(); // full object (with SAFE keys)
    }) as typeof form.watch,
    [orig]
  );

  const trigger = useCallback(
    ((name?: string | string[]) =>
      (orig.trigger as any)(
        typeof name === 'string' ? toSafe(name) : Array.isArray(name) ? name.map(toSafe) : name
      )) as typeof form.trigger,
    [orig]
  );

  const clearErrors = useCallback(
    ((name?: string | string[]) =>
      (orig.clearErrors as any)(
        typeof name === 'string' ? toSafe(name) : Array.isArray(name) ? name.map(toSafe) : name
      )) as typeof form.clearErrors,
    [orig]
  );

  const setFocus = useCallback(
    ((name: string) => (orig.setFocus as any)(toSafe(name))) as typeof form.setFocus,
    [orig]
  );

  const unregister = useCallback(
    ((name?: string | string[]) =>
      (orig.unregister as any)(
        typeof name === 'string' ? toSafe(name) : Array.isArray(name) ? name.map(toSafe) : name
      )) as typeof form.unregister,
    [orig]
  );

  const setError = useCallback(
    ((name: string, error: any, opts?: any) =>
      (orig.setError as any)(toSafe(name), error, opts)) as typeof form.setError,
    [orig]
  );

  const reset = useCallback(
    ((values?: any, options?: any) =>
      orig.reset(values ? (mapKeysShallow(values, toSafe) as any) : values, options)) as typeof form.reset,
    [orig]
  );

  // attach helpers (don’t change object identity or control)
  (form as any).register = register;
  (form as any).setValue = setValue;
  (form as any).getValues = getValues;
  (form as any).watch = watch;
  (form as any).trigger = trigger;
  (form as any).clearErrors = clearErrors;
  (form as any).setError = setError;
  (form as any).setFocus = setFocus;
  (form as any).unregister = unregister;
  (form as any).reset = reset;
  (form as any).toSafe = toSafe as (name: string) => string;
  (form as any).toRaw = toRaw as (name: string) => string;

  return form as UseFormReturn<TFieldValues> & {
    toSafe: (name: string) => string;
    toRaw: (name: string) => string;
  };
}
