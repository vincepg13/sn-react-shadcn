import { z } from 'zod';

const _userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  image: z.string().optional(),
  phone: z.string().optional(),
  im: z.string().optional(),
});

const _groupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  manager: _userSchema.optional(),
  members: z.array(_userSchema),
  membersCount: z.number().optional(),
});

export type SnUser = z.infer<typeof _userSchema>;
export type SnGroup = z.infer<typeof _groupSchema>;