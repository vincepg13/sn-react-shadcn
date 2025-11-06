// condition-schema.ts (Zod-first)
import { z } from 'zod'

//Value schemas
export const SnValueChoiceItemSchema = z.object({
  label: z.string(),
  value: z.string(),
})
export type SnValueChoiceItem = z.infer<typeof SnValueChoiceItemSchema>

export const SnFieldCurrencyChoiceSchema = z.object({
  symbol: z.string(),
  code: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  default: z.boolean().optional(),
})
export type SnFieldCurrencyChoice = z.infer<typeof SnFieldCurrencyChoiceSchema>

export const SnFieldOperatorSchema = z.object({
  operator: z.string(),
  label: z.string(),
  advancedEditor: z.string(),
  editor: z.string(),
  betweenType: z.string().optional(),
})
export type SnFieldOperator = z.infer<typeof SnFieldOperatorSchema>

export const SnFieldChoiceSchema = z.object({
  label: z.string(),
  value: z.string(),
})
export type SnFieldChoice = z.infer<typeof SnFieldChoiceSchema>

export const SnConditionRefFieldSchema = z.object({
  field: z.string(),
  field_label: z.string(),
  internal_type: z.string(),
  reference_table: z.string(),
})
export type SnConditionRefField = z.infer<typeof SnConditionRefFieldSchema>

//Condition field
export const SnConditionFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.string(),
  reference: z.string().optional(),
  referenceDisplayField: z.string().optional(),
  referenceKey: z.string().optional(),
  referenceCols: z.array(z.string()).optional(),
  choices: z.array(SnFieldChoiceSchema).optional(),
  operators: z.array(SnFieldOperatorSchema).optional(),
  qualifier: z.string().optional(),
})
export type SnConditionField = z.infer<typeof SnConditionFieldSchema>

export const SnConditionMapSchema = z.record(z.string(), SnConditionFieldSchema)
export type SnConditionMap = z.infer<typeof SnConditionMapSchema>

//Condition nodes (recursive)
export const SnConditionRowSchema = z.object({
  id: z.string(),
  type: z.literal('condition'),
  field: z.string(),
  operator: z.string(),
  value: z.string(),
  fieldLabel: z.string().optional(),
  operatorLabel: z.string().optional(),
  displayValue: z.string().optional(),
  fieldType: z.string().optional(),
  table: z.string().optional(),
  references: z.array(SnConditionRefFieldSchema).optional(),
  term: z.string().optional(),
  termLabel: z.string().optional(),
})

export const SnConditionGroupSchema: z.ZodType<{
  id: string;
  type: "and" | "or";
  conditions: Array<SnConditionRow | SnConditionGroup>;
}> = z.object({
  id: z.string(),
  type: z.enum(["and", "or"]),
  // Lazy reference to SnConditionNodeSchema avoids the circular initializer
  conditions: z.array(z.lazy(() => SnConditionNodeSchema)),
});

export const SnConditionNodeSchema = z.union([
  SnConditionRowSchema,
  SnConditionGroupSchema,
]);

export const SnConditionModelSchema = z.array(SnConditionGroupSchema);
export type SnConditionRow   = z.infer<typeof SnConditionRowSchema>;
export type SnConditionGroup = z.infer<typeof SnConditionGroupSchema>;
export type SnConditionNode  = z.infer<typeof SnConditionNodeSchema>;
export type SnConditionModel = z.infer<typeof SnConditionModelSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SnConditionsApiResultSchema = z.record(z.string(), z.any())
export type SnConditionsApiResult = z.infer<typeof SnConditionsApiResultSchema>

export const SnConditionDisplayItemSchema = z.object({
  display: z.string(),
  id: z.string(),
  or: z.boolean().optional(),
})
export type SnConditionDisplayItem = z.infer<typeof SnConditionDisplayItemSchema>

export const SnConditionDisplayArraySchema = z.array(z.array(SnConditionDisplayItemSchema))
export type SnConditionDisplayArray = z.infer<typeof SnConditionDisplayArraySchema>

//Table metadata
export const SnTableMetadataSchema = z.object({
  table: z.string(),
  fields: SnConditionMapSchema,
})
export type SnTableMetadata = z.infer<typeof SnTableMetadataSchema>

//Date time metadata
const PairSchema = z.tuple([z.string(), z.string()])
export const DateMetaArraySchema = z.array(PairSchema)
export type DateMetaArray = z.infer<typeof DateMetaArraySchema>

export const SnDateTimeMetaSchema = z.object({
  timeAgoDates: z.record(
    z.string(),
    z.object({
      label: z.string(),
      after: z.string(),
      before: z.string(),
      between: z.string(),
    })
  ),
  relativeOperators: z.array(PairSchema),
  relativeDurations: z.array(PairSchema),
  relativeTypes: z.array(PairSchema),
  comparativeDurations: z.array(PairSchema),
  comparativeTypes: z.array(PairSchema),
  equivalentDurations: z.array(PairSchema),
  trendValuesWithFieldsPlural: z.array(PairSchema),
  dateChoiceModel: z.array(z.object({ label: z.string(), value: z.string() })),
  dateChoiceBetweenDisplayValues: z.array(
    z.object({
      label: z.string(),
      values: z.array(z.object({ label: z.string(), value: z.string() })),
      type: z.string(),
    })
  ),
})
export type SnDateTimeMeta = z.infer<typeof SnDateTimeMetaSchema>