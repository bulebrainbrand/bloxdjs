// oxlint-disable typescript/unbound-method
import { dirname } from "path";
import ts from "typescript";

const parseConfigHost: ts.ParseConfigFileHost = {
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  // oxlint-disable-next-line typescript/no-empty-function
  onUnRecoverableConfigFileDiagnostic: () => {},
};

export const getTsconfig = (): ts.CompilerOptions => {
  const configPath = ts.findConfigFile(
    "./",
    ts.sys.fileExists,
    "tsconfig.json",
  );
  if (!configPath) {
    return {};
  }

  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    parseConfigHost,
  );

  if (!parsed) {
    return {};
  }
  parsed.options.baseUrl ??= dirname(configPath);
  return parsed.options;
};
