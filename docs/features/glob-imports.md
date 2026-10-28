# `import.meta.glob` no Turbopack (guias em Markdown)

## O que é

`import.meta.glob(padrão, opções)` importa todos os arquivos que casam com um glob, no estilo do Vite. O resultado é um objeto indexado pelo caminho relativo ao arquivo que chamou, com chaves sempre ordenadas (comparação de bytes). Com `{ eager: true }` os valores são os próprios módulos; sem ele, são funções que devolvem `Promise` do módulo.

O Turbopack não tem `?raw` embutido: a `query` só é repassada às regras de módulo. Quem decide que o `.md` vira string é uma regra em `turbopack.rules`.

## Versão

Disponível no Turbopack do Next 16.4.3 (não existe com webpack). Os tipos vêm em `next/types/global.d.ts` (`ImportMeta.glob<M>`). Opções aceitas: `eager`, `import`, `query` (string ou objeto), `base`, `caseSensitive`. O `as` do Vite e `import.meta.globEager()` não existem.

## Onde no código

- `apps/catalog/content/guides/*.md`: três guias (`caring-for-your-order`, `choosing-a-product`, `returns`). A primeira linha `# Título` é o título; os blocos seguintes, separados por linha em branco, são parágrafos.
- `apps/catalog/next.config.ts`: `turbopack.rules['*.md'] = { condition: { query: '?raw' }, type: 'text' }`. Só imports de `.md` com `?raw` viram módulo de texto (export `default` com o conteúdo).
- `apps/catalog/lib/guides.ts`: `import.meta.glob<{ default: string }>('../content/guides/*.md', { eager: true, query: '?raw' })`, mais `guides` (lista) e `getGuide(slug)`.
- `apps/catalog/app/catalog/[lang]/guides/page.tsx`: lista os guias com `<Link>` para `/catalog/<lang>/guides/<slug>`. O `<h1>` continua "Guides" (o `zones.spec` depende dele).
- `apps/catalog/app/catalog/[lang]/guides/[slug]/page.tsx`: `generateStaticParams` a partir de `guides`; `notFound()` para slug desconhecido.

## Desvios do brief

- **Glob em `lib/guides.ts`, não na página.** O brief punha o `import.meta.glob('../../../../content/guides/*.md', …)` direto em `guides/page.tsx`. Como a página do guia (`[slug]`) também precisa dos arquivos, o glob ficou num módulo só, com caminho relativo a `lib/`.
- **Sem `import: 'default'`.** Com `{ eager: true, query: '?raw', import: 'default' }` o 16.4.3 devolveu `undefined` em cada entrada (o build quebrou em `source.trim()`). Sem a opção `import`, cada entrada é um módulo com a chave `default` contendo a string, e o código lê `.default`.

## Como observar

1. `pnpm prod` e abra `http://localhost:3000/catalog/pt/guides`: três itens, na ordem das chaves do glob (`caring-for-your-order`, `choosing-a-product`, `returns`).
2. Crie `apps/catalog/content/guides/zz-test.md` com `# Teste` e rode `pnpm --filter catalog dev`: o item novo aparece sem mudar código. Apague depois.
3. `e2e/instant.spec.ts` › "guides list comes from markdown files".
