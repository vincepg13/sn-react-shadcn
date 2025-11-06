import { z } from 'zod'

const _listPref = z.object({
  name: z.string().optional(),
  sys_id: z.string().optional(),
  value: z.string(),
})

const _listView = z.object({
  name: z.string(),
  sys_id: z.string(),
  sys_user: z.string(),
})

const _listViewElement = z.object({
  element: z.string(),
  position: z.string(),
})

const _snColSchema = z.object({
  label: z.string(),
  exampleValue: z.string(),
  internalType: z.string(),
  name: z.string(),
})

const rowItem = z.object({
  display_value: z.string(),
  value: z.string(),
  label: z.string().optional(),
})

const rowItemNullable = z.object({
  display_value: z.string().nullable(),
  value: z.string().nullable(),
  label: z.string().optional(),
})

const listItem = z.object({
  value: z.string(),
  label: z.string(),
})

export const SnPersonalListSchema = z.object({
  unselected: z.array(listItem),
  selected: z.array(listItem),
  isUserList: z.boolean(),
})

export type SnListItem = z.infer<typeof listItem>
export type SnPersonalList = z.infer<typeof SnPersonalListSchema>

export const rowSchemaNullable = z.record(z.string(), rowItemNullable)
export type SnCell = z.infer<typeof rowItemNullable>
export type SnRowNullable = z.infer<typeof rowSchemaNullable>

export const rowSchema = z.record(z.string(), rowItem)
export type SnRowItem = z.infer<typeof rowItem>
export type SnRow = z.infer<typeof rowSchema>
export type SnColSchema = z.infer<typeof _snColSchema>
export type SnListPref = z.infer<typeof _listPref>
export type SnListView = z.infer<typeof _listView>
export type SnListViewElement = z.infer<typeof _listViewElement>

export type SnApiResponse<T = []> = {
  status: number;
  data: {
    result: T;
  };
  headers: {
    "x-total-count"?: string;
  };
};