/** Published game artwork can move between CDNs without changing content IDs. */
const base = import.meta.env.VITE_ASSET_BASE_URL;
if (base) {
  const url = new URL(base);
  if (url.protocol === "https:")
    for (const [name, path] of [
      ["basalt", "basalt-tile.webp"],
      ["arena", "arena-portrait.webp"],
      ["legends", "legends-atlas.png"],
    ]) {
      document.documentElement.style.setProperty(
        `--asset-${name}`,
        `url("${base.replace(/\/$/, "")}/art/${path}")`,
      );
    }
}
