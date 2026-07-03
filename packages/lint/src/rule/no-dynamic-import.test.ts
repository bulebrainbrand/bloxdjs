import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./no-dynamic-import";
import { it, describe } from "vite-plus/test";
RuleTester.afterAll = () => {};
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;
RuleTester.describe = describe;
RuleTester.describeSkip = describe.skip;
const ruleTester = new RuleTester();

ruleTester.run("no-not-built-in-console-property", rule, {
  valid: [
    {
      code: `import a from "b"`,
    },
    {
      code: `import { a } from "b"`,
    },
    {
      code: `import * as a from "b"`,
    },
  ],
  invalid: [
    {
      code: `import("b")`,
      errors: [{ messageId: "noDynamicImport" }],
    },
    {
      code: `const a = import("b")`,
      errors: [{ messageId: "noDynamicImport" }],
    },
  ],
});
