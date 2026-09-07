# Battle table and collectible emotes

The presentation follows mechanical version 4 unchanged: fixed loadouts, private reusable Hand, opening 1/2/3/3 roll choices, fixed turn order and owner-turn Held Omen expiry. All selection and activation eligibility use the production validator. Damage events now include optional target and actual Ward absorbed for cosmetic achievement accounting; resolution math is unchanged.

## Battle presentation

Compact framed avatar/name/rank identity sits above a prominent Legend portrait and Life numeral. Initiative, Ward, Held resources and statuses remain visible. Phase emphasis differentiates own turn, opponent turn, reaction, locked and resolving. Card activation/reveal and Omen rolling, settling, Shift, Flip, Sigil, Void, Held and spent states use short CSS motion. Ward updates before a delayed Life decrease when both change together; healing has separate feedback. These delays never delay authoritative state.

Cards select on tap; press-and-hold or their keyboard-accessible inspection button opens full rules. The portrait table retains a fixed Hand zone at standard phone heights. Short displays scroll the whole table without covering Card rules. Existing art and correct polyhedral Omen geometry are reused. Reduced Motion, SFX volume and Haptics Off apply to feedback. Browser haptics depend on platform support; native physical feedback still needs device verification.

## Cosmetic collection

`src/content/emotes.ts` defines the catalog, source metadata, five default emotes, five equip slots and timing. Cooldown is 4 seconds, bubbles last 2.6 seconds. Text, icon and simple animation are implemented; sticker and animation-asset fields reserve future rendering support. Profile → Emotes displays all/owned/locked inventory independently of equipped slots. Shop → Emotes and Bundles use the current local cosmetic economy.

Season Path contains free emotes at tiers 4, 12 and 40, with a premium tier 25 emote. Achievement progress grants first local ranked win, 500 actual Ward absorbed, and 100 local ranked Basajaun wins. Basajaun Mastery 10 and local Mythic rank grant separate prestige rewards. Existing claimed pass rewards migrate to their new emote grants once. The future event item remains explicitly locked; no live event or real-money purchase is implied.

The match snapshots the equipped emote set. Sending never changes battle state, pauses combat or accepts unrestricted text. Opponent mute is available in battle; the default preference is under Settings. Emotes remain available on the result screen without forcing a social interaction. An urgent Reaction closes the picker.

## Current service boundary

The player UI still uses its existing device-local profile, economy and AI match service. Emote ownership/progression is saved on this device, and replies are clearly labeled AI practice. `EmoteTransport` separates the cosmetic delivery boundary for a future network adapter. Human multiplayer delivery and server-backed cosmetic inventory are not implemented or represented as live. A network adapter must validate ownership, equipped slots and cooldown server-side; emotes must stay separate from mechanical inventory and commands.

## Verification

116 automated tests pass, including profile migration, earned versus purchasable sources, five-slot ownership, pass/purchase idempotence, reward thresholds, preset-only transport, cooldown/expiry and measured Ward events. Existing all-36-matchup replays and paired-seat invariance tests pass. Browser playthrough covered Action, Held Reaction, Life loss, reveal memory, completion and social interaction; subsequent passes fixed card tap interception, compressed art, short-screen overflow and picker placement. TypeScript, production release exclusions, Vercel ESM smoke checks and internal/Edge builds pass. Physical mobile device performance and human multiplayer are separate unverified release gates.
