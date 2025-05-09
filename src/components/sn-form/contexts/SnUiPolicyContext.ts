import { SnFormConfig } from './../../../types/form-schema';
import { createContext, useContext } from 'react'

export const SnUiPolicyContext = createContext({
  formConfig: {} as SnFormConfig | null,
  runUiPolicies: () => {},
  runUiPoliciesForField: (_fieldName: string) => {},
})

export function useUiPoliciesContext() {
  const context = useContext(SnUiPolicyContext);
  if (!context) throw new Error("useUiPolicies must be used inside SnUiPolicyProvider");
  if (!context.formConfig) throw new Error("formConfig is not defined in SnUiPolicyContext");
  return context;
}
