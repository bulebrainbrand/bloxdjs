import { describe, it, expect } from "vite-plus/test";
import {
  splitSchematicByX,
  splitSchematicByY,
  splitSchematicByZ,
  splitSchematicByAxis,
} from "./split";
import type { ShortestNormailzedSchema } from "./schemas/shortest";
import { CHUNK_SIZE, PLANE_SIZE } from "./constants";

function makeChunk(
  pos: [number, number, number],
  fill: number,
): { pos: [number, number, number]; blocks: number[] } {
  return { pos, blocks: new Array(CHUNK_SIZE ** 3).fill(fill) };
}

function makeShortestSchema(
  axis: "x" | "y" | "z",
  fillLeft: number,
  fillRight: number,
): ShortestNormailzedSchema {
  const rightPos: [number, number, number] =
    axis === "x" ? [1, 0, 0] : axis === "y" ? [0, 1, 0] : [0, 0, 1];
  const size: [number, number, number] =
    axis === "x" ? [40, 32, 32] : axis === "y" ? [32, 40, 32] : [32, 32, 40];

  return {
    name: "shortest",
    pos: [0, 0, 0],
    size,
    chunks: [makeChunk([0, 0, 0], fillLeft), makeChunk(rightPos, fillRight)],
  };
}

describe("splitSchematicByX with ShortestNormailzedSchema", () => {
  it("splits across a chunk boundary and merges block content", () => {
    const schem = makeShortestSchema("x", 1, 2);
    const [aligned, merged] = splitSchematicByX(schem, 24);

    expect(aligned.size).toStrictEqual([24, 32, 32]);
    expect(aligned.pos).toStrictEqual([0, 0, 0]);
    expect(aligned.chunks).toHaveLength(1);
    expect(aligned.chunks[0].pos).toStrictEqual([0, 0, 0]);
    expect(aligned.chunks[0].blocks.every((v) => v === 1)).toBe(true);

    expect(merged.size).toStrictEqual([16, 32, 32]);
    expect(merged.pos).toStrictEqual([0, 0, 0]);
    expect(merged.chunks).toHaveLength(1);
    const blocks = merged.chunks[0].blocks;
    expect(blocks).toHaveLength(CHUNK_SIZE ** 3);
    const leftLen = 8 * PLANE_SIZE;
    expect(blocks.slice(0, leftLen).every((v) => v === 1)).toBe(true);
    expect(blocks.slice(leftLen).every((v) => v === 2)).toBe(true);
  });

  it("does not include blockdatas or globalPosition in the output", () => {
    const schem = makeShortestSchema("x", 1, 2);
    const result = splitSchematicByX(schem, 24);

    for (const out of result) {
      expect("blockdatas" in out).toBe(false);
      expect("globalPosition" in out).toBe(false);
    }
  });
});

describe("splitSchematicByY with ShortestNormailzedSchema", () => {
  it("splits across a chunk boundary and merges block content", () => {
    const schem = makeShortestSchema("y", 1, 2);
    const [aligned, merged] = splitSchematicByY(schem, 24);

    expect(aligned.size).toStrictEqual([32, 24, 32]);
    expect(aligned.chunks[0].blocks.every((v) => v === 1)).toBe(true);

    expect(merged.size).toStrictEqual([32, 16, 32]);
    const blocks = merged.chunks[0].blocks;
    expect(blocks).toHaveLength(CHUNK_SIZE ** 3);
    // Per x-plane, first (32-24)*32 = 256 entries are from the left chunk,
    // the remaining 24*32 = 768 entries come from the right chunk.
    expect(blocks.slice(0, 256).every((v) => v === 1)).toBe(true);
    expect(blocks.slice(256, PLANE_SIZE).every((v) => v === 2)).toBe(true);
    expect(
      blocks.slice(PLANE_SIZE, PLANE_SIZE + 256).every((v) => v === 1),
    ).toBe(true);
  });

  it("does not include blockdatas or globalPosition in the output", () => {
    const schem = makeShortestSchema("y", 1, 2);
    const result = splitSchematicByY(schem, 24);

    for (const out of result) {
      expect("blockdatas" in out).toBe(false);
      expect("globalPosition" in out).toBe(false);
    }
  });
});

describe("splitSchematicByZ with ShortestNormailzedSchema", () => {
  it("splits across a chunk boundary and merges block content", () => {
    const schem = makeShortestSchema("z", 1, 2);
    const [aligned, merged] = splitSchematicByZ(schem, 24);

    expect(aligned.size).toStrictEqual([32, 32, 24]);
    expect(aligned.chunks[0].blocks.every((v) => v === 1)).toBe(true);

    expect(merged.size).toStrictEqual([32, 32, 16]);
    const blocks = merged.chunks[0].blocks;
    expect(blocks).toHaveLength(CHUNK_SIZE ** 3);
    // Per row of CHUNK_SIZE, the first 8 entries come from the left chunk
    // and the remaining 24 entries come from the right chunk.
    expect(blocks.slice(0, 8).every((v) => v === 1)).toBe(true);
    expect(blocks.slice(8, CHUNK_SIZE).every((v) => v === 2)).toBe(true);
    expect(
      blocks.slice(CHUNK_SIZE, CHUNK_SIZE + 8).every((v) => v === 1),
    ).toBe(true);
  });

  it("does not include blockdatas or globalPosition in the output", () => {
    const schem = makeShortestSchema("z", 1, 2);
    const result = splitSchematicByZ(schem, 24);

    for (const out of result) {
      expect("blockdatas" in out).toBe(false);
      expect("globalPosition" in out).toBe(false);
    }
  });
});

describe("splitSchematicByAxis with ShortestNormailzedSchema", () => {
  it("delegates to splitSchematicByX/Y/Z for each axis", () => {
    const schemX = makeShortestSchema("x", 1, 2);
    expect(splitSchematicByAxis(schemX, 24, "x")).toStrictEqual(
      splitSchematicByX(schemX, 24),
    );

    const schemY = makeShortestSchema("y", 1, 2);
    expect(splitSchematicByAxis(schemY, 24, "y")).toStrictEqual(
      splitSchematicByY(schemY, 24),
    );

    const schemZ = makeShortestSchema("z", 1, 2);
    expect(splitSchematicByAxis(schemZ, 24, "z")).toStrictEqual(
      splitSchematicByZ(schemZ, 24),
    );
  });
});