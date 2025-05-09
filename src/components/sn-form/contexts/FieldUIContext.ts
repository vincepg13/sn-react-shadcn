import { createContext, useContext } from "react";
import { FieldUIState } from "../../../types/form-schema";

export const FieldUIContext = createContext<FieldUIState | null>(null);

export function useFieldUI(): FieldUIState {
  const context = useContext(FieldUIContext);
  if (!context) throw new Error("useFieldUI must be used within FieldUIContext.Provider");
  return context;
}
