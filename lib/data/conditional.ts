// 條件值（ConditionalMm）的共用存取：規則與 3D/2D 一律取 isDefault 那筆。

import type { ConditionalMm } from "@/lib/schema/common";

export function defaultEntry(list: ConditionalMm | undefined): ConditionalMm[number] | undefined {
  return list?.find((v) => v.isDefault);
}

export function defaultMm(list: ConditionalMm | undefined): number | undefined {
  return defaultEntry(list)?.mm;
}

/** isDefault 以外的條件 */
export function otherConditions(list: ConditionalMm | undefined): ConditionalMm {
  return list?.filter((v) => !v.isDefault) ?? [];
}
