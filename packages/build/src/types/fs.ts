import * as fs from "fs";
export type FullFsClient = typeof fs;

export type ReadonlyDirFsClient = Pick<
  FullFsClient,
  "readdir" | "readdirSync" | "realpathSync" | "readlinkSync" | "lstatSync"
> & {
  promises: Pick<FullFsClient["promises"], "realpath" | "readdir" | "lstat">;
};

export type ReadonlyFsClient = Pick<
  FullFsClient,
  | "readdir"
  | "readdirSync"
  | "realpathSync"
  | "readlinkSync"
  | "lstatSync"
  | "readFile"
  | "readFileSync"
> & {
  promises: Pick<
    FullFsClient["promises"],
    "realpath" | "readdir" | "lstat" | "readFile"
  >;
};
