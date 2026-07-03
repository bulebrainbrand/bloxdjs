// oxlint-disable-next-line no-unused-vars
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleModule } from "@typescript-eslint/utils/eslint-utils";
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the use of async keyword",
    },
    messages: {
      nonUseAsyncArrowFunction:
        "Do not use async arrow function. use normal arrow function instead",
      nonUseAsyncFunction:
        "Do not use async function. use normal function instead",
      nonUseAsyncGeneratorFunction:
        "Do not use async generator function. use normal generator function instead",
    },
    schema: [],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (node.async) {
          if (node.generator) {
            context.report({
              messageId: "nonUseAsyncGeneratorFunction",
              node,
              fix(fixer) {
                const asyncToken = context.sourceCode.getFirstToken(node)!;
                const nextToken = context.sourceCode.getTokenAfter(asyncToken)!;

                return fixer.replaceTextRange(
                  [asyncToken.range[0], nextToken.range[0]],
                  "",
                );
              },
            });
          } else {
            context.report({
              messageId: "nonUseAsyncFunction",
              node,
              fix(fixer) {
                const asyncToken = context.sourceCode.getFirstToken(node)!;
                const nextToken = context.sourceCode.getTokenAfter(asyncToken)!;

                return fixer.replaceTextRange(
                  [asyncToken.range[0], nextToken.range[0]],
                  "",
                );
              },
            });
          }
        }
      },
      ArrowFunctionExpression(node) {
        if (node.async) {
          context.report({
            messageId: "nonUseAsyncArrowFunction",
            node,
            fix(fixer) {
              const asyncToken = context.sourceCode.getFirstToken(node)!;
              const nextToken = context.sourceCode.getTokenAfter(asyncToken)!;

              return fixer.replaceTextRange(
                [asyncToken.range[0], nextToken.range[0]],
                "",
              );
            },
          });
        }
      },
    };
  },
} as const satisfies RuleModule<
  | "nonUseAsyncFunction"
  | "nonUseAsyncArrowFunction"
  | "nonUseAsyncGeneratorFunction"
>;
