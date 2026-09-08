import type { CardDef } from "../engine/types";
export const ALPHA_CARDS = [
  {
    id: "crush",
    name: "Crush",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 7,
    },
    text: "Deal 4 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 4,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 0,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      affinity: "might",
    },
    set: "first-light",
    collectorNumber: 1,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "root-ward",
    name: "Root Ward",
    category: "Ward",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 1,
      max: 3,
    },
    text: "Gain 3 Ward.",
    effects: [
      {
        type: "GUARD",
        amount: 3,
      },
    ],
    priority: 20,
    archetype: "Ward",
    artIndex: 0,
    tags: ["ward", "reaction", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 2,
    balanceMetadata: {
      intent: "Ward option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "barkskin",
    name: "Barkskin",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 4,
      max: 6,
    },
    text: "Gain 3 Ward. If this attack then damages your Life, deal 2 damage back.",
    effects: [
      {
        type: "GUARD",
        amount: 3,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "COUNTERSTRIKE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 0,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 3,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "herensuge",
    name: "Herensuge",
    category: "Finisher",
    timing: "ACTION",
    requirement: {
      count: 2,
      min: 12,
    },
    text: "Deal 7 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 7,
      },
    ],
    priority: 40,
    archetype: "Finisher",
    artIndex: 0,
    tags: ["finisher", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wild",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 4,
    balanceMetadata: {
      intent: "Finisher option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "deep-roots",
    name: "Deep Roots",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 4,
    },
    text: "Heal 3 Life.",
    effects: [
      {
        type: "HEAL",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 0,
    tags: ["recovery", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 5,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "oakheart",
    name: "Oakheart",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 4,
    },
    text: "Gain 2 Ward. Empower your next damage effect by 2. Expires at the end of your next turn.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "STATUS",
        status: "power",
        amount: 2,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 0,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      allOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "might",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 6,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "thorn-return",
    name: "Thorn Return",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 5,
      condition: "enemyAttacking",
    },
    text: "Against an attack: gain 2 Ward. If it then damages your Life, deal 3 damage back.",
    effects: [
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "GUARD",
            amount: 2,
          },
          {
            type: "COUNTERSTRIKE",
            amount: 3,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 0,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "shadow",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 7,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "fell-the-axe",
    name: "Fell the Axe",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 5,
    },
    text: "Deal 3 damage. If you have Ward, deal 1 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
      },
      {
        type: "CONDITIONAL",
        condition: "guarding",
        effects: [
          {
            type: "DAMAGE",
            amount: 1,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 0,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "might",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 8,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "sanctuary",
    name: "Sanctuary",
    category: "Ward",
    timing: "REACTION",
    requirement: {
      count: 1,
      symbol: "guard",
    },
    text: "Gain 6 Ward and cleanse all negative statuses.",
    effects: [
      {
        type: "GUARD",
        amount: 6,
      },
      {
        type: "CLEANSE",
      },
    ],
    priority: 20,
    archetype: "Ward",
    artIndex: 0,
    tags: ["ward", "reaction"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      allOf: [
        {
          affinity: "spirit",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 9,
    balanceMetadata: {
      intent: "Ward option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "silken-cut",
    name: "Silken Cut",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 5,
    },
    text: "Deal 3 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 1,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 10,
    balanceMetadata: {
      intent: "Attack option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "read-the-thread",
    name: "Read the Thread",
    category: "Prediction",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 4,
    },
    text: "Deal 2 damage. If the enemy attacks, deal 2 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "DAMAGE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Prediction",
    artIndex: 1,
    tags: ["prediction", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 11,
    balanceMetadata: {
      intent: "Prediction option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "web-shift",
    name: "Web Shift",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      symbol: "swap",
    },
    text: "Redirect the declared enemy action back to its user.",
    effects: [
      {
        type: "REDIRECT",
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 1,
    tags: ["manipulation", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 12,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "false-promise",
    name: "False Promise",
    category: "Prediction",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 5,
    },
    text: "Deal 1 damage. If the enemy has Ward, deal 4 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 1,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyGuarding",
        effects: [
          {
            type: "DAMAGE",
            amount: 4,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Prediction",
    artIndex: 1,
    tags: ["prediction", "action"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      affinity: "guile",
    },
    set: "first-light",
    collectorNumber: 13,
    balanceMetadata: {
      intent: "Prediction option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "unravel",
    name: "Unravel",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      exact: 3,
      min: 3,
      max: 3,
      control: 1,
    },
    text: "Cancel this Action. Its Omens stay spent.",
    effects: [
      {
        type: "CANCEL",
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 1,
    tags: ["manipulation", "reaction", "low-value"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      allOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "wisdom",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 14,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "borrowed-time",
    name: "Borrowed Time",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 4,
    },
    text: "Gain 2 Ward. Empower your next damage effect by 1. Expires at the end of your next turn.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "STATUS",
        status: "power",
        amount: 1,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 1,
    tags: ["setup", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 15,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "spider-s-patience",
    name: "Spider’s Patience",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 1,
      max: 2,
    },
    text: "Heal 3 Life.",
    effects: [
      {
        type: "HEAL",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 1,
    tags: ["recovery", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "shadow",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 16,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "story-s-end",
    name: "Story’s End",
    category: "Finisher",
    timing: "ACTION",
    requirement: {
      count: 2,
      min: 11,
    },
    text: "Deal 6 damage. Deal 1 more if an enemy card is known.",
    effects: [
      {
        type: "DAMAGE",
        amount: 6,
      },
      {
        type: "CONDITIONAL",
        condition: "knownEnemy",
        effects: [
          {
            type: "DAMAGE",
            amount: 1,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Finisher",
    artIndex: 1,
    tags: ["finisher", "action"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "guile",
            },
            {
              affinity: "might",
            },
          ],
        },
        {
          allOf: [
            {
              affinity: "guile",
            },
            {
              affinity: "wisdom",
            },
          ],
        },
      ],
    },
    set: "first-light",
    collectorNumber: 17,
    balanceMetadata: {
      intent: "Finisher option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "hidden-meaning",
    name: "Hidden Meaning",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      any: true,
    },
    text: "Gain 1 Ward. If this attack then damages your Life, deal 1 damage back.",
    effects: [
      {
        type: "GUARD",
        amount: 1,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "COUNTERSTRIKE",
            amount: 1,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 1,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 18,
    balanceMetadata: {
      intent: "Counter option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "gale-cut",
    name: "Gale Cut",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 4,
      max: 6,
    },
    text: "Deal 3 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 2,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 19,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "perfect-riposte",
    name: "Perfect Riposte",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 4,
      max: 6,
      condition: "enemyAttacking",
    },
    text: "Against an attack: gain 2 Ward and deal 2 damage before it resolves.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "DAMAGE",
        amount: 2,
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 2,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wisdom",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 20,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "sky-sever",
    name: "Sky Sever",
    category: "Finisher",
    timing: "ACTION",
    requirement: {
      count: 2,
      min: 11,
    },
    text: "Deal 6 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 6,
      },
    ],
    priority: 40,
    archetype: "Finisher",
    artIndex: 2,
    tags: ["finisher", "action"],
    mechanicalVersion: 8,
    rarity: "mythic",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 21,
    balanceMetadata: {
      intent: "Finisher option; overlapping Affinity access",
      complexity: 4,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "first-wind",
    name: "First Wind",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 4,
    },
    text: "Deal 2 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 2,
    tags: ["attack", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 22,
    balanceMetadata: {
      intent: "Attack option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "still-mind",
    name: "Still Mind",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 3,
    },
    text: "Heal 2 Life and cleanse negative statuses.",
    effects: [
      {
        type: "HEAL",
        amount: 2,
      },
      {
        type: "CLEANSE",
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 2,
    tags: ["recovery", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wisdom",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 23,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "raven-wing",
    name: "Raven Wing",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      symbol: "redirect",
      condition: "enemyAttacking",
    },
    text: "Prevent up to 4 damage from this Action.",
    effects: [
      {
        type: "BLOCK_EFFECT",
        amount: 4,
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 2,
    tags: ["manipulation", "reaction"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 24,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "peak-strike",
    name: "Peak Strike",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 7,
    },
    text: "Deal 4 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 4,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 2,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 25,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "windstep",
    name: "Windstep",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      any: true,
    },
    text: "Gain 1 Ward. Empower your next damage effect by 1. Expires at the end of your next turn.",
    effects: [
      {
        type: "GUARD",
        amount: 1,
      },
      {
        type: "STATUS",
        status: "power",
        amount: 1,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 2,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 26,
    balanceMetadata: {
      intent: "Setup option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "watchful-blade",
    name: "Watchful Blade",
    category: "Prediction",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 5,
      max: 7,
      condition: "enemyAttacking",
    },
    text: "Against an attack: deal 4 damage before it resolves.",
    effects: [
      {
        type: "DAMAGE",
        amount: 4,
      },
    ],
    priority: 20,
    archetype: "Prediction",
    artIndex: 2,
    tags: ["prediction", "reaction"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 27,
    balanceMetadata: {
      intent: "Prediction option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "mountain-silence",
    name: "Mountain Silence",
    category: "Ward",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 8,
    },
    text: "Gain 5 Ward.",
    effects: [
      {
        type: "GUARD",
        amount: 5,
      },
    ],
    priority: 20,
    archetype: "Ward",
    artIndex: 2,
    tags: ["ward", "reaction"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "spirit",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 28,
    balanceMetadata: {
      intent: "Ward option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "falling-leaf",
    name: "Falling Leaf",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 1,
      max: 2,
    },
    text: "Deal 2 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 2,
    tags: ["attack", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 29,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "branch-lash",
    name: "Branch Lash",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 6,
      max: 8,
    },
    text: "Deal 4 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 4,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 3,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      affinity: "wild",
    },
    set: "first-light",
    collectorNumber: 30,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "moss-mantle",
    name: "Moss Mantle",
    category: "Ward",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 1,
      max: 3,
    },
    text: "Gain 2 Ward and heal 1 Life.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "HEAL",
        amount: 1,
      },
    ],
    priority: 20,
    archetype: "Ward",
    artIndex: 3,
    tags: ["ward", "reaction", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "wild",
            },
            {
              affinity: "spirit",
            },
          ],
        },
        {
          affinity: "shadow",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 31,
    balanceMetadata: {
      intent: "Ward option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "wolf-shape",
    name: "Wolf Shape",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 7,
    },
    text: "Deal 3 damage. If you were behind in Life, deal 2 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
      },
      {
        type: "CONDITIONAL",
        condition: "behind",
        effects: [
          {
            type: "DAMAGE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 3,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "shadow",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 32,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "lost-path",
    name: "Lost Path",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 4,
      max: 6,
      condition: "enemyAttacking",
    },
    text: "Prevent up to 3 damage from this Action.",
    effects: [
      {
        type: "BLOCK_EFFECT",
        amount: 3,
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 3,
    tags: ["manipulation", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "chaos",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 33,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "new-skin",
    name: "New Skin",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 5,
    },
    text: "Heal 3 Life and cleanse negative statuses.",
    effects: [
      {
        type: "HEAL",
        amount: 3,
      },
      {
        type: "CLEANSE",
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 3,
    tags: ["recovery", "action"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 34,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "bramble-trap",
    name: "Bramble Counter",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 4,
      condition: "enemyAttacking",
    },
    text: "Against an attack: gain 2 Ward. If this attack then damages your Life, deal 2 damage back.",
    effects: [
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "GUARD",
            amount: 2,
          },
          {
            type: "COUNTERSTRIKE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 3,
    tags: ["counter", "reaction", "low-value"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "guile",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 35,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "wild-bloom",
    name: "Wild Bloom",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      symbol: "guard",
    },
    text: "Heal 4 Life and gain 2 Ward.",
    effects: [
      {
        type: "HEAL",
        amount: 4,
      },
      {
        type: "GUARD",
        amount: 2,
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 3,
    tags: ["recovery", "action"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      allOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "might",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 36,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "crooked-bough",
    name: "Crooked Bough",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 4,
    },
    text: "Deal 3 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 3,
    tags: ["attack", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 37,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "night-spores",
    name: "Night Spores",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 4,
      max: 6,
    },
    text: "Poison: at the start of the enemy’s next turn, they lose 2 Life once. Gain 1 Ward.",
    effects: [
      {
        type: "STATUS",
        status: "poison",
        target: "enemy",
        amount: 2,
        duration: 1,
      },
      {
        type: "GUARD",
        amount: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 3,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      allOf: [
        {
          affinity: "wild",
        },
        {
          affinity: "shadow",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 38,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "sun-lance",
    name: "Sun Lance",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 6,
    },
    text: "Deal 4 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 4,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 4,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "might",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 39,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "first-light",
    name: "First Light",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 5,
    },
    text: "Heal 1 Life. Empower your next damage effect by 2. Expires at the end of your next turn.",
    effects: [
      {
        type: "HEAL",
        amount: 1,
      },
      {
        type: "STATUS",
        status: "power",
        amount: 2,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 4,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "spirit",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 40,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "offering",
    name: "Offering",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      any: true,
      life: 2,
    },
    text: "Spend 2 Life. Empower your next damage effect by 3. Expires at the end of your next turn.",
    effects: [
      {
        type: "STATUS",
        status: "power",
        amount: 3,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 4,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "mythic",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "shadow",
        },
        {
          affinity: "spirit",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 41,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 4,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "dawn-shield",
    name: "Dawn Shield",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 4,
    },
    text: "Gain 2 Ward. If this attack then damages your Life, deal 1 damage back.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyAttacking",
        effects: [
          {
            type: "COUNTERSTRIKE",
            amount: 1,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 4,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "spirit",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 42,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "open-sky",
    name: "Open Sky",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 5,
      max: 7,
      condition: "enemyAttacking",
    },
    text: "Prevent up to 2 damage from this Action. Gain 1 Ward.",
    effects: [
      {
        type: "BLOCK_EFFECT",
        amount: 2,
      },
      {
        type: "GUARD",
        amount: 1,
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 4,
    tags: ["manipulation", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "wisdom",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 43,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "burning-crown",
    name: "Burning Crown",
    category: "Finisher",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 10,
      life: 2,
    },
    text: "Spend 2 Life to deal 7 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 7,
      },
    ],
    priority: 40,
    archetype: "Finisher",
    artIndex: 4,
    tags: ["finisher", "action"],
    mechanicalVersion: 8,
    rarity: "mythic",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "might",
            },
            {
              affinity: "spirit",
            },
          ],
        },
        {
          allOf: [
            {
              affinity: "might",
            },
            {
              affinity: "chaos",
            },
          ],
        },
      ],
    },
    set: "first-light",
    collectorNumber: 44,
    balanceMetadata: {
      intent: "Finisher option; overlapping Affinity access",
      complexity: 4,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "horizon",
    name: "Horizon",
    category: "Prediction",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 5,
    },
    text: "Deal 2 damage. If this is your third ability or later this round, deal 2 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "threeActions",
        effects: [
          {
            type: "DAMAGE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Prediction",
    artIndex: 4,
    tags: ["prediction", "action"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "might",
            },
            {
              affinity: "wisdom",
            },
          ],
        },
        {
          affinity: "guile",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 45,
    balanceMetadata: {
      intent: "Prediction option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "daring-feint",
    name: "Daring Feint",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 5,
    },
    text: "Deal 2 damage. If another Omen is unused, deal 1 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "unusedDie",
        effects: [
          {
            type: "DAMAGE",
            amount: 1,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 5,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "might",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 46,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "turnabout",
    name: "Turnabout",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 3,
      max: 5,
    },
    text: "Gain 2 Ward. If you were behind in Life and this attack damages your Life, deal 3 damage back.",
    effects: [
      {
        type: "GUARD",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "behind",
        effects: [
          {
            type: "COUNTERSTRIKE",
            amount: 3,
          },
        ],
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 5,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "shadow",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 47,
    balanceMetadata: {
      intent: "Counter option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "rising-tide",
    name: "Rising Tide",
    category: "Recovery",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 2,
      max: 4,
    },
    text: "Heal 2 Life. If you were behind in Life, heal 1 more.",
    effects: [
      {
        type: "HEAL",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "behind",
        effects: [
          {
            type: "HEAL",
            amount: 1,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Recovery",
    artIndex: 5,
    tags: ["recovery", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "spirit",
        },
        {
          affinity: "wild",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 48,
    balanceMetadata: {
      intent: "Recovery option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "island-pull",
    name: "Island Pull",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 8,
    },
    text: "Deal 5 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 5,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 5,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wild",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 49,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Specialist access requires every listed Affinity. Activation cost and effect efficiency are unchanged; rarity is not a power multiplier.",
    },
    persistence: "none",
  },
  {
    id: "bold-wager",
    name: "Bold Wager",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 1,
      any: true,
      life: 1,
    },
    text: "Spend 1 Life. Empower your next damage effect by 2. Expires at the end of your next turn.",
    effects: [
      {
        type: "STATUS",
        status: "power",
        amount: 2,
        duration: 1,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 5,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "uncommon",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "shadow",
        },
        {
          affinity: "chaos",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 50,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 2,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "wavebreaker",
    name: "Wavebreaker",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 5,
      max: 6,
    },
    text: "Convert up to 3 Ward into damage, then deal 2 damage.",
    effects: [
      {
        type: "CONVERT",
        from: "guard",
        amount: 3,
        effects: [
          {
            type: "DAMAGE",
            amount: 1,
          },
        ],
      },
      {
        type: "DAMAGE",
        amount: 2,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 5,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "rare",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "might",
            },
            {
              affinity: "spirit",
            },
          ],
        },
        {
          allOf: [
            {
              affinity: "might",
            },
            {
              affinity: "guile",
            },
          ],
        },
      ],
    },
    set: "first-light",
    collectorNumber: 51,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "against-the-current",
    name: "Against the Current",
    category: "Prediction",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 4,
    },
    text: "Deal 2 damage. If the enemy has Ward, deal 2 more.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
      {
        type: "CONDITIONAL",
        condition: "enemyGuarding",
        effects: [
          {
            type: "DAMAGE",
            amount: 2,
          },
        ],
      },
    ],
    priority: 40,
    archetype: "Prediction",
    artIndex: 5,
    tags: ["prediction", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "order",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 52,
    balanceMetadata: {
      intent: "Prediction option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "quick-strike",
    name: "Quick Strike",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 1,
      max: 3,
    },
    text: "Deal 2 damage.",
    effects: [
      {
        type: "DAMAGE",
        amount: 2,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 0,
    tags: ["attack", "action", "low-value"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 53,
    balanceMetadata: {
      intent: "Attack option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "web-turn",
    name: "Web Turn",
    category: "Manipulation",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 6,
      max: 6,
    },
    text: "Redirect the declared enemy action back to its user.",
    effects: [
      {
        type: "REDIRECT",
      },
    ],
    priority: 20,
    archetype: "Manipulation",
    artIndex: 1,
    tags: ["manipulation", "reaction"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "guile",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 54,
    balanceMetadata: {
      intent: "Manipulation option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "precision-cut",
    name: "Precision Cut",
    category: "Attack",
    timing: "ACTION",
    requirement: {
      count: 1,
      min: 5,
      max: 5,
    },
    text: "Deal 3 damage; ignore 1 Ward.",
    effects: [
      {
        type: "DAMAGE",
        amount: 3,
        guardPierce: 1,
      },
    ],
    priority: 40,
    archetype: "Attack",
    artIndex: 2,
    tags: ["attack", "action"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: {
      allOf: [
        {
          affinity: "might",
        },
        {
          affinity: "wisdom",
        },
      ],
    },
    set: "first-light",
    collectorNumber: 55,
    balanceMetadata: {
      intent: "Attack option; overlapping Affinity access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "counterstrike",
    name: "Counterstrike",
    category: "Counter",
    timing: "REACTION",
    requirement: {
      count: 1,
      min: 8,
      condition: "enemyAttacking",
    },
    text: "If this attack damages your Life, deal 4 damage back.",
    effects: [
      {
        type: "COUNTERSTRIKE",
        amount: 4,
      },
    ],
    priority: 20,
    archetype: "Counter",
    artIndex: 0,
    tags: ["counter", "reaction"],
    mechanicalVersion: 8,
    rarity: "common",
    affinityRequirements: null,
    set: "first-light",
    collectorNumber: 56,
    balanceMetadata: {
      intent: "Counter option; universal access",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "ritual",
    name: "Ritual",
    category: "Setup",
    timing: "ACTION",
    requirement: {
      count: 2,
      exact: 10,
      min: 10,
      max: 10,
    },
    text: "Heal 5 Life and gain 3 Ward.",
    effects: [
      {
        type: "HEAL",
        amount: 5,
      },
      {
        type: "GUARD",
        amount: 3,
      },
    ],
    priority: 40,
    archetype: "Setup",
    artIndex: 4,
    tags: ["setup", "action"],
    mechanicalVersion: 8,
    rarity: "mythic",
    affinityRequirements: {
      anyOf: [
        {
          allOf: [
            {
              affinity: "spirit",
            },
            {
              affinity: "wisdom",
            },
          ],
        },
        {
          allOf: [
            {
              affinity: "wild",
            },
            {
              affinity: "chaos",
            },
          ],
        },
      ],
    },
    set: "first-light",
    collectorNumber: 57,
    balanceMetadata: {
      intent: "Setup option; overlapping Affinity access",
      complexity: 4,
      repeatability: "resource-limited",
      reviewNotes:
        "Prototype; measured per legal Legend and Omen profile, not rarity-scaled.",
    },
    persistence: "none",
  },
  {
    id: "meditate",
    name: "Meditate",
    affinityRequirements: null,
    requirement: {
      count: 1,
      min: 2,
      max: 5,
    },
    text: "Gain 1 Focus.",
    effects: [
      {
        type: "GAIN_CONTROL",
        amount: 1,
      },
    ],
    timing: "ACTION",
    rarity: "common",
    set: "first-light",
    collectorNumber: 58,
    category: "Setup",
    archetype: "Omen utility",
    priority: 40,
    artIndex: 1,
    tags: ["omen", "utility", "action"],
    mechanicalVersion: 8,
    balanceMetadata: {
      intent: "Gain 1 Focus.",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes: "Consumes an Omen; no free reusable activation.",
    },
    persistence: "none",
  },
  {
    id: "hollow-sign",
    name: "Hollow Sign",
    affinityRequirements: {
      anyOf: [
        {
          affinity: "chaos",
        },
        {
          affinity: "shadow",
        },
      ],
    },
    requirement: {
      count: 1,
      void: true,
      unused: 1,
    },
    text: "Flip your first other available or Held Omen.",
    effects: [
      {
        type: "FLIP_DIE",
        target: "self",
        omenTarget: "unspent",
      },
    ],
    timing: "ACTION",
    rarity: "rare",
    set: "first-light",
    collectorNumber: 59,
    category: "Manipulation",
    archetype: "Omen utility",
    priority: 40,
    artIndex: 1,
    tags: ["omen", "utility", "action"],
    mechanicalVersion: 8,
    balanceMetadata: {
      intent: "Flip your first other available or Held Omen.",
      complexity: 3,
      repeatability: "resource-limited",
      reviewNotes: "Consumes an Omen; no free reusable activation.",
    },
    persistence: "none",
  },
  {
    id: "thread-the-path",
    name: "Thread the Path",
    affinityRequirements: {
      affinity: "wisdom",
    },
    requirement: {
      count: 1,
      exact: 5,
      min: 5,
      max: 5,
    },
    text: "Shift the first Omen paying for the enemy Action down by 1. Recheck its requirement.",
    effects: [
      {
        type: "SHIFT_DIE",
        target: "enemy",
        direction: -1,
      },
    ],
    timing: "REACTION",
    rarity: "uncommon",
    set: "first-light",
    collectorNumber: 60,
    category: "Manipulation",
    archetype: "Omen utility",
    priority: 20,
    artIndex: 1,
    tags: ["omen", "utility", "reaction"],
    mechanicalVersion: 8,
    balanceMetadata: {
      intent:
        "Shift the first Omen paying for the enemy Action down by 1. Recheck its requirement.",
      complexity: 1,
      repeatability: "resource-limited",
      reviewNotes: "Consumes an Omen; no free reusable activation.",
    },
    persistence: "none",
  },
] satisfies Omit<CardDef, "requirementLabel">[];
