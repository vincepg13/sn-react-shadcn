import { z } from 'zod'

export type GlideAjaxConfig = {
  endpoint?: string;
  debug?: boolean;
  extractAnswer?: (rawXml: string) => string;
  onError?: (err: unknown, ctx: { processor: string; params: Record<string, string> }) => void;
  defaults?: Record<string, string>;
};

export const _GlideUserSchema = z.object({
  roles: z.string().array(),
  departmentID: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  preferences: z.record(z.string()),
  userID: z.string(),
  userName: z.string(),
})

export type GlideUserSchema = z.infer<typeof _GlideUserSchema>