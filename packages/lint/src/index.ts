import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
import noNotBuiltInConsoleProperty from "./rule/no-not-built-in-console-property";
import noAsyncFunction from "./rule/no-async-function";
const rules: Record<string, RuleModule<string>> = {
  "no-not-built-in-console-property": noNotBuiltInConsoleProperty,
  "no-async-function": noAsyncFunction,
};

export default rules;
