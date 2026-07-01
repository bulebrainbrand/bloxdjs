import type { StrictConfig } from "../config";
import type { FullFsClient } from "../types/fs";
import { getIncludesFiles } from "./getIncludesFiles";
import { createTempDir, convertPathToTemp, getTempDir } from "./createTempDir";
import { transfromTSFiles } from "./transfromTSToJS";
import { parseFiles } from "./parse";
import { zip } from "../utils/zip";
import { getTsconfig } from "./tsconfig";
import { collectShouldReplaceImports } from "./collectShouldReplaceImport";
import { generateFileNameMap } from "./generateFileNameMap";
import { convertShouldReplaceExportData } from "./convertShouldReplaceData";
import { addGlobalThisExport } from "./exportAdder";
import { replaceImport } from "./importReplacer";
import generate from "@babel/generator";
import { pack } from "./packer";
import { getFileInfos } from "./getFileInfo";
import path from "node:path";
import { resolveImportPathAsts } from "./resolveTsconfigPath";
export const build = async (
  config: StrictConfig,
  fs: FullFsClient,
  cwd: string,
) => {
  const includeFiles = await getIncludesFiles(
    config.includes,
    config.excludes,
    fs,
  );
  console.log(`[x] resolved imnclude files: ${includeFiles.length} file`);
  const paths = createTempDir(includeFiles, cwd, fs);
  console.log(`[x] created temp dir`);
  const tsconfig = getTsconfig();
  console.log(`[x] loaded tsconfig`);
  await transfromTSFiles(paths, fs);
  console.log(`[x] transfromed to JavaScript`);
  const asts = parseFiles(paths, fs);
  console.log(`[x] parsed to ast`);
  const astMap = new Map(zip(paths, asts));
  console.log(`[x] created ast map`);
  if (tsconfig.path && tsconfig.options) {
    const tempTsconfigPath = convertPathToTemp(tsconfig.path, cwd);
    resolveImportPathAsts(
      astMap,
      { compilerOptions: tsconfig.options },
      tempTsconfigPath,
    );
    console.log(`[x] replaced typescript path option import`);
  }
  const shouldReplaceData = collectShouldReplaceImports(astMap);
  const shouldReplaceExportData = convertShouldReplaceExportData(
    shouldReplaceData.shouldReplaceExportFiles,
  );
  console.log(
    `[x] collect should replace import/exports. start transfrom import ${shouldReplaceData.shouldReplaceImportFiles.size} export ${Array.from(shouldReplaceExportData.keys()).join("\n")}`,
  );
  const fileNameMap = generateFileNameMap(shouldReplaceData);
  for (const [path, ast] of astMap) {
    if (shouldReplaceExportData.has(path)) {
      const shouldReplaceExport = shouldReplaceExportData.get(path)!;
      addGlobalThisExport(ast, path, fileNameMap, shouldReplaceExport);
      console.log(
        `[x] converted ${typeof shouldReplaceExport === "string" ? shouldReplaceExport : shouldReplaceExport.size} export`,
      );
    }
    if (shouldReplaceData.shouldReplaceImportFiles.has(path)) {
      replaceImport(ast, path, fileNameMap);
    }
    fs.writeFileSync(path, generate(ast).code);
    console.log(`[x] coverted ${path}`);
  }
  const fileInfos = getFileInfos(astMap);
  const codeBlockEntryMap = new Map(
    fileInfos
      .entries()
      .filter(
        (arg): arg is [string, { type: "codeblock"; name: string }] =>
          arg[1].type === "codeblock",
      )
      .map(([path, info]) => [path, info.name]),
  );
  await pack(
    codeBlockEntryMap,
    convertPathToTemp(path.resolve(cwd, config.worldcode.entry), cwd),
    config.minify.enable,
  );
  console.log(`[x] packed files`);
  fs.rmSync(getTempDir(cwd), { recursive: true, force: true });
  console.log(`[x] clear temp files`);
};
