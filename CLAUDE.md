# Expense Tracker: convenções do projeto

PWA de finanças pessoais, Mobile First, em HTML/CSS/JavaScript puro (ES Modules, sem frameworks e sem
build). Usado em iPhone e Android. Projeto de aprendizado: explique as decisões em português do Brasil.

## Comandos

- `npm start`: serve `src/` em http://localhost:8080
- `npm run check`: lint + formatação + testes unitários (rode antes de dar o trabalho por concluído)
- `npm run test:e2e`: Playwright (Android/Chromium, iPhone/WebKit, desktop)
- `npm run format`: aplica o Prettier

## Arquitetura (dependências só no sentido `ui` -> `data`/`domain`)

- `src/js/domain/`: funções puras. **Proibido** usar `document`, `window` ou `localStorage` aqui.
- `src/js/data/`: repositório assíncrono (contrato em `repositorio.js`), backup e preferências da interface.
  Só `repositorioLocalStorage.js` e `preferencias.js` conhecem o `localStorage`.
- `src/js/ui/`: telas e componentes. Monte o DOM com `h()` de `ui/dom.js`. **Nunca** use `innerHTML`.
- `src/js/pwa/`: instalação e registro do service worker.
- `src/sw.js`: service worker.

## Regras que não podem ser quebradas

- Dinheiro sempre em **centavos inteiros** (`valorCentavos`). Formate só na exibição (`domain/formato.js`).
- Datas como texto `YYYY-MM-DD`. Use `hojeISO()` (data local), nunca `toISOString()` para "hoje".
- Exclusão é **lógica** (`removidoEm`); não apague registros do armazenamento.
- Ao mudar o formato dos dados salvos, aumente `SCHEMA_VERSION` e escreva a migração.
- Arquivo novo, renomeado ou removido em `src/`: atualize `ARQUIVOS` em `src/sw.js`.
  O `VERSAO` do service worker é carimbado pelo CI; não precisa mexer à mão.
- Elementos usados em testes levam `data-testid`.
- CSS é Mobile First: estilos base para celular e `@media (min-width: ...)` só para acrescentar.
  Alvos de toque com pelo menos 44px (o projeto usa 48px) e campos com fonte de 16px ou mais.
- Acessibilidade: todo campo com `label`, erros ligados por `aria-describedby`, foco visível,
  contraste suficiente nos temas claro e escuro. O teste do axe precisa continuar passando.

## Estilo

- Identificadores, comentários e textos da interface em **português do Brasil**.
- Funções em camelCase, constantes em MAIÚSCULAS, arquivos em camelCase, CSS em BEM
  (`bloco__elemento--modificador`).
- Sem comentários óbvios: comente só o porquê não evidente.
- Prettier e ESLint mandam no estilo (`npm run format`, `npm run lint`).

## Testes

- Regra nova em `domain/` ou `data/` ganha teste unitário em `tests/unit/` (espelha `src/js`).
- Fluxo novo de interface ganha teste em `tests/e2e/`. A data é fixa (`AGORA` em `ajudantes.js`).
- Rode o e2e nos três projetos antes de fechar uma mudança visual.
