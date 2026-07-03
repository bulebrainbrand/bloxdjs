#!/usr/bin/env node
// oxlint-disable typescript/no-unsafe-argument typescript/no-unsafe-member-access typescript/no-unsafe-return typescript/no-unsafe-assignment typescript/no-unsafe-call
/**
 * declare const a: b;  ->  declare global { var a: b; }
 *
 * Usage:
 *   node convert.js <input.ts> [output.ts]
 *   cat input.ts | node convert.js            # 標準入力/標準出力
 *
 * TypeScript Compiler API (AST) を使って変換するため、
 * 複数の変数・複数行・コメント・型注釈が複雑なケースでも安全に動作します。
 */

import {
  createSourceFile,
  ScriptTarget,
  ScriptKind,
  createPrinter,
  NewLineKind,
  isVariableStatement,
  SyntaxKind,
  NodeFlags,
  factory,
} from "typescript";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

/**
 * ソースコード文字列を受け取り、トップレベルの
 * `declare const x: T;` を `declare global { var x: T; }` に変換して返す。
 *
 * オプション:
 *   - mergeIntoSingleBlock: true の場合、複数の declare const をまとめて
 *     ひとつの `declare global { ... }` ブロックにする（デフォルト: true）
 */
function convert(sourceText, options = {}) {
  const { mergeIntoSingleBlock = true } = options;

  const sourceFile = createSourceFile(
    "input.ts",
    sourceText,
    ScriptTarget.Latest,
    /* setParentNodes */ true,
    ScriptKind.TS,
  );

  const printer = createPrinter({ newLine: NewLineKind.LineFeed });

  // declare const / declare var の VariableStatement かどうかを判定
  // (declare let は対象外のまま)
  function isDeclareConstOrVarStatement(stmt) {
    if (!isVariableStatement(stmt)) return false;
    const hasDeclare = !!stmt.modifiers?.some(
      (m) => m.kind === SyntaxKind.DeclareKeyword,
    );
    const flags = stmt.declarationList.flags;
    const isConst = (flags & NodeFlags.Const) !== 0;
    const isLet = (flags & NodeFlags.Let) !== 0;
    const isVar = !isConst && !isLet; // Const/Letどちらも立っていなければvar
    return hasDeclare && (isConst || isVar);
  }

  // const -> var に変えた VariableStatement（declare修飾子なし）を作る
  function toVarStatement(stmt) {
    const newDeclarationList = factory.createVariableDeclarationList(
      stmt.declarationList.declarations,
      NodeFlags.None, // const/let フラグを外す = var 相当
    );
    return factory.createVariableStatement(
      undefined, // modifiers なし（global ブロック内なので declare 不要）
      newDeclarationList,
    );
  }

  const collected = [];
  const newStatements = [];

  for (const stmt of sourceFile.statements) {
    if (isDeclareConstOrVarStatement(stmt)) {
      collected.push(toVarStatement(stmt));
    } else {
      newStatements.push(stmt);
    }
  }

  if (collected.length === 0) {
    // 変換対象なし
    return sourceText;
  }

  if (mergeIntoSingleBlock) {
    const globalBlock = factory.createModuleDeclaration(
      [factory.createModifier(SyntaxKind.DeclareKeyword)],
      factory.createIdentifier("global"),
      factory.createModuleBlock(collected),
      NodeFlags.GlobalAugmentation,
    );
    newStatements.push(globalBlock);
  } else {
    for (const varStmt of collected) {
      const globalBlock = factory.createModuleDeclaration(
        [factory.createModifier(SyntaxKind.DeclareKeyword)],
        factory.createIdentifier("global"),
        factory.createModuleBlock([varStmt]),
        NodeFlags.GlobalAugmentation,
      );
      newStatements.push(globalBlock);
    }
  }

  const newSourceFile = factory.updateSourceFile(sourceFile, newStatements);
  return printer.printFile(newSourceFile) + "\nexport {}";
}

// ---- CLI 実行部分 ----
function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1];

  if (inputPath) {
    const src = readFileSync(inputPath, "utf8");
    const result = convert(src);
    if (outputPath) {
      mkdirSync(path.dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, result, "utf8");
      console.log(`変換完了: ${outputPath}`);
    } else {
      process.stdout.write(result);
    }
  } else {
    // 標準入力から読む
    let chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const src = Buffer.concat(chunks).toString("utf8");
      process.stdout.write(convert(src));
    });
  }
}

if (process.argv[1] === import.meta.filename) {
  main();
}

export default { convert };
