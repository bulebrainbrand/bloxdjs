import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./no-async-function";
import { it, describe } from "vite-plus/test";
RuleTester.afterAll = () => {};
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;
RuleTester.describe = describe;
RuleTester.describeSkip = describe.skip;
const ruleTester = new RuleTester();

ruleTester.run("no-async-function", rule, {
  valid: [
    {
      code: `() => {}`,
    },
    {
      code: `function a(){}`,
    },
    {
      code: `function* a(){}`,
    },
    {
      code: `const a = function(){}`,
    },
  ],
  invalid: [
    {
      code: `async () => {}`,
      errors: [{ messageId: "nonUseAsyncArrowFunction" }],
      output: `() => {}`,
    },
    {
      code: `async function a(){}`,
      errors: [{ messageId: "nonUseAsyncFunction" }],
      output: `function a(){}`,
    },
    {
      code: `async function* a(){}`,
      errors: [{ messageId: "nonUseAsyncGeneratorFunction" }],
      output: `function* a(){}`,
    },
    {
      code: `const a = async function(){}`,
      errors: [{ messageId: "nonUseAsyncFunction" }],
      output: `const a = function(){}`,
    },
  ],
});
