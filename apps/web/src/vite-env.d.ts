/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_PLAY_STORE_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_INSTAGRAM_HANDLE?: string;
  readonly VITE_YOUTUBE_CHANNEL_URL?: string;
  readonly VITE_INSTAGRAM_POST_URLS?: string;
  readonly VITE_YOUTUBE_VIDEO_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
