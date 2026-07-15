import type { StrictConfig } from "../config";
import type { FullFsClient } from "../types/fs";
import { getIncludesFiles } from "./getIncludesFiles";
import {
  copyToTempDirectory,
  convertPathToInnerTempDirectory,
  getTempDirectory,
  copyFileToTempDirectory,
} from "./copyToTempDirectory";
import { transfromTSFiles } from "./transfromTSToJS";
import { parseFiles } from "./parse";
import { zip } from "../utils/zip";
import { getTsconfig } from "./tsconfig";
import { collectShouldReplaceImportExports } from "./collectShouldReplaceImport";
import { generateFileNameMap } from "./generateFileNameMap";
import { addGlobalThisExport } from "./exportAdder";
import { replaceImport } from "./importReplacer";
import generate from "@babel/generator";
import { pack } from "./packer";
import { getEachFileInfo } from "./getFileInfo";
import path from "node:path";
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
  const paths = copyToTempDirectory(includeFiles, cwd, fs);
  console.log(`[x] created temp dir`);
  const tsconfig = getTsconfig();
  if (tsconfig.path) {
    copyFileToTempDirectory(tsconfig.path, fs, cwd);
    if (config.debug) console.log(`tsconfig path: ${tsconfig.path}`);
  }
  console.log(`[x] loaded tsconfig`);
  await transfromTSFiles(paths, fs);
  console.log(`[x] transfromed to JavaScript`);
  const asts = parseFiles(paths, fs);
  console.log(`[x] parsed to ast`);
  /**
   * map of absoluted file path and ast
   */
  const astMap = new Map(zip(paths, asts));
  console.log(`[x] created ast map`);
  if (config.debug)
    console.log(`astmap keys: ${Array.from(astMap.keys()).join("\n")}`);
  const tempTsconfigPath = tsconfig.path
    ? convertPathToInnerTempDirectory(tsconfig.path, cwd)
    : undefined;
  const {
    shouldReplaceExportFiles: ExporterFilesToReplace,
    shouldReplaceImportFiles: ImporterFilesToReplace,
  } = collectShouldReplaceImportExports(astMap, fs, tempTsconfigPath);
  console.log(
    `[x] collect should replace import/exports. start transfrom import ${ImporterFilesToReplace.size} export ${ExporterFilesToReplace.size}`,
  );
  if (config.debug) {
    console.log(
      `ExporterFilesToReplace:\n ${Array.from(
        ExporterFilesToReplace.entries().map(
          ([string, data]) =>
            `${string}: ${data.type === "all" ? "all" : Array.from(data.member.keys()).join(" , ")}`,
        ),
      ).join("\n")}`,
    );
    console.log(
      `ImporterFilesToReplace ${Array.from(ImporterFilesToReplace.keys()).join("\n")}`,
    );
  }
  const fileNameMap = generateFileNameMap(ExporterFilesToReplace);
  for (const [path, ast] of astMap) {
    if (config.debug) console.log(`start convert ${path}`);
    if (ExporterFilesToReplace.has(path)) {
      const ExportMemberToReplace = ExporterFilesToReplace.get(path)!;
      if (config.debug)
        console.log(
          `replace export members: ${ExportMemberToReplace.type === "part" ? Array.from(ExportMemberToReplace.member).join("\n") : "all"}`,
        );
      addGlobalThisExport(
        ast,
        path,
        fileNameMap,
        ExportMemberToReplace,
        fs,
        tsconfig.path,
      );
      console.log(
        `[x] converted ${ExportMemberToReplace.type === "all" ? "all" : ExportMemberToReplace.member.size} export`,
      );
    }
    if (ImporterFilesToReplace.has(path)) {
      if (config.debug) console.log(`replace import`);
      replaceImport(ast, path, fileNameMap, fs, tsconfig.path);
    }
    fs.writeFileSync(path, generate(ast).code);
    console.log(`[x] coverted ${path}`);
  }
  const filesInfo = getEachFileInfo(astMap);
  const entryCodeBlockFileToNameMap = new Map(
    filesInfo
      .entries()
      .filter(
        (arg): arg is [string, { type: "codeblock"; name: string }] =>
          arg[1].type === "codeblock",
      )
      .map(([path, info]) => [path, info.name]),
  );
  if (config.debug)
    console.log(
      `entryCodeBlockFileToNameMap: \n${Array.from(entryCodeBlockFileToNameMap.entries().map(([file, type]) => `${file}: ${type}`)).join("\n")}`,
    );
  const worldcodeEntry = convertPathToInnerTempDirectory(
    path.resolve(cwd, config.worldcode.entry),
    cwd,
  );
  await pack(
    entryCodeBlockFileToNameMap,
    worldcodeEntry,
    config.minify.enable,
    tsconfig.path,
  );
  console.log(`[x] packed files`);
  if (!config.debug) {
    fs.rmSync(getTempDirectory(cwd), { recursive: true, force: true });
    console.log(`[x] clear temp files`);
  }
};
