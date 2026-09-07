/** Artwork is cosmetic content, separate from activation rules and Affinity access. */
export type CardArtwork = { src: string; alt: string; objectPosition: string };
export const CARD_ART: Record<string, CardArtwork> = {
  crush: {
    src: "/art/cards/crush.webp",
    alt: "A massive stone-headed war hammer shatters basalt in a decisive downward blow.",
    objectPosition: "50% 50%",
  },
  "root-ward": {
    src: "/art/cards/root-ward.webp",
    alt: "Living roots weave into a dense curved shield before an incoming spear, protection forming in a rain-dark forest.",
    objectPosition: "50% 50%",
  },
  barkskin: {
    src: "/art/cards/barkskin.webp",
    alt: "A warrior's forearm becomes layered bark armor; an attacking blade hits it and sharp splinters spring back toward the attacker.",
    objectPosition: "50% 50%",
  },
  herensuge: {
    src: "/art/cards/herensuge.webp",
    alt: "An immense ancient serpentine dragon unleashes a focused fiery blast across a mountain ravine, overwhelming finishing force, no gore.",
    objectPosition: "50% 50%",
  },
  "deep-roots": {
    src: "/art/cards/deep-roots.webp",
    alt: "Warm healing light rises from deep tree roots into a wounded traveler's cupped hands at the base of an old tree, restoration.",
    objectPosition: "50% 50%",
  },
  oakheart: {
    src: "/art/cards/oakheart.webp",
    alt: "An amber-lit living oak heart within a bark chestplate, protective roots coiling around it and a gathered pulse of strength.",
    objectPosition: "50% 50%",
  },
  "thorn-return": {
    src: "/art/cards/thorn-return.webp",
    alt: "A thorny living shield catches a sword blow and lashes sharp brambles back toward the attack, one clear close-up defensive counter.",
    objectPosition: "50% 50%",
  },
  "fell-the-axe": {
    src: "/art/cards/fell-the-axe.webp",
    alt: "A warrior sheltered behind a translucent protective barrier brings down a heavy iron axe, controlled follow-through and bright sparks.",
    objectPosition: "50% 50%",
  },
  sanctuary: {
    src: "/art/cards/sanctuary.webp",
    alt: "A traveler sheltered within a luminous ring of ancient standing stones, dark curse-like smoke dissolving outward, profound protection and cleansing.",
    objectPosition: "50% 50%",
  },
  "silken-cut": {
    src: "/art/cards/silken-cut.webp",
    alt: "A taut strand of silver silk slices cleanly through a reed stalk, a gloved hand drawing the thread, tiny precise physical attack.",
    objectPosition: "50% 50%",
  },
  "read-the-thread": {
    src: "/art/cards/read-the-thread.webp",
    alt: "A watchful hand follows glowing threads that trace the path of an approaching blade, seeing the attack before it arrives.",
    objectPosition: "50% 50%",
  },
  "web-shift": {
    src: "/art/cards/web-shift.webp",
    alt: "A web of luminous silk bends an incoming bronze spear in a sweeping arc back toward the distant figure who threw it, redirection.",
    objectPosition: "50% 50%",
  },
  "false-promise": {
    src: "/art/cards/false-promise.webp",
    alt: "A beautiful hollow golden mask cracks against a protective barrier, revealing a hidden jagged dagger aimed through the fractured Ward.",
    objectPosition: "50% 50%",
  },
  unravel: {
    src: "/art/cards/unravel.webp",
    alt: "Careful fingers pull one golden thread from a tightly woven magical attack, causing the whole incoming spell to unravel into harmless loose strands.",
    objectPosition: "50% 50%",
  },
  "borrowed-time": {
    src: "/art/cards/borrowed-time.webp",
    alt: "A cracked ancient hourglass suspended inside a thin protective shell, a few golden grains gathering into a future burst of strength.",
    objectPosition: "50% 50%",
  },
  "spider-s-patience": {
    src: "/art/cards/spider-s-patience.webp",
    alt: "A small patient spider repairing dew-covered silk above a traveler's healing hands, calm restorative stillness, no threatening bite.",
    objectPosition: "50% 50%",
  },
  "story-s-end": {
    src: "/art/cards/story-s-end.webp",
    alt: "A weathered storyteller's scroll curls into a powerful shadow serpent delivering a final strike, closing a known tale, no readable writing.",
    objectPosition: "50% 50%",
  },
  "hidden-meaning": {
    src: "/art/cards/hidden-meaning.webp",
    alt: "A small woven protective charm reveals a concealed thorn as an incoming blade touches it, modest defense with a hidden returning sting.",
    objectPosition: "50% 50%",
  },
  "gale-cut": {
    src: "/art/cards/gale-cut.webp",
    alt: "A sharp crescent of wind from a sword sweeps through windblown leaves on a mountain path, clean decisive cut.",
    objectPosition: "50% 50%",
  },
  "perfect-riposte": {
    src: "/art/cards/perfect-riposte.webp",
    alt: "Two sword blades meet in a precise close-up parry, defender's blade gliding along the attack toward an immediate answering strike.",
    objectPosition: "50% 50%",
  },
  "sky-sever": {
    src: "/art/cards/sky-sever.webp",
    alt: "An immense narrow sword arc parts storm clouds above jagged mountains, a forceful sky-cleaving finishing attack.",
    objectPosition: "50% 50%",
  },
  "first-wind": {
    src: "/art/cards/first-wind.webp",
    alt: "A young traveler's short blade cuts through a small fresh gust of leaves, quick simple opening strike at dawn.",
    objectPosition: "50% 50%",
  },
  "still-mind": {
    src: "/art/cards/still-mind.webp",
    alt: "A seated traveler beside a still mountain pool, dark mist lifting from their shoulders as a soft restorative glow reflects on water.",
    objectPosition: "50% 50%",
  },
  "raven-wing": {
    src: "/art/cards/raven-wing.webp",
    alt: "A broad dark raven wing sweeps between a traveler and an incoming blade, feathers catching the impact and deflecting it.",
    objectPosition: "50% 50%",
  },
  "peak-strike": {
    src: "/art/cards/peak-strike.webp",
    alt: "A spear point descends from a high rocky ledge toward a shattered stone target, concentrated mountain-top precision and force.",
    objectPosition: "50% 50%",
  },
  windstep: {
    src: "/art/cards/windstep.webp",
    alt: "A light-footed fighter takes a swift step wrapped in a small protective swirl of wind, strength gathering around their next poised strike.",
    objectPosition: "50% 50%",
  },
  "watchful-blade": {
    src: "/art/cards/watchful-blade.webp",
    alt: "A disciplined swordsman waits motionless with blade angled toward an approaching shadow, sudden bright answering cut before the attack lands.",
    objectPosition: "50% 50%",
  },
  "mountain-silence": {
    src: "/art/cards/mountain-silence.webp",
    alt: "A traveler stands protected within a dense stone-like translucent barrier while a mountain storm breaks harmlessly around it.",
    objectPosition: "50% 50%",
  },
  "falling-leaf": {
    src: "/art/cards/falling-leaf.webp",
    alt: "A single copper autumn leaf rides the edge of a quick low sword cut, delicate economical strike in a forest clearing.",
    objectPosition: "50% 50%",
  },
  "branch-lash": {
    src: "/art/cards/branch-lash.webp",
    alt: "A long living branch whips sharply across a forest path, bark and leaves trailing along a powerful focused lash.",
    objectPosition: "50% 50%",
  },
  "moss-mantle": {
    src: "/art/cards/moss-mantle.webp",
    alt: "A mantle of lush moss wraps a traveler's shoulders into soft protective layers while small warm lights mend a scraped arm.",
    objectPosition: "50% 50%",
  },
  "wolf-shape": {
    src: "/art/cards/wolf-shape.webp",
    alt: "A battered forest wanderer transforms into a fierce wolf mid-leap, recovering strength for a desperate counteroffensive, no gore.",
    objectPosition: "50% 50%",
  },
  "lost-path": {
    src: "/art/cards/lost-path.webp",
    alt: "An incoming strike loses its way among twisting forest paths and misleading shadows, a protected traveler slipping safely aside.",
    objectPosition: "50% 50%",
  },
  "new-skin": {
    src: "/art/cards/new-skin.webp",
    alt: "Old cracked bark peels away from a forest spirit to reveal fresh healthy wood beneath, dark blight crumbling off in renewal.",
    objectPosition: "50% 50%",
  },
  "bramble-trap": {
    src: "/art/cards/bramble-trap.webp",
    alt: "A defender braces behind a quickly raised bramble shield; an enemy blade makes contact and a thorny vine lashes back. Show an immediate defensive counter, not a planted trap or creature summon.",
    objectPosition: "50% 50%",
  },
  "wild-bloom": {
    src: "/art/cards/wild-bloom.webp",
    alt: "Luminous wildflowers bloom across protective vines around a wounded traveler, healing light and a living shield together.",
    objectPosition: "50% 50%",
  },
  "crooked-bough": {
    src: "/art/cards/crooked-bough.webp",
    alt: "A twisted gnarled bough snaps forward in an unexpected crooked angle, striking a wooden practice target, unruly forest force.",
    objectPosition: "50% 50%",
  },
  "night-spores": {
    src: "/art/cards/night-spores.webp",
    alt: "Soft violet poisonous spores drift from nocturnal mushrooms toward a distant silhouette, with a small sheltering fungal cap in foreground.",
    objectPosition: "50% 50%",
  },
  "sun-lance": {
    src: "/art/cards/sun-lance.webp",
    alt: "A brilliant lance of warm sunlight pierces through dark clouds toward a cracked stone target, focused solar attack.",
    objectPosition: "50% 50%",
  },
  "first-light": {
    src: "/art/cards/first-light.webp",
    alt: "First dawn light touches a traveler's bruised hand and gathers into a small golden spark above their poised weapon, healing and preparation.",
    objectPosition: "50% 50%",
  },
  offering: {
    src: "/art/cards/offering.webp",
    alt: "A traveler offers a small red life-like ember from their palm into an ancient stone bowl, their weapon answering with restrained powerful light; sacrifice without gore.",
    objectPosition: "50% 50%",
  },
  "dawn-shield": {
    src: "/art/cards/dawn-shield.webp",
    alt: "A round shield of sunrise light catches an incoming arrow and throws a narrow ray back along its path, warm defensive counter.",
    objectPosition: "50% 50%",
  },
  "open-sky": {
    src: "/art/cards/open-sky.webp",
    alt: "Clouds open into a clear blue vault that disperses an incoming dark bolt above a traveler, a thin luminous shield remains.",
    objectPosition: "50% 50%",
  },
  "burning-crown": {
    src: "/art/cards/burning-crown.webp",
    alt: "A crown of living solar fire burns above a warrior's bowed head, a red ember drawn from their chest into an immense outward blast; costly power without gore.",
    objectPosition: "50% 50%",
  },
  horizon: {
    src: "/art/cards/horizon.webp",
    alt: "Three successive arcs of a practiced weapon stroke meet along a glowing horizon, a rising final attack after earlier movements.",
    objectPosition: "50% 50%",
  },
  "daring-feint": {
    src: "/art/cards/daring-feint.webp",
    alt: "A fighter makes a misleading shallow blade thrust while keeping a second small weapon visibly unused in the other hand, cunning reserve and opportunity.",
    objectPosition: "50% 50%",
  },
  turnabout: {
    src: "/art/cards/turnabout.webp",
    alt: "A battered defender catches a blow on a cracked shield while pivoting into a returning strike, a reversal from a losing position.",
    objectPosition: "50% 50%",
  },
  "rising-tide": {
    src: "/art/cards/rising-tide.webp",
    alt: "Gentle turquoise tide rises around an exhausted island traveler, luminous water mending their wounds and lifting their stance.",
    objectPosition: "50% 50%",
  },
  "island-pull": {
    src: "/art/cards/island-pull.webp",
    alt: "A colossal ancient carved fishhook hauls a heavy stone island upward through the sea, explosive physical force and crashing spray.",
    objectPosition: "50% 50%",
  },
  "bold-wager": {
    src: "/art/cards/bold-wager.webp",
    alt: "A daring hand lays a single red life ember beside weathered carved bones, golden power gathering around a waiting fist, risk traded for future strength.",
    objectPosition: "50% 50%",
  },
  wavebreaker: {
    src: "/art/cards/wavebreaker.webp",
    alt: "A protective wall of turquoise water shatters forward into a spear-like surge, the shield itself becoming the attack.",
    objectPosition: "50% 50%",
  },
  "against-the-current": {
    src: "/art/cards/against-the-current.webp",
    alt: "A determined spear thrust drives upstream through a rushing protective water barrier, an opportunistic attack that grows stronger against defense.",
    objectPosition: "50% 50%",
  },
  "quick-strike": {
    src: "/art/cards/quick-strike.webp",
    alt: "A plain short bronze blade flashes in one fast economical strike against a hanging rope, simple universally useful technique.",
    objectPosition: "50% 50%",
  },
  "web-turn": {
    src: "/art/cards/web-turn.webp",
    alt: "Silken strands catch an incoming luminous attack and guide it around in a tight return loop toward its caster, clear magical redirection.",
    objectPosition: "50% 50%",
  },
  "precision-cut": {
    src: "/art/cards/precision-cut.webp",
    alt: "An expertly placed thin blade slips through a tiny seam in a heavy shield, exact controlled cut that bypasses protection.",
    objectPosition: "50% 50%",
  },
  counterstrike: {
    src: "/art/cards/counterstrike.webp",
    alt: "A fighter recoils from a glancing blow then immediately answers with a compact strong punch, resilience and post-impact retaliation, no gore.",
    objectPosition: "50% 50%",
  },
  ritual: {
    src: "/art/cards/ritual.webp",
    alt: "Two smooth Omen stones sit within an ancient ritual circle around a traveler; healing light rises and a strong protective veil forms, no writing or interface symbols.",
    objectPosition: "50% 50%",
  },
  meditate: {
    src: "/art/cards/meditate.webp",
    alt: "Calm hands hold two plain faceted Omen stones above still water, attention gathering as small neutral light points, deliberate focus.",
    objectPosition: "50% 50%",
  },
  "hollow-sign": {
    src: "/art/cards/hollow-sign.webp",
    alt: "A dark empty faceted Omen turns in a traveler's hand while another carved Omen rotates to its opposite side, void-inspired manipulation, no UI or floating icons.",
    objectPosition: "50% 50%",
  },
  "thread-the-path": {
    src: "/art/cards/thread-the-path.webp",
    alt: "A fine luminous thread tugs one physical Omen within an incoming spell down by a small precise turn, causing the structured spell to falter.",
    objectPosition: "50% 50%",
  },
};
