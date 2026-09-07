# Art provenance

Original generated concept art, built-in imagegen tool, 2026-09-07. Asset: public/art/legends-atlas.png. Six-panel atlas displayed with CSS sprite positioning, never fetched remotely. The imagery and short lore are fictional game interpretations, not historical or religious claims. Cultural consultation and final art review are required before commercial release.

Prompt: One square artwork atlas, exactly six equal portrait panels in a 3-column, 2-row grid, without text or borders. Premium painterly mature folklore fantasy, strong silhouettes, deep midnight forest and antique gold. Top row: Basajaun, an ancient mossy Basque guardian in a misty Pyrenees forest; Anansi, an elegant West African storyteller in indigo and gold with symbolic web motifs; Tengu, red long-nosed masked mountain warrior with black feathers. Bottom row: Leshy, angular bark-faced Slavic shapeshifter with branch crown; Quetzalcoatl, a jade feathered serpent and celestial sun; Māui, brown-skinned Polynesian demigod with dark hair, woven natural fibers, carved fishhook, rope and ocean sunset. Dignified portrayals, no cartoon/anime, no writing, logos, UI, divider lines or watermarks.

## UI polish materials — 2026-09-07

Original built-in imagegen assets: `public/art/arena-portrait.webp` (1024 × 1536) and `public/art/basalt-tile.webp` (1254 × 1254). The arena is used as the battle environment and the dim outer preview background. Basalt is blended beneath opaque UI surfaces to preserve contrast. The tile was requested to be seamless; the UI does not depend on exact edge matching. Generated PNG masters remain in the task’s working files. WebP encoding retains the original dimensions and adds approximately 357 KiB to the shipped client. Both assets are bundled for offline native use.

Omens are code-rendered physical meshes, not generated art: tetrahedron, cube, octahedron, pentagonal trapezohedron, dodecahedron and icosahedron. Their geometry is purely presentational; production face definitions and opposite mappings remain authoritative.

### Generation prompts

Mode: built-in image_gen. Exactly one request per asset; no variants or retries.

#### Asset 1

Use case: stylized-concept
Asset type: portrait mobile game environment background for a folklore competitive Omens/card game, OMNIPATH
Primary request: A 1024x1536 portrait painterly premium fantasy-game environment: an overhead/oblique ancient circular dark basalt tabletop arena in a dim forest sanctuary.
Subject and materials: Weathered stone concentric rings, small worn bronze inlays, moss only at the image corners. Thoughtful low-contrast painted stone, tactile and matte, not glossy photorealism.
Composition/framing: Portrait 2:3, overhead with a gentle oblique angle. The tabletop fills the scene. Center and lower center MUST be quiet, dark, unobstructed slate negative space suitable for UI and card overlays. Keep atmospheric detail at the corners. Concentric ring detail stays peripheral enough for easy legibility of future game overlays.
Lighting/mood: Restrained teal ambient glow and warm amber rimlight; dim, rich, contemplative.
Constraints: Generate only the background artwork. No characters, Omens, cards, text, letters, UI, logos, watermark, or literal culturally specific writing.

#### Asset 2

Use case: stylized-concept
Asset type: seamless tileable game UI material
Primary request: A 1024x1024 square seamless tileable dark charcoal basalt/slate material for a premium folklore mobile game.
Style/medium: Tactile matte painted stone surface, fine irregular grain and subtle worn scratches.
Composition/framing: Flat orthographic close-up of the material filling the entire square. Seamless edges in both directions. Even low contrast across the surface, suitable beneath 14px game text.
Lighting/mood: Uniform neutral dim lighting with no vignette or directional highlights.
Constraints: No large cracks, no repeating motifs, no objects, no text, no Sigils, no borders, no logos or watermark.
