import { useMemo } from "react";
import { SnFieldSchema } from "@kit/types/form-schema";
import { FieldUIState } from "../../../types/form-schema";

interface Props {
  field: SnFieldSchema;
  uiState: Record<string, FieldUIState>;
}

export function useEffectiveFieldState({ field, uiState }: Props): FieldUIState {
  return useMemo(() => {
    const overrides = uiState[field.name] || {};
    return {
      readonly: overrides.readonly ?? field.readonly ?? false,
      visible: overrides.visible ?? true,
      mandatory: overrides.mandatory ?? field.mandatory ?? false,
    };
  }, [field, uiState]);
}
