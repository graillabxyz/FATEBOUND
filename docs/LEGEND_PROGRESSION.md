# Legend Journey

New profiles begin with Basajaun and Anansi, their curated Loadouts, sixteen shared Cards and six starter Omens. The other four Legends are inspectable but cannot be selected for play until owned. Ownership is checked by the profile service and the existing Loadout validator. Training opponents and internal lab content remain available for testing.

## Earned and early unlocks

| Route              | Requirement                     | Reward                                                      |
| ------------------ | ------------------------------- | ----------------------------------------------------------- |
| Starter collection | New profile                     | Basajaun + Anansi                                           |
| Legend Journey     | 5, 15, 30, 50 completed matches | One unowned Legend of the player's choice at each milestone |
| Coins              | 800 earned Coins                | Any unowned Legend                                          |
| Gems               | 300 Gems                        | Any unowned Legend                                          |

Wins, draws and losses count. Training counts. Abandoned/incomplete matches do not grant progress; internal simulations and lab matches do not invoke profile rewards. A completed match receipt cannot grant progress twice.

Normal acquisition grants only the permanent Legend. A playable Loadout is assembled from Cards and Omens already owned; the curated starter recipe is a future build goal. The earned 15-match milestone additionally grants the chosen Legend’s signature Omen, or one two-Card booster if that Omen is already owned. Unlocking never automatically changes the active Loadout. Buying early does not consume a milestone; if the entire roster is owned, each remaining earned milestone can be claimed for 200 Coins instead. Claims never expire and may be saved until a Legend is chosen.

The baseline gives all six Legends without spending currency by 50 matches. Coins can accelerate this, and no Legend is premium-exclusive. This is acquisition pacing, not a combat power upgrade: purchasing does not change a Legend's rules or stats. Prices and milestone thresholds are prototype economy tuning, not claims of measured optimal retention.

## Current scope and persistence

The playable game still uses `LocalProfileService`, explicitly a mock economy. Ownership, acquisition provenance, milestone receipts and unlock revision are stored on the current device. The Gems route spends the existing preview wallet; it does **not** accept money. No checkout, receipt verification, account synchronization or server-backed paid entitlements are claimed by this release.

Before accepting real payments, replace this acquisition adapter with an authenticated, transactional account service: deduplicate purchase receipts and match rewards, grant the same kit from trusted content, and verify payments server-side (including native-store receipts when applicable). Never trust a client-supplied wallet, match count or ownership list. Preserve the same user-facing earned route.

Existing explicitly recorded Legend ownership is retained. A missing collection version or ownership list no longer grants all six Legends. No acquired Cards, Omens, currencies or mastery are deliberately revoked.

## Omen progression and economy revision · 8 September

Signature Omens are independent collectibles: 600 Coins / 240 Gems, or play-earned choices at 10, 25, 45 and 70 matches. Once all six are owned, remaining choices grant one booster. Numbered Omens cost 120 Coins regardless of size. Two-Card boosters cost 160 Coins; regular earned boosters arrive every 10 matches and 800 Mastery XP, plus first-win and free Season Path rewards.

See [the full starter and economy audit](STARTER_ECONOMY_AUDIT.md) for 165,600 battle simulations, exact starter recipes, Card activation rates and before/after acquisition projections.

## Validation

`tests/legend-progression.test.ts` covers starter gating, all milestone boundaries, completed losses, duplicate receipts, identical single-Legend entitlements across currency routes, insufficient funds, stale unlock requests, existing entitlement migration, completing the whole roster for free, and all-owned compensation. Browser QA uses the actual collection, inspector and profile service for free, Coin and Gem acquisition, saved reload, and narrow mobile layouts. Combat rules remain mechanical version 7.
