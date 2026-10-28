# `agentUpgrade` e o `AGENTS.md` versionado

## O que é

Duas coisas do Next 16.4 voltadas a agentes de código:

1. **`AGENTS.md` gerenciado.** `next dev` cria (ou atualiza) um `AGENTS.md` na pasta do app, com um bloco entre marcadores que manda o agente ler a documentação embutida em `node_modules/next/dist/docs/` antes de escrever código. Só o conteúdo entre os marcadores é reescrito; o resto do arquivo é preservado.
2. **`experimental.agentUpgrade`.** Define a política padrão de `next upgrade --agent` e dos lembretes de upgrade em `next dev`/`next build`.

## Versão

Next 16.4.3 (`agentUpgrade` entrou na 16.4.0). Valores aceitos, conforme `config-shared.d.ts` e a documentação instalada: `'security' | 'latest' | 'experimental-future' | false`.

## Onde no código

- `apps/shell/next.config.ts`: `experimental.agentUpgrade: "security"`.
- `apps/shell/AGENTS.md`, `apps/catalog/AGENTS.md`, `apps/account/AGENTS.md`: gerados por `next dev` em cada zona e commitados. São idênticos entre si.

## O que o bloco versionado contém

Log do `next dev` na primeira execução de cada zona:

```
✓ Generated AGENTS.md for AI agents. Set `agentRules: false` in next.config to disable.
```

Conteúdo do arquivo (entre `<!-- BEGIN:nextjs-agent-rules -->` e `<!-- END:nextjs-agent-rules -->`):

- título "This is NOT the Next.js you know";
- o aviso de que esta versão tem breaking changes e que o agente deve ler o guia relevante em `node_modules/next/dist/docs/` (resolvido a partir da pasta do arquivo, porque em monorepo o `next` pode não estar visível na raiz) antes de codar;
- a nota de que o bloco é escrito e re-adicionado pelo `next dev`, e que commitá-lo mantém a árvore limpa (apagá-lo só recria a mudança). É o motivo de os três arquivos estarem no repositório.

O bloco não menciona `agentUpgrade` nem a versão do Next. Em monorepo, cada zona tem o seu arquivo, porque o `next dev` escreve na pasta do app que ele serve.

## O que `agentUpgrade: 'security'` muda

Na prática, nada de novo neste projeto: `'security'` é o padrão do 16.4.3 (a config resolvida mostra `agentUpgrade: "security"` mesmo sem a opção), então a linha no shell só torna a política explícita. A política `security` verifica instalações estáveis contra avisos de segurança e recomenda um upgrade seguro quando existe um.

O lembrete só aparece se houver o que avisar:
- terminal interativo: um prompt com "Upgrade now", "Skip" ou "Skip until next version" (10 s sem resposta = pula; o comando continua por trás e o log é reenviado depois);
- quando o comando roda dentro de um agente de código: o primeiro lembrete elegível interrompe o comando com instruções para reportar o upgrade, e repetir o comando continua a tarefa com um aviso.

## Como observar

- `next dev` do shell, catálogo e conta e `next build` do monorepo não imprimiram nenhum lembrete de upgrade e nenhuma linha sobre `agentUpgrade`. Honesto: com a política `security` e sem aviso aplicável ao 16.4.3, a opção é silenciosa. Também não aparece na lista de "Experiments" do log.
- Para ver o efeito: trocar para `'latest'` (que recomenda uma versão mais nova disponível) ou rodar `pnpm --filter shell exec next upgrade --agent=security` (monta a tarefa de upgrade para um agente). Não rodei, para não alterar a versão do Next do laboratório.
- O artefato observável e versionado é o próprio bloco do `AGENTS.md`: apague-o, suba o `next dev` e ele volta (`git status` mostra a mudança).
