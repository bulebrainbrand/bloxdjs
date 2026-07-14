import type { ExportedMemberOfShouldReplace } from "./exportAdder";

export const generateFileNameMap = (
  data: Map<string, ExportedMemberOfShouldReplace>,
): Map<string, string> => {
  let number = 0;
  const map = new Map<string, string>();
  for (const name of data.keys()) {
    map.set(name, String(number++));
  }
  return map;
};
