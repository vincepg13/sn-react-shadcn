export type GlideAjaxConfig = {
  endpoint?: string;
  debug?: boolean;
  extractAnswer?: (rawXml: string) => string;
  onError?: (err: unknown, ctx: { processor: string; params: Record<string, string> }) => void;
  defaults?: Record<string, string>;
};