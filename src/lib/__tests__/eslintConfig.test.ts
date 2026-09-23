// @vitest-environment node
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const cwd = fileURLToPath(new URL("../../../", import.meta.url));
async function lint(code: string) {
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: `${cwd}eslint.config.mjs`,
  });
  const [result] = await eslint.lintText(code, {
    filePath: "src/components/ContractFixture.tsx",
  });
  return result;
}

describe("repository ESLint configuration", () => {
  it("requires framework navigation in TripperTopbar", async () => {
    const eslint = new ESLint({ cwd });
    const [result] = await eslint.lintFiles([
      "src/components/tripper/TripperTopbar.tsx",
    ]);
    expect(result.messages).toEqual([]);
  });

  it("accepts a valid stateful React component without diagnostics", async () => {
    const result = await lint(`
      import { useState } from "react";
      export default function Counter() {
        const [count, setCount] = useState(0);
        return <button onClick={() => setCount(count + 1)}>{count}</button>;
      }
    `);
    expect(result.messages).toEqual([]);
    expect(result.errorCount + result.warningCount).toBe(0);
  });

  it("rejects a conditional hook with the real hooks diagnostic", async () => {
    const result = await lint(`
      import { useState } from "react";
      export default function Counter({ enabled }: { enabled: boolean }) {
        if (enabled) {
          const [count] = useState(0);
          return <p>{count}</p>;
        }
        return null;
      }
    `);
    expect(
      result.messages.map(({ ruleId, severity }) => ({ ruleId, severity })),
    ).toEqual([{ ruleId: "react-hooks/rules-of-hooks", severity: 2 }]);
  });
});
