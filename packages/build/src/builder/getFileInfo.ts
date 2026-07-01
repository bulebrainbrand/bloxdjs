import * as t from "@babel/types";
import { err, ok, unwrap, type Result } from "../result";
export type FileInfo =
  | {
      type: "worldcode";
    }
  | { type: "codeblock"; name: string };

export type FileInfoError =
  | "non_directive"
  | "many_worldcode_directive"
  | "many_codeblock_directive"
  | "dup_directive"
  | "non_name_codeblock";

export const getFileInfo = (ast: t.File): Result<FileInfo, FileInfoError> => {
  const directives = ast.program.directives;
  const worldcodeElements = directives.filter(
    (directive) => directive.value.value === "use worldcode",
  );
  const codeblockRegexp = /^use\scodeblock\{.*\}/;

  const codeblockElements = directives.filter((directive) =>
    codeblockRegexp.test(directive.value.value),
  );
  if (worldcodeElements.length > 1) {
    return err("many_worldcode_directive");
  }
  if (codeblockElements.length > 1) {
    return err("many_codeblock_directive");
  }
  // (worldcodeElements.length,codeblockElements.length) tuple is (0,1) | (1,0) | (0,0) | (1,1)
  if (worldcodeElements.length > 0 && codeblockElements.length > 0) {
    return err("dup_directive");
  }
  // (worldcodeElements.length,codeblockElements.length) tuple is (0,1) | (1,0) | (1,1)
  if (worldcodeElements.length === 0 && codeblockElements.length === 0) {
    return err("non_directive");
  }
  // (worldcodeElements.length,codeblockElements.length) tuple is (0,1) | (1,0)
  if (worldcodeElements.length === 1) {
    return ok({ type: "worldcode" });
  }
  // (worldcodeElements.length,codeblockElements.length) tuple is (0,1)
  const codeblockElement = codeblockElements[0]; // every exists
  const text = codeblockElement.value.value;
  // use codeblock{}
  //              ^index=13
  const USE_CODEBLOCK_NAME_START_INDEX = 14;
  const codeblockName = text.slice(
    USE_CODEBLOCK_NAME_START_INDEX,
    text.length - 1,
  );
  if (codeblockName === "") {
    return err("non_name_codeblock");
  }
  return ok({ type: "codeblock", name: codeblockName });
};

export const getFileInfos = (
  astMap: Map<string, t.File>,
): Map<string, FileInfo> => {
  const map: Map<string, FileInfo> = new Map();
  for (const [path, ast] of astMap) {
    map.set(path, unwrap(getFileInfo(ast)));
  }
  return map;
};
