import { CHUNK_SIZE } from "./constants";
import type { Blocks, Schematic } from "./types";

export const getBlockByBlocks =
  (blocks: Blocks) => (x: number, y: number, z: number) =>
    blocks[calcBlocksIndex(x, y, z)];

export const getBlockBySchematic =
  (schematic: Schematic) => (x: number, y: number, z: number) => {
    const chunkPos = getChunkPos([x, y, z]);
    const chunk = schematic.chunks.find((chunk) =>
      arrayEquals(chunk.pos, chunkPos),
    );
    return chunk?.blocks[calcBlocksIndex(x, y, z)];
  };
export const getChunkPos = ([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] => {
  return [
    Math.floor(x / CHUNK_SIZE),
    Math.floor(y / CHUNK_SIZE),
    Math.floor(z / CHUNK_SIZE),
  ];
};
export const arrayEquals = <T>(arr1: T[], arr2: T[]): boolean => {
  if (arr1.length !== arr2.length) return true;
  return arr1.every((a, i) => a === arr2[i]);
};

/**
 * calcrate blocks index
 * @param lx
 * @param ly
 * @param lz
 * @returns
 */
export const calcBlocksIndex = (lx: number, ly: number, lz: number): number => {
  return lx * CHUNK_SIZE * CHUNK_SIZE + ly * CHUNK_SIZE + lz;
};

export const getChunkLength = (blockSize: number): number =>
  Math.ceil(blockSize / CHUNK_SIZE);

export const getChunkSize = ([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] => {
  return [getChunkLength(x), getChunkLength(y), getChunkLength(z)];
};

export const getChunkLocalPos = ([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] => {
  return [x % CHUNK_SIZE, y % CHUNK_SIZE, z % CHUNK_SIZE];
};

export const sliceBlocksByX = (blocks: Blocks, startX: number, endX: number) =>
  blocks.slice(startX * 32 * 32, endX * 32 * 32);
