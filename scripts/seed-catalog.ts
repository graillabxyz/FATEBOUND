import { writeFileSync } from "node:fs";
import { LEGENDS } from "../src/content/legends";
import { CARDS } from "../src/content/cards";
import { DICE } from "../src/content/dice";
import { GAME } from "../src/content/config";
import { STARTER_CONTENT } from "../src/content/loadouts";
const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;
const rows = [
  ...LEGENDS.map((x) => [x, "legend"] as const),
  ...CARDS.map((x) => [x, "card"] as const),
  ...DICE.map((x) => [x, "die"] as const),
];
writeFileSync(
  "supabase/seed.sql",
  `-- Shared pool v5: only the curated starter collection is granted to new accounts.\ninsert into public.content_catalog(id,kind,version,definition,starter) values\n${rows.map(([x, k]) => `(${quote(x.id)},${quote(k)},${GAME.version},${quote(JSON.stringify(x))}::jsonb,${STARTER_CONTENT.includes(x.id)})`).join(",\n")}\non conflict(id) do update set definition=excluded.definition,version=excluded.version,starter=excluded.starter,enabled=true;\ninsert into public.inventory(user_id,content_id) select u.id,c.id from auth.users u cross join public.content_catalog c where c.starter and c.enabled on conflict do nothing;\n`,
);
