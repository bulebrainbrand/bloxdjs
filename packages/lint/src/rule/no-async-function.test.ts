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
    { code: `const a = () => {}` },
    { code: `const a = {a(){}}` },
    { code: `class a{method(){}}` },

    { code: `class a{static method(){}}` },

    { code: `class a{constructor(){}}` },
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
    {
      code: `const a = async () => {}`,
      errors: [{ messageId: "nonUseAsyncArrowFunction" }],
      output: `const a = () => {}`,
    },
    {
      code: `const a = {method:async function(){}}`,
      errors: [{ messageId: "nonUseAsyncFunction" }],
      output: `const a = {method:function(){}}`,
    },
    {
      code: `const a = {async method(){}}`,
      errors: [{ messageId: "nonUseAsyncMethod" }],
      output: `const a = {method(){}}`,
    },
    {
      code: `class a{async method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{method(){}}`,
    },
    {
      code: `class a{async *method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{*method(){}}`,
    },
    {
      code: `class a{static async *method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{static *method(){}}`,
    },
    {
      code: `class a{static public async *method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{static public *method(){}}`,
    },
    {
      code: `class a{static private async *method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{static private *method(){}}`,
    },
    {
      code: `class a{async #method(){}}`,
      errors: [{ messageId: "nonUseAsyncClassMethod" }],
      output: `class a{#method(){}}`,
    },
  ],
});
