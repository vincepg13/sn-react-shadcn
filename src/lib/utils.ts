import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { twMerge } from 'tailwind-merge'
import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function errorHandler(e: unknown, msg: string) {
  if (isAxiosError(e) && e.code === 'ERR_CANCELED') return;
  const eMsg = isAxiosError(e) && e.response?.data?.error?.message ? `: ${e.response.data.error.message}` : '';
  toast.error(msg + eMsg);
  console.error(msg, e);
}