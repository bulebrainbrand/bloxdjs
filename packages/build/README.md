## Steps

"use worldcode"はそのファイルがworldcodeで宣言されることを確定させる。
"use codeblock"はそのファイルがcodeblockで宣言されることを確定させる。

```ts
// src/hello.ts
"use worldcode";
export function hello() {
  console.log("hi!");
}
```

```ts
// src/index.ts
"use worldcode";
import { hello } from "./hello.ts";
hello();
```

```ts
// src/codeblock1.ts
"use codeblock {press}";
import { hello } from "./hello.ts";
hello();
```

この時codeblockはworldcodeで宣言されるhelloを参照したい(スコープは同じ)が、esbuildはこのhelloをiifeの外に出す、を実装してない
理想的にはビルドすると

```
dist
  worldcode.js
  codeblock/
    press.js
```

が排出されてほしい
press.jsにsrc/hello.tsをインライン化せずにworldcodeのものを使用したい
