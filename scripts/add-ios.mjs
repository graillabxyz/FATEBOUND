// Capacitor 7.6's CLI lowercases --packagemanager before comparing it with 'SPM'.
// Use its normal add pipeline with the exact SPM configuration. No native checks
// or installed dependency files are changed. Once generated, `cap sync ios` works.
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const { loadConfig } = require("@capacitor/cli/dist/config.js");
const { addCommand } = require("@capacitor/cli/dist/tasks/add.js");
const config = await loadConfig();
config.ios.packageManager = Promise.resolve("SPM");
config.cli.assets.ios.platformTemplateArchive = "ios-spm-template.tar.gz";
config.cli.assets.ios.platformTemplateArchiveAbs = resolve(
  config.cli.assetsDirAbs,
  "ios-spm-template.tar.gz",
);
await addCommand(config, "ios");
