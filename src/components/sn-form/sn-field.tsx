import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../../components/ui/form";
import React from "react";
import isEqual from "lodash.isequal";
import { useFormContext } from "react-hook-form";
import { SnFieldSchema, RHFField } from "../../types/form-schema";
import { SnFieldInput } from "./sn-field-input";
import { SnFieldTextarea } from "./sn-field-textarea";
// import { SnFieldBoolean } from "./sn-field-boolean";
// import { SnFieldChoice } from "./sn-field-choice";

interface SnFieldProps {
  field: SnFieldSchema;
}

function SnFieldComponent({ field }: SnFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      name={field.name}
      control={control}
      render={({ field: rhfField }) => {
        const input = renderFieldComponent(field, rhfField);

        if (!input) return <></>;

        return (
          <FormItem className="mb-4">
            <FormLabel>{field.label}</FormLabel>
            <FormControl>{input}</FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function renderFieldComponent(
  field: SnFieldSchema,
  rhfField: RHFField
): React.ReactNode {
  switch (field.type) {
    case "string":
      if (field.max_length && field.max_length >= 200) {
        return <SnFieldTextarea field={field} rhfField={rhfField} />;
      }
      return <SnFieldInput field={field} rhfField={rhfField} />;
    // case "choice":
    //   return <SnFieldChoice field={field} rhfField={rhfField} />;
    // case "boolean":
    //   return <SnFieldBoolean field={field} rhfField={rhfField} />;
    default:
      console.log(`Unsupported field type: ${field.type}`);
      return null;
  }
}

export const SnField = React.memo(SnFieldComponent, (prev, next) =>
  isEqual(prev.field, next.field)
);