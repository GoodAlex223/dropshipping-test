type MessageTree = { [key: string]: string | MessageTree };

/**
 * RU-over-UA message merge (spec §1): a missing or shape-mismatched RU key
 * silently keeps the UA value, so partial RU coverage never breaks the UI.
 */
export function deepMerge<T extends MessageTree>(base: T, override: MessageTree): T {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    if (typeof value === "string" && typeof current === "string") {
      out[key] = value;
    } else if (
      value !== null &&
      typeof value === "object" &&
      current !== null &&
      typeof current === "object"
    ) {
      out[key] = deepMerge(current as MessageTree, value);
    }
    // shape mismatch or key absent in base: keep base (uk is the schema)
  }
  return out as T;
}
