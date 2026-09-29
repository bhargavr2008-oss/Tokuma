// Minimal TypeScript loader: the engine modules are plain TS with no JSX, so
// stripping the types is enough to run them under node:test.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import ts from 'typescript';

export function resolve(specifier, context, next) {
  const fromTs = context.parentURL?.endsWith('.ts');
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/.test(specifier)) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return { url: candidate.href, format: 'module', shortCircuit: true };
  }
  if (fromTs && specifier.endsWith('.ts')) {
    return { url: new URL(specifier, context.parentURL).href, format: 'module', shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (!url.endsWith('.ts')) return next(url, context);
  const source = await readFile(new URL(url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: 'module', source: outputText, shortCircuit: true };
}
