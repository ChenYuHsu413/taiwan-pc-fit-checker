import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("toolchain smoke test", () => {
  it("vitest 與 zod 可正常執行", () => {
    expect(z.number().positive().safeParse(1).success).toBe(true);
  });
});
