import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./no-not-built-in-console-property";
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
      code: `console.log("foo")`,
    },
    {
      code: `myLogger.log("foo")`,
    },
    {
      code: `myLogger.error("foo")`,
    },
    {
      code: `"a".at(1)`,
    },
  ],
  invalid: [
    {
      code: `console.error("foo")`,
      errors: [{ messageId: "notBuiltInPropertyAccess" }],
    },
    {
      code: `console.dir("foo")`,
      errors: [{ messageId: "notBuiltInPropertyAccess" }],
    },
    {
      code: `console.#error("foo")`,
      errors: [{ messageId: "notBuiltInPropertyAccess" }],
    },
    {
      code: `console[1]("foo")`,
      errors: [{ messageId: "nonDynamicAccess" }],
    },
  ],
});
