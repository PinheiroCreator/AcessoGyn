# AcessoGyn

Plataforma colaborativa para registrar e visualizar problemas de acessibilidade urbana em Goiânia, Goiás.

Somente HTML, CSS e JavaScript puro. Sem back-end nesta fase: os relatos ficam salvos no navegador (`localStorage`).

## Como abrir

Abra `index.html` no navegador (duplo clique ou “Open with Live Server”).

## Divisão da equipe (2 pessoas)

### Pessoa 1 — Interface

Arquivos:

- `index.html`
- `relatar.html`
- `problemas.html`
- `style.css`
- `assets/images/` e `assets/icons/` (quando houver imagens)

Responsável por: textos, estrutura das páginas, cores, layout e versão no celular.

### Pessoa 2 — Lógica

Arquivo:

- `script.js`

Responsável por: menu no celular, validação do formulário, salvar/ler relatos e montar a lista.

Combinado entre as duas pessoas: **não mudar os `id` dos campos** (`botao-menu`, `menu-principal`, `formulario-relato`, `campo-titulo`, `campo-tipo`, `campo-bairro`, `campo-endereco`, `campo-descricao`, `mensagem-formulario`, `lista-problemas`). O JavaScript depende desses nomes.

## O que cada arquivo faz

| Arquivo | Função |
|---|---|
| `index.html` | Página inicial: apresentação e botões para relatar ou ver problemas. |
| `relatar.html` | Formulário para cadastrar um problema. |
| `problemas.html` | Lista dos problemas salvos neste navegador. |
| `style.css` | Visual (azul, verde e branco) e layout responsivo. |
| `script.js` | Menu, gravação dos relatos e exibição da lista. |
| `assets/` | Pasta para imagens e ícones. |
| `.gitignore` | Arquivos que o Git não deve versionar. |

## Fluxo

1. A pessoa abre `index.html`.
2. Em `relatar.html`, preenche o formulário. O JavaScript grava o relato no navegador.
3. Em `problemas.html`, o JavaScript lê esses relatos e mostra os cards.
