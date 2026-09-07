// Bundle the shared engine before Vercel traces this function; Node ESM needs explicit extensions.
export { default } from "../server/online/generated.mjs";
