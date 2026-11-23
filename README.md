# Expense Tracker

Aplicativo de controle financeiro pessoal: registre receitas e despesas, acompanhe o saldo do mês e veja
relatórios. Funciona como **PWA instalável** (Android e iPhone), é **Mobile First** e **funciona offline**.

Feito com HTML5, CSS3 e JavaScript puro (sem frameworks). Os dados ficam no `localStorage` do aparelho.

## Para quem vai usar

O Expense Tracker mostra **quanto entrou, quanto saiu e quanto sobrou no mês**.

**Acesse:** https://rinaldo27.github.io/controle-gastos/

**O que ele faz**

- Registra receitas e despesas (valor, data e categoria), fixas ou variáveis.
- Mostra o saldo do mês e as despesas por categoria.
- Compara os últimos meses em gráfico e tabela.
- Gera o relatório do mês em PDF (resumo, despesas por categoria e lançamentos), para guardar ou compartilhar.
- Funciona sem internet e se instala no celular (veja [Instalar no celular](#instalar-no-celular)).

**Como usar**

1. Toque em **+ Novo** e registre cada receita ou despesa.
2. Veja o saldo em **Resumo** e a evolução em **Relatórios**.
3. Troque de mês com as setas **‹ ›**.

**Importante:** os dados ficam **só no seu celular**, sem conta e sem servidor. Se você trocar de aparelho
ou apagar os dados do navegador, perde tudo. Faça backup em **Ajustes > Exportar backup**.

## Para quem vai desenvolver

O restante deste documento é técnico: como rodar, testar, publicar e a arquitetura do projeto.

## Requisitos

- Node.js 22 ou mais novo (`nvm use` lê a versão do arquivo `.nvmrc`)

## Como rodar

```bash
npm install
npm start          # http://localhost:8080
```

O app usa ES Modules, então precisa de um servidor HTTP: abrir o `index.html` direto no navegador não funciona.

## Scripts

| Comando                | O que faz                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `npm start`            | Serve a pasta `src/` em `http://localhost:8080`                    |
| `npm test`             | Testes unitários (Node)                                            |
| `npm run test:e2e`     | Testes de navegador (Playwright: Android, iPhone e desktop)        |
| `npm run lint`         | ESLint                                                             |
| `npm run format`       | Formata o código com Prettier                                      |
| `npm run format:check` | Confere a formatação sem alterar arquivos                          |
| `npm run check`        | Lint, formatação e testes unitários (o que o CI roda antes do e2e) |

Na primeira vez, baixe os navegadores do Playwright: `npx playwright install chromium webkit`.

## Estrutura

```
src/                       tudo que é publicado
├── index.html
├── manifest.webmanifest   dados de instalação do PWA
├── sw.js                  service worker (cache offline)
├── css/style.css          Mobile First: o celular é o padrão, telas grandes só acrescentam
├── icons/
└── js/
    ├── app.js             inicialização e rotas (#/resumo, #/lancamentos, ...)
    ├── domain/            regras puras, sem DOM: cálculo, validação, datas, formatação
    ├── data/              repositório (localStorage) e backup
    ├── ui/                telas e componentes (montados sem innerHTML)
    └── pwa/               instalação e registro do service worker
tests/
├── unit/                  espelha src/js (domain, data) + consistência do PWA
└── e2e/                   Playwright: fluxos, acessibilidade, layout, backup, offline
```

## Decisões de arquitetura

- **Regras separadas da interface:** tudo em `domain/` é função pura e testável sem navegador.
- **Repositório trocável:** a interface só conhece `listar`, `obter`, `salvar`, `salvarVarios` e `remover`
  (assíncronos). Trocar `localStorage` por IndexedDB ou uma API não exige mexer nas telas.
- **Pronto para sincronizar no futuro:** ids UUID, `criadoEm`/`atualizadoEm`, exclusão lógica
  (`removidoEm`) e `schemaVersion` nos dados salvos. A importação já mescla por `id`, mantendo o registro
  mais recente.
- **Valores em centavos (inteiros):** evita erros de ponto flutuante.
- **Sem `innerHTML`:** o texto digitado pelo usuário nunca é interpretado como HTML.

## Publicar (GitHub Pages)

1. Crie o repositório no GitHub e envie a branch `main`.
2. Em **Settings > Pages > Source**, escolha **GitHub Actions**.
3. A cada push na `main`, o workflow `.github/workflows/publicar.yml` roda lint, testes unitários e de
   navegador e, se tudo passar, publica a pasta `src/`. Ele também carimba a versão do service worker com o
   commit, o que faz os celulares receberem a atualização.

## Instalar no celular

- **Android (Chrome):** abra a URL, vá em **Ajustes > Instalar aplicativo** (ou menu ⋮ > Instalar app).
- **iPhone (Safari):** abra a URL, toque em **Compartilhar > Adicionar à Tela de Início**.

> No iPhone, o app instalado guarda os dados **separados do Safari**. Instale antes de registrar dados
> reais, ou transfira com **Ajustes > Exportar backup** e **Importar backup**.

Os dados ficam só no aparelho. Exporte um backup de vez em quando.

## Ao mexer no código

- Criou, renomeou ou apagou um arquivo em `src/`? Atualize a lista `ARQUIVOS` em `src/sw.js`
  (o teste `tests/unit/pwa.test.js` avisa se esquecer).
- Rode `npm run check` antes de commitar e `npm run test:e2e` quando mexer em telas.
