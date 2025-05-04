/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z, ZodTypeAny } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SnFieldSchema, SnFieldsSchema } from "@kit/types/form-schema";
import { getFormData } from "@kit/utils/form-api";
import { SnField } from "./sn-field";

interface SnFormProps {
  table: string;
  guid: string;
}

function mapFieldToZod(field: SnFieldSchema): ZodTypeAny {
  let base: ZodTypeAny;

  switch (field.type) {
    case "string":
      base = z.string();
      if (field.max_length && base instanceof z.ZodString) {
        base = base.max(field.max_length);
      }
      break;
    case "choice":
      base = z.enum(field.choices!.map(c => c.value) as [string, ...string[]]);
      break;
    case "boolean":
      base = z.boolean();
      break;
    default:
      base = z.any();
  }

  if (field.type === "string" && field.mandatory) {
    base = z.string().min(1, ``);
  }

  return field.mandatory ? base : base.optional();
}

function getDefaultValue(field: SnFieldSchema) {
  if (field.value !== undefined && field.value !== null) return field.value;
  switch (field.type) {
    case "boolean":
      return false;
    case "string":
    case "choice":
      return "";
    default:
      return null;
  }
}

export function SnForm({ table, guid }: SnFormProps) {
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null);

  const schema = useMemo(() => {
    if (!formFields) return null;

    const shape: Record<string, ZodTypeAny> = {};
    for (const field of Object.values(formFields)) {
      shape[field.name] = mapFieldToZod(field);
    }

    return z.object(shape);
  }, [formFields]);

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: {},
    mode: "onBlur"
  });

  // 🔁 Apply default values after async data is loaded
  useEffect(() => {
    if (!formFields) return;

    const values = Object.fromEntries(
      Object.values(formFields).map(f => [f.name, getDefaultValue(f)])
    );

    form.reset(values); // ✅ Set values after data is available
  }, [formFields, form]);

  // 🔁 Fetch ServiceNow form metadata
  useEffect(() => {
    const getForm = async () => {
      const controller = new AbortController();
      try {
        const response = await getFormData(table, guid, controller);
        if (response.status === 200) {
          const form = response.data.result;
          setFormFields(form._fields); // assumed to be Record<string, SnFieldSchema>
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };
    getForm();
  }, [table, guid]);

  const onSubmit = (data: Record<string, any>) => {
    console.log("Form submitted:", data);
  };

  if (!formFields || !schema) return <div>Loading form...</div>;

  return (
<FormProvider {...form}>
  <div className="w-full px-4">
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {Object.values(formFields).map(field => (
        <SnField key={field.name} field={field} />
      ))}
      <button type="submit" className="mt-4">
        Submit
      </button>
    </form>
  </div>
</FormProvider>

  );
}
