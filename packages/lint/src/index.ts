import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
import noNotBuiltInConsoleProperty from "./rule/no-not-built-in-console-property";
import noAsyncFunction from "./rule/no-async-function";
import noDynamicImport from "./rule/no-dynamic-import";
const rules: Record<string, RuleModule<string>> = {
  "no-not-built-in-console-property": noNotBuiltInConsoleProperty,
  "no-async-function": noAsyncFunction,
  "no-dynamic-import": noDynamicImport,
};

export default rules;
