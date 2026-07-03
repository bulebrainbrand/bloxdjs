// oxlint-disable-next-line no-unused-vars
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the use of push inside map method",
    },
    messages: {
      noDynamicImport:
        "Do not use Dynamic import. It does NOT will resolve by @bloxdjs/build And it will throw Syntax Error in bloxd.io enviroment.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportExpression(node) {
        context.report({
          messageId: "noDynamicImport",
          node,
        });
      },
    };
  },
} as const satisfies RuleModule<"noDynamicImport">;
