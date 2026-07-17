import * as t from "@babel/types";
import { GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME } from "./constants";
export const addBloxdModuleInit = (ast: t.File) => {
  ast.program.body.unshift(
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(
          t.identifier("globalThis"),
          t.identifier(GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME),
        ),
        t.objectExpression([]),
      ),
    ),
  );
};
