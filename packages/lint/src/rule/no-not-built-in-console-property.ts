// oxlint-disable-next-line no-unused-vars
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
const ALLOWED_PROPERTY_NAMES = ["log"];
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the use of push inside map method",
    },
    messages: {
      notBuiltInPropertyAccess:
        "Do not access not built-in console property. access only [" +
        ALLOWED_PROPERTY_NAMES.join(",") +
        "] property",
      nonDynamicAccess: "Do not access console with dynamic property",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        if (node.object.name !== "console") return;
        if (node.property.type === AST_NODE_TYPES.Identifier) {
          if (ALLOWED_PROPERTY_NAMES.includes(node.property.name)) return;
          context.report({
            node: node,
            messageId: "notBuiltInPropertyAccess",
          });
          return;
        }
        if (node.property.type === AST_NODE_TYPES.PrivateIdentifier) {
          context.report({
            node: node,
            messageId: "notBuiltInPropertyAccess",
          });
          return;
        }
        context.report({
          node: node,
          messageId: "nonDynamicAccess",
        });
      },
    };
  },
} as const satisfies RuleModule<
  "notBuiltInPropertyAccess" | "nonDynamicAccess"
>;
