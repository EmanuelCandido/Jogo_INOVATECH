# Publicação para teste no celular

## Endereço permanente — ativo

https://emanuelcandido.github.io/Jogo_INOVATECH/

Publicado no GitHub Pages em 16/09/2026, com HTTPS e acesso público sem login. Funciona independentemente deste computador. O GitHub confirmou o estado `built` para a publicação `d8a9f53a8c739477595bec01270d85c31dcb958d`, da branch exclusiva `codex/public-game` no repositório existente.

A build usa `--base=/Jogo_INOVATECH/`; modelos e imagens em JavaScript usam `publicAsset`, enquanto Vite ajusta HTML e CSS. Build TypeScript/Vite aprovada e nove testes de caminhos e materiais aprovados. No endereço permanente, o teste com toque e viewport 390 × 844 concluiu o tutorial e abriu o mapa: 77 modelos carregados, sem erros ou transbordamento horizontal. Evidências em `.tools/public-preview/github-pages.json` e `github-mobile.png`.

Para atualizar, gerar novamente a build com esse mesmo `base` e publicar somente sua saída na branch `codex/public-game`. O checkout de publicação está em `.tools/github-pages`. A branch `main` não foi alterada por essa publicação. O endereço permanente substitui o túnel temporário abaixo; o Sites não é necessário para mantê-lo funcionando.

## Primeiro endereço temporário

Disponibilizada em 16/09/2026, com acesso público e sem login:

https://circumstances-wilson-most-goat.trycloudflare.com

É uma URL temporária do Cloudflare Quick Tunnel. Depende deste computador ligado, conectado e com o servidor e o túnel em execução. Ao encerrar o túnel, este endereço deixa de funcionar; uma nova execução normalmente gera outro endereço.

## Versão disponibilizada

- Snapshot de produção em `.tools/ecoquest-public/dist`, compilado com TypeScript e Vite.
- Inclui as alterações locais de interface e otimização existentes no momento da publicação; preserva os modelos e as opções gráficas.
- A seleção experimental do caminho de renderização permanece desativada no acesso normal.
- O servidor `scripts/serve-public-build.mjs` carrega apenas os arquivos da build em memória, atende em `127.0.0.1:4184` e aplica compressão gzip sem perda. Alterar o código local não atualiza automaticamente esta publicação.
- O túnel encaminha o acesso público somente para esse servidor. Os logs e identificadores dos processos ficam em `.tools/public-preview`.

## Validação

- HTML, JavaScript, CSS, modelo GLB, fonte e imagem retornaram HTTP 200 pela URL pública.
- Rotas de código-fonte e configuração Git retornaram HTTP 404.
- Chrome com viewport móvel de 390 × 844 e toque: abertura, apresentação, tutorial e entrada no mapa concluídos; canvas e dois marcadores presentes.
- Sem erros JavaScript ou respostas HTTP de erro durante o fluxo; sem transbordamento horizontal. Diagnóstico de benchmark ausente no acesso normal.
- Evidências: `.tools/public-preview/verification.json`, `mobile-intro.png` e `mobile.png`.

Essa verificação confirma o acesso e o fluxo em uma tela móvel emulada. O desempenho em um celular físico ainda precisa ser medido; não comprova 60 fps.

## Tentativa anterior no Sites

O Sites criou o projeto `appgprj_6aaa5865caac819196c41869d44a5bb0` e confirmou acesso público, mas a conexão passou a retornar “project not found” e a lista de projetos vazia antes do envio e da implantação. Nenhuma versão foi implantada no Sites. É necessário recuperar o acesso ao projeto para retomar a publicação permanente, sem criar um projeto duplicado.
