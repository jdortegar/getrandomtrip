// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

// Next 16's generated next-types-plugin contract. Inspect source without
// importing entries: imports could initialize auth, providers, or the database.
const segmentExports = [
  "config",
  "generateStaticParams",
  "unstable_instant",
  "unstable_dynamicStaleTime",
  "revalidate",
  "dynamic",
  "dynamicParams",
  "fetchCache",
  "preferredRegion",
  "runtime",
  "maxDuration",
];
const pageExports = [
  "default",
  "metadata",
  "generateMetadata",
  "viewport",
  "generateViewport",
];
const routeExports = [
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];

function entryFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      return entry.name === "__tests__" ? [] : entryFiles(path);
    return /^(page|layout|route)\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

function valueExports(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  return source.statements.flatMap((statement) => {
    if (ts.isExportAssignment(statement))
      return [statement.isExportEquals ? "export=" : "default"];
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) return [];
      if (!statement.exportClause) return ["export *"];
      return ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements
            .filter((item) => !item.isTypeOnly)
            .map((item) => item.name.text)
        : [statement.exportClause.name.text];
    }
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;
    if (
      !modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    )
      return [];
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      modifiers.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword,
      )
    )
      return [];
    if (
      modifiers.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
      )
    )
      return ["default"];
    if (ts.isVariableStatement(statement))
      return statement.declarationList.declarations.map((declaration) =>
        declaration.name.getText(source),
      );
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    )
      return statement.name ? [statement.name.text] : [];
    return [statement.getText(source)];
  });
}

it("keeps custom helpers out of every Next page, layout, and route entry point", () => {
  const root = join(process.cwd(), "src/app");
  const entries = entryFiles(root);
  expect(entries.length).toBeGreaterThan(100);
  const violations = entries.flatMap((file) => {
    const isRoute = /[/\\]route\.[jt]sx?$/.test(file);
    const allowed = new Set([
      ...segmentExports,
      ...(isRoute ? routeExports : pageExports),
    ]);
    return valueExports(file)
      .filter((name) => !allowed.has(name))
      .map((name) => `${relative(root, file)}: ${name}`);
  });
  expect(violations).toEqual([]);
});
