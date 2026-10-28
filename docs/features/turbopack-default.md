# Turbopack como bundler padrão

## O que é

Desde o Next 16.0, `next dev` e `next build` usam o Turbopack sem nenhuma flag. O webpack só entra se pedido (`--webpack`), e o projeto não pede.

## Versão

Next 16.4.3. O banner do `next dev` confirma: `▲ Next.js 16.4.3 (Turbopack)`. Várias features do lab só existem no Turbopack: `import.meta.glob` (ver `glob-imports.md`), `next experimental-analyze` (ver `bundle-analyzer.md`), as flags `turbopack*` (ver `turbopack-flags.md`) e `turbopackRustReactCompiler` (ver `react-compiler.md`).

## Onde no código

Nenhum arquivo liga o Turbopack: ele é o padrão em `apps/shell`, `apps/catalog` e `apps/account`. A configuração específica fica em `turbopack.rules` de `apps/catalog/next.config.ts` (`*.md` com `?raw` vira texto). O remote `apps/widgets` **não** usa Turbopack: é Rsbuild, pelos motivos em `module-federation.md`.

## Como observar

- `pnpm --filter catalog dev` imprime `(Turbopack)` no banner.
- `pnpm --filter catalog build` roda a etapa de compilação do Turbopack; o `.next` gerado é o mesmo layout do App Router de sempre.
