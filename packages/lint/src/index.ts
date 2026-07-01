import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
import noNotBuiltInConsoleProperty from "./rule/no-not-built-in-console-property";
const rules: Record<string, RuleModule<string>> = {
  "no-not-built-in-console-property": noNotBuiltInConsoleProperty,
};

export default rules;
