/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from "react";
import { SnClientScript } from "../../../types/form-schema"; // assuming your script shape is typed

interface ClientScriptContextValue {
  clientScripts: SnClientScript[];
  runClientScriptsForFieldChange: (
    fieldName: string,
    oldValue: any,
    newValue: any,
    isLoading: boolean,
    gForm: any
  ) => void;
}

export const SnClientScriptContext = createContext<ClientScriptContextValue | null>(null);

export function useClientScripts() {
  const context = useContext(SnClientScriptContext);
  if (!context) throw new Error("useClientScripts must be used inside SnClientScriptProvider");
  return context;
}
