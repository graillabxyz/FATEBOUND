# Complete alpha Card rules audit

Every Card has persistence `none`: resolve its ability; keep the reusable Card in Hand. All requirements and effects below are read from production version 6. Affinity controls equipping, independently from effect tags.

## 1. Crush

ID: crush · common · Might · ACTION

**Value 7+** — Deal 4 damage.

Legal Legends: Basajaun, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":4}]`

## 2. Root Ward

ID: root-ward · common · Wild OR Spirit · REACTION

**Value 1–3** — Gain 3 Ward.

Legal Legends: Basajaun, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"GUARD","amount":3}]`

## 3. Barkskin

ID: barkskin · uncommon · Wild OR Order · REACTION

**Value 4–6** — Gain 3 Ward. If this attack then damages your Life, deal 2 damage back.

Legal Legends: Basajaun, Tengu, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"GUARD","amount":3},{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"COUNTERSTRIKE","amount":2}]}]`

## 4. Herensuge

ID: herensuge · common · Might AND Wild · ACTION

**2 Values totaling 12+** — Deal 7 damage.

Legal Legends: Basajaun, Māui.

- Spend 2 Omens. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":7}]`

## 5. Deep Roots

ID: deep-roots · common · Wild OR Spirit · ACTION

**Value 2–4** — Heal 3 Life.

Legal Legends: Basajaun, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"HEAL","amount":3}]`

## 6. Oakheart

ID: oakheart · uncommon · Wild AND Might · ACTION

**Value 4+** — Gain 2 Ward. Empower your next damage effect by 2. Expires at the end of your next turn.

Legal Legends: Basajaun, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"GUARD","amount":2},{"type":"STATUS","status":"power","amount":2,"duration":1}]`

## 7. Thorn Return

ID: thorn-return · uncommon · Wild OR Shadow · REACTION

**Value 3–5 · Against an attack** — Against an attack: gain 2 Ward. If it then damages your Life, deal 3 damage back.

Legal Legends: Basajaun, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"GUARD","amount":2},{"type":"COUNTERSTRIKE","amount":3}]}]`

## 8. Fell the Axe

ID: fell-the-axe · common · Might OR Order · ACTION

**Value 5+** — Deal 3 damage. If you have Ward, deal 1 more.

Legal Legends: Basajaun, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":3},{"type":"CONDITIONAL","condition":"guarding","effects":[{"type":"DAMAGE","amount":1}]}]`

## 9. Sanctuary

ID: sanctuary · rare · Spirit · REACTION

**Ward Sigil** — Gain 6 Ward and cleanse all negative statuses.

Legal Legends: Basajaun, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"GUARD","amount":6},{"type":"CLEANSE"}]`

## 10. Silken Cut

ID: silken-cut · common · Unbound · ACTION

**Value 5+** — Deal 3 damage.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":3}]`

## 11. Read the Thread

ID: read-the-thread · uncommon · Guile OR Wisdom · REACTION

**Value 4+** — Deal 2 damage. If the enemy attacks, deal 2 more.

Legal Legends: Anansi, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":2},{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"DAMAGE","amount":2}]}]`

## 12. Web Shift

ID: web-shift · uncommon · Guile OR Chaos · REACTION

**Shift Sigil** — Redirect the declared enemy action back to its user.

Legal Legends: Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Redirect swaps this Action’s player targets, including healing. Its original user still pays its costs.

Effects: `[{"type":"REDIRECT"}]`

## 13. False Promise

ID: false-promise · uncommon · Guile · ACTION

**Value 3–5** — Deal 1 damage. If the enemy has Ward, deal 4 more.

Legal Legends: Anansi, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":1},{"type":"CONDITIONAL","condition":"enemyGuarding","effects":[{"type":"DAMAGE","amount":4}]}]`

## 14. Unravel

ID: unravel · uncommon · Guile AND Wisdom · REACTION

**Value exactly 3 · 1 Focus** — Cancel this Action. Its Omens stay spent.

Legal Legends: Anansi.

- Spend 1 Omen and 1 Focus. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"CANCEL"}]`

## 15. Borrowed Time

ID: borrowed-time · uncommon · Guile OR Order · ACTION

**Value 2–4** — Gain 2 Ward. Empower your next damage effect by 1. Expires at the end of your next turn.

Legal Legends: Anansi, Tengu, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"GUARD","amount":2},{"type":"STATUS","status":"power","amount":1,"duration":1}]`

## 16. Spider’s Patience

ID: spider-s-patience · common · Guile OR Shadow · ACTION

**Value 1–2** — Heal 3 Life.

Legal Legends: Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"HEAL","amount":3}]`

## 17. Story’s End

ID: story-s-end · rare · (Guile AND Might) OR (Guile AND Wisdom) · ACTION

**2 Values totaling 11+** — Deal 6 damage. Deal 1 more if an enemy card is known.

Legal Legends: Anansi, Māui.

- Spend 2 Omens. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":6},{"type":"CONDITIONAL","condition":"knownEnemy","effects":[{"type":"DAMAGE","amount":1}]}]`

## 18. Hidden Meaning

ID: hidden-meaning · common · Unbound · REACTION

**Any Omen face** — Gain 1 Ward. If this attack then damages your Life, deal 1 damage back.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"GUARD","amount":1},{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"COUNTERSTRIKE","amount":1}]}]`

## 19. Gale Cut

ID: gale-cut · common · Might OR Wisdom · ACTION

**Value 4–6** — Deal 3 damage.

Legal Legends: Basajaun, Anansi, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":3}]`

## 20. Perfect Riposte

ID: perfect-riposte · uncommon · Wisdom OR Order · REACTION

**Value 4–6 · Against an attack** — Against an attack: gain 2 Ward and deal 2 damage before it resolves.

Legal Legends: Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"GUARD","amount":2},{"type":"DAMAGE","amount":2}]`

## 21. Sky Sever

ID: sky-sever · mythic · Might AND Wisdom · ACTION

**2 Values totaling 11+** — Deal 6 damage.

Legal Legends: Tengu, Quetzalcoatl.

- Spend 2 Omens. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":6}]`

## 22. First Wind

ID: first-wind · common · Unbound · ACTION

**Value 2–4** — Deal 2 damage.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":2}]`

## 23. Still Mind

ID: still-mind · uncommon · Wisdom OR Spirit · ACTION

**Value 2–3** — Heal 2 Life and cleanse negative statuses.

Legal Legends: Basajaun, Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"HEAL","amount":2},{"type":"CLEANSE"}]`

## 24. Raven Wing

ID: raven-wing · rare · Guile OR Order · REACTION

**Redirect Sigil · Against an attack** — Prevent up to 4 damage from this Action.

Legal Legends: Anansi, Tengu, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"BLOCK_EFFECT","amount":4}]`

## 25. Peak Strike

ID: peak-strike · common · Might AND Wisdom · ACTION

**Value 7+** — Deal 4 damage.

Legal Legends: Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":4}]`

## 26. Windstep

ID: windstep · common · Unbound · ACTION

**Any Omen face** — Gain 1 Ward. Empower your next damage effect by 1. Expires at the end of your next turn.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"GUARD","amount":1},{"type":"STATUS","status":"power","amount":1,"duration":1}]`

## 27. Watchful Blade

ID: watchful-blade · rare · Wisdom OR Order · REACTION

**Value 5–7 · Against an attack** — Against an attack: deal 4 damage before it resolves.

Legal Legends: Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":4}]`

## 28. Mountain Silence

ID: mountain-silence · common · Spirit OR Order · REACTION

**Value 8+** — Gain 5 Ward.

Legal Legends: Basajaun, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"GUARD","amount":5}]`

## 29. Falling Leaf

ID: falling-leaf · common · Wild OR Wisdom · ACTION

**Value 1–2** — Deal 2 damage.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":2}]`

## 30. Branch Lash

ID: branch-lash · common · Wild · ACTION

**Value 6–8** — Deal 4 damage.

Legal Legends: Basajaun, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":4}]`

## 31. Moss Mantle

ID: moss-mantle · common · (Wild AND Spirit) OR Shadow · REACTION

**Value 1–3** — Gain 2 Ward and heal 1 Life.

Legal Legends: Basajaun, Leshy.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"GUARD","amount":2},{"type":"HEAL","amount":1}]`

## 32. Wolf Shape

ID: wolf-shape · common · Wild OR Shadow · ACTION

**Value 7+** — Deal 3 damage. If you were behind in Life, deal 2 more.

Legal Legends: Basajaun, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":3},{"type":"CONDITIONAL","condition":"behind","effects":[{"type":"DAMAGE","amount":2}]}]`

## 33. Lost Path

ID: lost-path · uncommon · Chaos OR Order · REACTION

**Value 4–6 · Against an attack** — Prevent up to 3 damage from this Action.

Legal Legends: Anansi, Tengu, Leshy.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"BLOCK_EFFECT","amount":3}]`

## 34. New Skin

ID: new-skin · uncommon · Wild OR Chaos · ACTION

**Value 3–5** — Heal 3 Life and cleanse negative statuses.

Legal Legends: Basajaun, Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"HEAL","amount":3},{"type":"CLEANSE"}]`

## 35. Bramble Counter

ID: bramble-trap · uncommon · Wild OR Guile · REACTION

**Value 2–4 · Against an attack** — Against an attack: gain 2 Ward. If this attack then damages your Life, deal 2 damage back.

Legal Legends: Basajaun, Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"GUARD","amount":2},{"type":"COUNTERSTRIKE","amount":2}]}]`

## 36. Wild Bloom

ID: wild-bloom · rare · Wild OR Spirit · ACTION

**Ward Sigil** — Heal 4 Life and gain 2 Ward.

Legal Legends: Basajaun, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"HEAL","amount":4},{"type":"GUARD","amount":2}]`

## 37. Crooked Bough

ID: crooked-bough · common · Wild OR Chaos · ACTION

**Value 3–4** — Deal 3 damage.

Legal Legends: Basajaun, Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":3}]`

## 38. Night Spores

ID: night-spores · rare · Shadow OR Chaos · ACTION

**Value 4–6** — Poison: at the start of the enemy’s next turn, they lose 2 Life once. Gain 1 Ward.

Legal Legends: Anansi, Leshy.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Poison appears beside the enemy Legend. At the start of their next turn they lose the stated Life once, then Poison disappears. This is Life loss, not an attack.

Effects: `[{"type":"STATUS","status":"poison","target":"enemy","amount":2,"duration":1},{"type":"GUARD","amount":1}]`

## 39. Sun Lance

ID: sun-lance · common · Might OR Spirit · ACTION

**Value 6+** — Deal 4 damage.

Legal Legends: Basajaun, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":4}]`

## 40. First Light

ID: first-light · common · Spirit OR Wisdom · ACTION

**Value 2–5** — Heal 1 Life. Empower your next damage effect by 2. Expires at the end of your next turn.

Legal Legends: Basajaun, Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"HEAL","amount":1},{"type":"STATUS","status":"power","amount":2,"duration":1}]`

## 41. Offering

ID: offering · mythic · Shadow OR Spirit · ACTION

**Any Omen face · 2 Life** — Spend 2 Life. Empower your next damage effect by 3. Expires at the end of your next turn.

Legal Legends: Basajaun, Leshy, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Pay 2 Life when declaring this ability, before the Reaction window. This cost is not refunded if canceled. You must have at least 1 Life left.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"STATUS","status":"power","amount":3,"duration":1}]`

## 42. Dawn Shield

ID: dawn-shield · common · Spirit OR Order · REACTION

**Value 4+** — Gain 2 Ward. If this attack then damages your Life, deal 1 damage back.

Legal Legends: Basajaun, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"GUARD","amount":2},{"type":"CONDITIONAL","condition":"enemyAttacking","effects":[{"type":"COUNTERSTRIKE","amount":1}]}]`

## 43. Open Sky

ID: open-sky · uncommon · Wisdom OR Order · REACTION

**Value 5–7 · Against an attack** — Prevent up to 2 damage from this Action. Gain 1 Ward.

Legal Legends: Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"BLOCK_EFFECT","amount":2},{"type":"GUARD","amount":1}]`

## 44. Burning Crown

ID: burning-crown · mythic · (Might AND Spirit) OR (Might AND Chaos) · ACTION

**Value 10+ · 2 Life** — Spend 2 Life to deal 7 damage.

Legal Legends: Basajaun, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Pay 2 Life when declaring this ability, before the Reaction window. This cost is not refunded if canceled. You must have at least 1 Life left.

Effects: `[{"type":"DAMAGE","amount":7}]`

## 45. Horizon

ID: horizon · rare · (Might AND Wisdom) OR Guile · ACTION

**Value 5+** — Deal 2 damage. If this is your third ability or later this round, deal 2 more.

Legal Legends: Anansi, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":2},{"type":"CONDITIONAL","condition":"threeActions","effects":[{"type":"DAMAGE","amount":2}]}]`

## 46. Daring Feint

ID: daring-feint · uncommon · Guile OR Might · ACTION

**Value 3–5** — Deal 2 damage. If another Omen is unused, deal 1 more.

Legal Legends: Basajaun, Anansi, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":2},{"type":"CONDITIONAL","condition":"unusedDie","effects":[{"type":"DAMAGE","amount":1}]}]`

## 47. Turnabout

ID: turnabout · uncommon · Guile OR Shadow · REACTION

**Value 3–5** — Gain 2 Ward. If you were behind in Life and this attack damages your Life, deal 3 damage back.

Legal Legends: Anansi, Leshy, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"GUARD","amount":2},{"type":"CONDITIONAL","condition":"behind","effects":[{"type":"COUNTERSTRIKE","amount":3}]}]`

## 48. Rising Tide

ID: rising-tide · common · Spirit OR Wild · ACTION

**Value 2–4** — Heal 2 Life. If you were behind in Life, heal 1 more.

Legal Legends: Basajaun, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"HEAL","amount":2},{"type":"CONDITIONAL","condition":"behind","effects":[{"type":"HEAL","amount":1}]}]`

## 49. Island Pull

ID: island-pull · common · Might · ACTION

**Value 8+** — Deal 5 damage.

Legal Legends: Basajaun, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":5}]`

## 50. Bold Wager

ID: bold-wager · uncommon · Shadow OR Chaos · ACTION

**Any Omen face · 1 Life** — Spend 1 Life. Empower your next damage effect by 2. Expires at the end of your next turn.

Legal Legends: Anansi, Leshy.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Pay 1 Life when declaring this ability, before the Reaction window. This cost is not refunded if canceled. You must have at least 1 Life left.
- Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.

Effects: `[{"type":"STATUS","status":"power","amount":2,"duration":1}]`

## 51. Wavebreaker

ID: wavebreaker · rare · (Might AND Spirit) OR (Might AND Guile) · ACTION

**Value 5–6** — Convert up to 3 Ward into damage, then deal 2 damage.

Legal Legends: Basajaun, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"CONVERT","from":"guard","amount":3,"effects":[{"type":"DAMAGE","amount":1}]},{"type":"DAMAGE","amount":2}]`

## 52. Against the Current

ID: against-the-current · common · Guile OR Order · ACTION

**Value 4+** — Deal 2 damage. If the enemy has Ward, deal 2 more.

Legal Legends: Anansi, Tengu, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.

Effects: `[{"type":"DAMAGE","amount":2},{"type":"CONDITIONAL","condition":"enemyGuarding","effects":[{"type":"DAMAGE","amount":2}]}]`

## 53. Quick Strike

ID: quick-strike · common · Unbound · ACTION

**Value 1–3** — Deal 2 damage.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":2}]`

## 54. Web Turn

ID: web-turn · common · Guile OR Wisdom · REACTION

**Value exactly 6** — Redirect the declared enemy action back to its user.

Legal Legends: Anansi, Tengu, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Redirect swaps this Action’s player targets, including healing. Its original user still pays its costs.

Effects: `[{"type":"REDIRECT"}]`

## 55. Precision Cut

ID: precision-cut · common · Might AND Wisdom · ACTION

**Value exactly 5** — Deal 3 damage; ignore 1 Ward.

Legal Legends: Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"DAMAGE","amount":3,"guardPierce":1}]`

## 56. Counterstrike

ID: counterstrike · common · Unbound · REACTION

**Value 8+ · Against an attack** — If this attack damages your Life, deal 4 damage back.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.

Effects: `[{"type":"COUNTERSTRIKE","amount":4}]`

## 57. Ritual

ID: ritual · mythic · (Spirit AND Wisdom) OR (Wild AND Chaos) · ACTION

**2 Values totaling exactly 10** — Heal 5 Life and gain 3 Ward.

Legal Legends: Leshy, Quetzalcoatl.

- Spend 2 Omens. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.
- Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.

Effects: `[{"type":"HEAL","amount":5},{"type":"GUARD","amount":3}]`

## 58. Meditate

ID: meditate · common · Unbound · ACTION

**Value 2–5** — Gain 1 Focus.

Legal Legends: Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl, Māui.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"GAIN_CONTROL","amount":1}]`

## 59. Hollow Sign

ID: hollow-sign · rare · Chaos OR Shadow · ACTION

**Void · 1 other unused Omen** — Flip your first other available or Held Omen.

Legal Legends: Anansi, Leshy.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"FLIP_DIE","target":"self","omenTarget":"unspent"}]`

## 60. Thread the Path

ID: thread-the-path · uncommon · Wisdom · REACTION

**Value exactly 5** — Shift the first Omen paying for the enemy Action down by 1. Recheck its requirement.

Legal Legends: Anansi, Tengu, Quetzalcoatl.

- Spend 1 Omen. All paid Omens become Spent, even if the ability is stopped.
- Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.
- First use permanently reveals this Card to your opponent.

Effects: `[{"type":"SHIFT_DIE","target":"enemy","direction":-1}]`
