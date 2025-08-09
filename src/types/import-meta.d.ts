// Minimal typing to enable import.meta.glob usage in Next.js with TypeScript
interface ImportMeta {
  glob: (
    pattern: string,
    options?: {
      eager?: boolean;
      import?: string;
    }
  ) => Record<string, unknown>;
}
