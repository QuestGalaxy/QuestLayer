declare module '*.css?inline' {
  const css: string;
  export default css;
}

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_PUBLIC_API_KEY?: string;
  readonly VITE_REVENUECAT_OFFERING_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
