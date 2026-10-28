# Imagem Open Graph (`opengraph-image.tsx` + `ImageResponse`)

## O que é

Um arquivo `opengraph-image.tsx` num segmento gera a imagem de compartilhamento daquela rota e o Next injeta as `<meta property="og:image…">` no `<head>`. `ImageResponse` (de `next/og`) converte JSX com estilos inline (subconjunto de flexbox) em PNG.

## Versão

Convenção desde 13.3; `params` é `Promise` desde 16.0. Lab em 16.4.3.

## Onde no código

`apps/catalog/app/catalog/[lang]/products/[id]/opengraph-image.tsx`: lê `lang` e `id` de `params`, busca o produto com `getProduct(id, lang)` e desenha nome e preço formatado (BRL para `pt`, USD para `en`) em 1200×630. Idioma inválido, id não numérico ou produto inexistente → `notFound()`.

O layout `[lang]` define `metadataBase` a partir de `SHELL_URL` (padrão `http://localhost:3000`), para a URL absoluta da imagem apontar para o shell (a porta que o usuário usa) e o build não avisar sobre `metadataBase` ausente.

`opengraph-image` é um Route Handler especializado, então `next/root-params` não está disponível ali: o idioma vem de `params`, não de `lang()`. No build ele aparece como `ƒ` (gerado por requisição).

## Como observar

- `http://localhost:3000/catalog/pt/products/1/opengraph-image` → PNG com "Produto 1" e "R$ 11,00"; em `/catalog/en/...` → "Product 1" e "$11.00".
- O HTML de `/catalog/pt/products/1` traz `<meta property="og:image" …/opengraph-image?…>`.
- Coberto por "opengraph image is generated" em `e2e/catalog.spec.ts`.
