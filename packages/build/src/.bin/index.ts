#!/usr/bin/env node

import { cli, define } from "gunshi";
import { readBuildConfig } from "../config";
import { build } from "../builder";
import fs from "fs";
const command = define({
  name: "build",
  args: {},
  run: async () => {
    const config = await readBuildConfig();
    const cwd = process.cwd();
    await build(config, fs, cwd);
  },
});

await cli(process.argv.slice(2), command);
