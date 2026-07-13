export const generateFileNameMap = (
  data: Partial<
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
  >,
): Map<string, string> => {
  let number = 0;
  const map = new Map<string, string>();
  for (const name of Object.keys(data)) {
    map.set(name, String(number++));
  }
  return map;
};
