import type { ShouldReplaceExport } from "./exportAdder";

export const convertShouldReplaceExportData = (
  shouldReplaceData: Partial<
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
): Map<string, ShouldReplaceExport> => {
  return new Map(
    Object.entries(shouldReplaceData).map(([filename, data]) => [
      filename,
      data?.type === "all" ? "All" : (data?.member ?? new Set()),
    ]),
  );
};
