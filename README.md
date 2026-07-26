# bloxdjs
node.jsのためのbloxd.io用パッケージ
## feature
- node.js上での動作を前提した、bloxd.ioコーディングのためのツール
- TypeScript/esmのフルサポート
- 開発者のためのツールチェーン

## packages
### @bloxdjs/api
bloxd.io code apiの型定義が内包されたパッケージ。
#### usage
referenceを使用してTypeScriptCompilerに型定義を認識させることができます。
```typescript
/// <reference types="@bloxdjs/api">

api.log("hello typescript!")
```
また、同じようにreferenceを使うことでJavaScriptファイル内でもvscodeなどのエディターのインテリジェンスを強化することができます。
> [!WARNING]
> ワールドコードでコールバック(tickなど)を宣言する場合は、globalThisへ代入してください
> ```typescript
> // ❌️
> tick = () => {};
> 
> function tick(){};
>
> // ☑️
> globalThis.tick = () => {};
> 
> globalThis.tick = function (){};
> ```
> こうすることで、型補完が効き、変数のスコープが管理できます。JavaScriptの場合も、この記法を採用することでより安全に書くことができます。

### @bloxdjs/build
bloxd.io code用のTypeScriptハンドラー。
