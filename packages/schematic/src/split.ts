import { CHUNK_SIZE, PLANE_SIZE } from "./constants";
import type { BlockData, Blocks, Chunk, Schematic } from "./types";
import { getChunkSize } from "./utils";

function chunkKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

function buildChunkMap(chunks: Chunk[]): Map<string, Chunk> {
  const map = new Map<string, Chunk>();
  for (const chunk of chunks) {
    map.set(chunkKey(chunk.pos[0], chunk.pos[1], chunk.pos[2]), chunk);
  }
  return map;
}

interface AxisSliceRange {
  sliceStart: number;
  sliceEnd: number;
  sliceWidth: number;
  frac: number;
  leftLen: number;
  baseSrcChunk: number;
  chunkCount: number;
}

function computeAxisSliceRanges(
  totalSize: number,
  sliceSize: number,
): AxisSliceRange[] {
  if (sliceSize <= 0) {
    throw new Error(`sliceSize must be positive (got ${sliceSize})`);
  }
  const ranges: AxisSliceRange[] = [];
  for (let sliceStart = 0; sliceStart < totalSize; sliceStart += sliceSize) {
    const sliceEnd = Math.min(sliceStart + sliceSize, totalSize);
    const sliceWidth = sliceEnd - sliceStart;
    const frac = sliceStart % CHUNK_SIZE;
    ranges.push({
      sliceStart,
      sliceEnd,
      sliceWidth,
      frac,
      leftLen: CHUNK_SIZE - frac,
      baseSrcChunk: Math.floor(sliceStart / CHUNK_SIZE),
      chunkCount: Math.ceil(sliceWidth / CHUNK_SIZE),
    });
  }
  return ranges;
}

function sliceBlockdatas(
  blockdatas: BlockData[],
  key: "blockX" | "blockY" | "blockZ",
  sliceStart: number,
  sliceEnd: number,
): { sliced: BlockData[]; count: number } {
  const sliced: BlockData[] = [];
  let count = 0;
  for (const blockdata of blockdatas) {
    const v = blockdata[key];
    if (v >= sliceStart && v < sliceEnd) {
      sliced.push({ ...blockdata, [key]: v - sliceStart });
      count++;
    }
  }
  return { sliced, count };
}

function assertAllBlockdatasAssigned(expected: number, actual: number): void {
  if (expected !== actual) {
    throw new Error(
      `blockdata assignment mismatch: expected ${expected}, assigned ${actual}`,
    );
  }
}

function makeOutSchematic(
  schem: Schematic,
  outSize: [number, number, number],
  chunks: Chunk[],
  blockdatas: BlockData[],
): Schematic {
  return {
    name: schem.name,
    pos: [0, 0, 0],
    size: outSize,
    chunks,
    blockdatas,
  };
}

const buildXAlignedBlocks = (srcLeft: Chunk): number[] => srcLeft.blocks;
const createPlainArray = (size: number): number[] =>
  new Array<number>(size * PLANE_SIZE).fill(0);

const extractLeftTailPlanes = (
  srcLeft: Chunk | undefined,
  frac: number,
  leftLen: number,
): number[] =>
  srcLeft ? srcLeft.blocks.slice(frac * PLANE_SIZE) : createPlainArray(leftLen);

const extractRightHeadPlanes = (
  srcRight: Chunk | undefined,
  frac: number,
): number[] =>
  srcRight
    ? srcRight.blocks.slice(0, frac * PLANE_SIZE)
    : createPlainArray(frac);

const buildXMergedBlocks = (
  srcLeft: Chunk | undefined,
  srcRight: Chunk | undefined,
  frac: number,
  leftLen: number,
): number[] => {
  const leftPart = extractLeftTailPlanes(srcLeft, frac, leftLen);
  const rightPart = extractRightHeadPlanes(srcRight, frac);
  return leftPart.concat(rightPart);
};

const buildOutputChunkX = (
  chunkMap: Map<string, Chunk>,
  outPos: [number, number, number],
  range: AxisSliceRange,
): Chunk | null => {
  const [cx, cy, cz] = outPos;
  const srcLeft = chunkMap.get(chunkKey(range.baseSrcChunk + cx, cy, cz));

  if (range.frac === 0) {
    if (!srcLeft) return null;
    return { pos: outPos, blocks: buildXAlignedBlocks(srcLeft) };
  }

  const srcRight = chunkMap.get(chunkKey(range.baseSrcChunk + cx + 1, cy, cz));
  if (!srcLeft && !srcRight) return null;

  return {
    pos: outPos,
    blocks: buildXMergedBlocks(srcLeft, srcRight, range.frac, range.leftLen),
  };
};

function collectOutputChunksX(
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountY: number,
  chunkCountZ: number,
): Chunk[] {
  const outChunks: Chunk[] = [];
  for (let cx = 0; cx < range.chunkCount; cx++) {
    for (let cy = 0; cy < chunkCountY; cy++) {
      for (let cz = 0; cz < chunkCountZ; cz++) {
        const chunk = buildOutputChunkX(chunkMap, [cx, cy, cz], range);
        if (chunk) outChunks.push(chunk);
      }
    }
  }
  return outChunks;
}

const buildSlicedSchematicX = (
  schem: Schematic,
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountY: number,
  chunkCountZ: number,
): Schematic => {
  const outChunks = collectOutputChunksX(
    chunkMap,
    range,
    chunkCountY,
    chunkCountZ,
  );
  const { sliced } = sliceBlockdatas(
    schem.blockdatas,
    "blockX",
    range.sliceStart,
    range.sliceEnd,
  );

  const [, sizeY, sizeZ] = schem.size;
  return makeOutSchematic(
    schem,
    [range.sliceWidth, sizeY, sizeZ],
    outChunks,
    sliced,
  );
};

export const splitSchematicByX = (
  schem: Schematic,
  sliceSize: number,
): Schematic[] => {
  const [sizeX] = schem.size;
  const [, chunkSizeY, chunkSizeZ] = getChunkSize(schem.size);

  const chunkMap = buildChunkMap(schem.chunks);

  return computeAxisSliceRanges(sizeX, sliceSize).map((range) => {
    return buildSlicedSchematicX(
      schem,
      chunkMap,
      range,
      chunkSizeY,
      chunkSizeZ,
    );
  });
};

// ------------------------------------------------------------------
// Y軸分割
// y は中間次元 -> xを固定した1024要素のplaneが32個並ぶ構造。
// ------------------------------------------------------------------

const buildYAlignedBlocks = (srcLeft: Chunk): Blocks => srcLeft.blocks;

export const buildYMergedPlane = (
  srcLeft: Chunk | undefined,
  srcRight: Chunk | undefined,
  x: number,
  frac: number,
  leftLen: number,
): Blocks => {
  const planeOffset = x * PLANE_SIZE;

  const leftPart = srcLeft
    ? srcLeft.blocks.slice(
        planeOffset + frac * CHUNK_SIZE,
        planeOffset + PLANE_SIZE,
      )
    : createPlainArray(leftLen);

  const rightPart = srcRight
    ? srcRight.blocks.slice(planeOffset, planeOffset + frac * CHUNK_SIZE)
    : createPlainArray(frac);

  return leftPart.concat(rightPart);
};

function buildYMergedBlocks(
  srcLeft: Chunk | undefined,
  srcRight: Chunk | undefined,
  frac: number,
  leftLen: number,
): Blocks {
  const planes: Blocks[] = [];
  for (let x = 0; x < CHUNK_SIZE; x++) {
    planes.push(buildYMergedPlane(srcLeft, srcRight, x, frac, leftLen));
  }
  return planes.flat();
}

function buildOutputChunkY(
  chunkMap: Map<string, Chunk>,
  outPos: [number, number, number],
  range: AxisSliceRange,
): Chunk | null {
  const [cx, cy, cz] = outPos;
  const srcLeft = chunkMap.get(chunkKey(cx, range.baseSrcChunk + cy, cz));

  if (range.frac === 0) {
    if (!srcLeft) return null;
    return { pos: outPos, blocks: buildYAlignedBlocks(srcLeft) };
  }

  const srcRight = chunkMap.get(chunkKey(cx, range.baseSrcChunk + cy + 1, cz));
  if (!srcLeft && !srcRight) return null;

  return {
    pos: outPos,
    blocks: buildYMergedBlocks(srcLeft, srcRight, range.frac, range.leftLen),
  };
}

function collectOutputChunksY(
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountX: number,
  chunkCountZ: number,
): Chunk[] {
  const outChunks: Chunk[] = [];
  for (let cx = 0; cx < chunkCountX; cx++) {
    for (let cy = 0; cy < range.chunkCount; cy++) {
      for (let cz = 0; cz < chunkCountZ; cz++) {
        const chunk = buildOutputChunkY(chunkMap, [cx, cy, cz], range);
        if (chunk) outChunks.push(chunk);
      }
    }
  }
  return outChunks;
}

function buildSlicedSchematicY(
  schem: Schematic,
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountX: number,
  chunkCountZ: number,
): { schematic: Schematic; assignedBlockdataCount: number } {
  const outChunks = collectOutputChunksY(
    chunkMap,
    range,
    chunkCountX,
    chunkCountZ,
  );
  const { sliced, count } = sliceBlockdatas(
    schem.blockdatas,
    "blockY",
    range.sliceStart,
    range.sliceEnd,
  );

  const [sizeX, , sizeZ] = schem.size;
  const schematic = makeOutSchematic(
    schem,
    [sizeX, range.sliceWidth, sizeZ],
    outChunks,
    sliced,
  );

  return { schematic, assignedBlockdataCount: count };
}

export function splitSchematicByY(
  schem: Schematic,
  sliceSize: number,
): Schematic[] {
  const [sizeX, sizeY, sizeZ] = schem.size;
  const chunkCountX = Math.ceil(sizeX / CHUNK_SIZE);
  const chunkCountZ = Math.ceil(sizeZ / CHUNK_SIZE);

  const chunkMap = buildChunkMap(schem.chunks);
  const ranges = computeAxisSliceRanges(sizeY, sliceSize);

  const result: Schematic[] = [];
  let assignedCount = 0;

  for (const range of ranges) {
    const { schematic, assignedBlockdataCount } = buildSlicedSchematicY(
      schem,
      chunkMap,
      range,
      chunkCountX,
      chunkCountZ,
    );
    result.push(schematic);
    assignedCount += assignedBlockdataCount;
  }

  assertAllBlockdatasAssigned(schem.blockdatas.length, assignedCount);
  return result;
}

// ------------------------------------------------------------------
// Z軸分割
// z は最内周次元 -> (x,y)を固定した32要素の行が1024個並ぶ構造。
// ------------------------------------------------------------------

function buildZAlignedBlocks(srcLeft: Chunk): number[] {
  return srcLeft.blocks; // 参照共有、コピーなし
}

function buildZMergedRow(
  srcLeft: Chunk | undefined,
  srcRight: Chunk | undefined,
  row: number,
  frac: number,
  leftLen: number,
): number[] {
  const rowOffset = row * CHUNK_SIZE;

  const leftPart = srcLeft
    ? srcLeft.blocks.slice(rowOffset + frac, rowOffset + CHUNK_SIZE)
    : new Array<number>(leftLen).fill(0);

  const rightPart = srcRight
    ? srcRight.blocks.slice(rowOffset, rowOffset + frac)
    : new Array<number>(frac).fill(0);

  return leftPart.concat(rightPart);
}

function buildZMergedBlocks(
  srcLeft: Chunk | undefined,
  srcRight: Chunk | undefined,
  frac: number,
  leftLen: number,
): number[] {
  const rows: number[][] = [];
  for (let row = 0; row < PLANE_SIZE; row++) {
    rows.push(buildZMergedRow(srcLeft, srcRight, row, frac, leftLen));
  }
  return rows.flat();
}

function buildOutputChunkZ(
  chunkMap: Map<string, Chunk>,
  outPos: [number, number, number],
  range: AxisSliceRange,
): Chunk | null {
  const [cx, cy, cz] = outPos;
  const srcLeft = chunkMap.get(chunkKey(cx, cy, range.baseSrcChunk + cz));

  if (range.frac === 0) {
    if (!srcLeft) return null;
    return { pos: outPos, blocks: buildZAlignedBlocks(srcLeft) };
  }

  const srcRight = chunkMap.get(chunkKey(cx, cy, range.baseSrcChunk + cz + 1));
  if (!srcLeft && !srcRight) return null;

  return {
    pos: outPos,
    blocks: buildZMergedBlocks(srcLeft, srcRight, range.frac, range.leftLen),
  };
}

function collectOutputChunksZ(
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountX: number,
  chunkCountY: number,
): Chunk[] {
  const outChunks: Chunk[] = [];
  for (let cx = 0; cx < chunkCountX; cx++) {
    for (let cy = 0; cy < chunkCountY; cy++) {
      for (let cz = 0; cz < range.chunkCount; cz++) {
        const chunk = buildOutputChunkZ(chunkMap, [cx, cy, cz], range);
        if (chunk) outChunks.push(chunk);
      }
    }
  }
  return outChunks;
}

function buildSlicedSchematicZ(
  schem: Schematic,
  chunkMap: Map<string, Chunk>,
  range: AxisSliceRange,
  chunkCountX: number,
  chunkCountY: number,
): { schematic: Schematic; assignedBlockdataCount: number } {
  const outChunks = collectOutputChunksZ(
    chunkMap,
    range,
    chunkCountX,
    chunkCountY,
  );
  const { sliced, count } = sliceBlockdatas(
    schem.blockdatas,
    "blockZ",
    range.sliceStart,
    range.sliceEnd,
  );

  const [sizeX, sizeY] = schem.size;
  const schematic = makeOutSchematic(
    schem,
    [sizeX, sizeY, range.sliceWidth],
    outChunks,
    sliced,
  );

  return { schematic, assignedBlockdataCount: count };
}

export function splitSchematicByZ(
  schem: Schematic,
  sliceSize: number,
): Schematic[] {
  const [sizeX, sizeY, sizeZ] = schem.size;
  const chunkCountX = Math.ceil(sizeX / CHUNK_SIZE);
  const chunkCountY = Math.ceil(sizeY / CHUNK_SIZE);

  const chunkMap = buildChunkMap(schem.chunks);
  const ranges = computeAxisSliceRanges(sizeZ, sliceSize);

  const result: Schematic[] = [];
  let assignedCount = 0;

  for (const range of ranges) {
    const { schematic, assignedBlockdataCount } = buildSlicedSchematicZ(
      schem,
      chunkMap,
      range,
      chunkCountX,
      chunkCountY,
    );
    result.push(schematic);
    assignedCount += assignedBlockdataCount;
  }

  assertAllBlockdatasAssigned(schem.blockdatas.length, assignedCount);
  return result;
}

// ------------------------------------------------------------------
// 統一エントリポイント
// ------------------------------------------------------------------

export function splitSchematicByAxis(
  schem: Schematic,
  sliceSize: number,
  axis: "x" | "y" | "z",
): Schematic[] {
  switch (axis) {
    case "x":
      return splitSchematicByX(schem, sliceSize);
    case "y":
      return splitSchematicByY(schem, sliceSize);
    case "z":
      return splitSchematicByZ(schem, sliceSize);
  }
}
