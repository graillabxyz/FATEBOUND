/** Only compile tools into development and deliberately named internal builds. */
export const ENABLE_DEV_TOOLS =
  import.meta.env.DEV ||
  (import.meta.env.MODE === "internal" &&
    import.meta.env.VITE_ENABLE_DEV_TOOLS === "true");
