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

Every acquisition route grants the same permanent Legend and its curated four-Card Hand and three-Omens kit (one signature + two numbered). Shared items already owned are deduplicated. Unlocking never automatically changes the active Loadout. Buying early does not consume a milestone; if the entire roster is owned, each remaining earned milestone can be claimed for 200 Coins instead. Claims never expire and may be saved until a Legend is chosen.

The baseline gives all six Legends without spending currency by 50 matches. Coins can accelerate this, and no Legend is premium-exclusive. This is acquisition pacing, not a combat power upgrade: purchasing does not change a Legend's rules or stats. Prices and milestone thresholds are prototype economy tuning, not claims of measured optimal retention.

## Current scope and persistence

The playable game still uses `LocalProfileService`, explicitly a mock economy. Ownership, acquisition provenance, milestone receipts and unlock revision are stored on the current device. The Gems route spends the existing preview wallet; it does **not** accept money. No checkout, receipt verification, account synchronization or server-backed paid entitlements are claimed by this release.

Before accepting real payments, replace this acquisition adapter with an authenticated, transactional account service: deduplicate purchase receipts and match rewards, grant the same kit from trusted content, and verify payments server-side (including native-store receipts when applicable). Never trust a client-supplied wallet, match count or ownership list. Preserve the same user-facing earned route.

Existing explicitly recorded Legend ownership is retained. A missing collection version or ownership list no longer grants all six Legends. No acquired Cards, Omens, currencies or mastery are deliberately revoked.

## Validation

`tests/legend-progression.test.ts` covers starter gating, all milestone boundaries, completed losses, duplicate receipts, identical kits across currency routes, insufficient funds, stale unlock requests, existing entitlement migration, completing the whole roster for free, and all-owned compensation. Browser QA uses the actual collection, inspector and profile service for free, Coin and Gem acquisition, saved reload, and narrow mobile layouts. Combat rules remain mechanical version 7.
