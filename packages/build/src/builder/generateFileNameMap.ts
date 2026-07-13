export const generateFileNameMap = (data: {
  shouldReplaceImportFiles: Set<string>;
  shouldReplaceExportFiles: Partial<
    Record<
      string,
      | {
          type: "part";
          member: Set<string>;
        }
      | {
          type: "all";
        }
    >
  >;
}): Map<string, string> => {
  let number = 0;
  const map = new Map<string, string>();
  for (const name of Object.keys(data.shouldReplaceExportFiles)) {
    map.set(name, String(number++));
  }
  return map;
};
