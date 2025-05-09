import { useMemo } from "react";
import { SnFieldSchema } from "@kit/types/form-schema";
import { FieldUIState } from "../../../types/form-schema";

interface Props {
  field: SnFieldSchema;
  fieldVal: string;
  uiState: Record<string, FieldUIState>;
}

export function useEffectiveFieldState({ field, fieldVal, uiState }: Props): FieldUIState {
  return useMemo(() => {
    function isReadonly(sysRo: boolean, ro: boolean, man: boolean): boolean {
      return sysRo ? true : ro && !!(fieldVal || !man);
    }

    function isMandatory(sysRo: boolean, man: boolean): boolean {
      return sysRo ? false : man;
    }

    const overrides = uiState[field.name] || {};
    const ro = overrides.readonly ?? field.readonly ?? false;
    const man = overrides.mandatory ?? field.mandatory ?? false;

    return {
      readonly: isReadonly(!!field.sys_readonly, ro, man),
      visible: overrides.visible ?? true,
      mandatory: isMandatory(!!field.sys_readonly, man),
    };
  }, [field, uiState, fieldVal]);
}
