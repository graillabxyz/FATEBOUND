import {
  sqliteTable,
  text,
  integer,
  index,
} from "../tooling/sites/node_modules/drizzle-orm/sqlite-core/index";
export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    mechanicalVersion: integer("mechanical_version").notNull(),
    createdAt: text("created_at").notNull(),
    legendA: text("legend_a").notNull(),
    legendB: text("legend_b").notNull(),
    payload: text("payload").notNull(),
  },
  (t) => [index("idx_matches_source_created_at").on(t.source, t.createdAt)],
);
export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    sessionId: text("session_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("idx_usage_events_created_at").on(t.createdAt)],
);
