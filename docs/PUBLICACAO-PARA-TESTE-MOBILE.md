# Publicação para teste no celular

## Endereço permanente — ativo

https://emanuelcandido.github.io/Jogo_INOVATECH/

Publicado inicialmente no GitHub Pages em 16/09/2026, com HTTPS e acesso público sem login. Funciona independentemente deste computador. O GitHub confirmou o estado `built` para a primeira publicação `d8a9f53a8c739477595bec01270d85c31dcb958d`, da branch exclusiva `codex/public-game` no repositório existente.

A build usa `--base=/Jogo_INOVATECH/`; modelos e imagens em JavaScript usam `publicAsset`, enquanto Vite ajusta HTML e CSS. Build TypeScript/Vite aprovada e nove testes de caminhos e materiais aprovados. No endereço permanente, o teste com toque e viewport 390 × 844 concluiu o tutorial e abriu o mapa: 77 modelos carregados, sem erros ou transbordamento horizontal. Evidências em `.tools/public-preview/github-pages.json` e `github-mobile.png`.

Para atualizar, gerar novamente a build com esse mesmo `base` e publicar somente sua saída na branch `codex/public-game`. O checkout de publicação está em `.tools/github-pages`. A branch `main` não foi alterada por essa publicação. O endereço permanente substitui o túnel temporário abaixo; o Sites não é necessário para mantê-lo funcionando.

**Enviar o código para `main` não atualiza o site.** Na investigação dos diálogos móveis, o HTML público ainda apontava para `index-BfS0xeHk.js` e `index-8elQcyNL.css`, da publicação `517cead`. Esse CSS conservava o retrato de 100 px à direita, mesmo após a restauração no código-fonte. A atualização deve incluir o checkout de publicação e a conferência dos arquivos realmente servidos pelo endereço público.

## Correção dos diálogos móveis — 16/09/2026

A build ajustada com prévia de 3,5 segundos e retrato aproximadamente 20% menor, alinhado à esquerda conforme a composição do Figma, usa `index-D10WywSE.js` e `index-DYwjYy0k.css`. Ela mantém o botão de voltar, a entrada animada e a proteção contra toque duplo. O card de zoom foi removido; gestos e teclado continuam disponíveis. A validação local inclui o cancelamento/reabertura da prévia, ausência de diálogo durante a espera, movimento reduzido, rotação e preservação das moedas. Os testes estão em `tests/e2e/problem-framing.spec.ts`, `choice-input.spec.ts`, `hud.spec.ts` e `navigation.spec.ts`.

Depois de enviar a branch de publicação, aguardar o GitHub Pages e conferir que o HTML remoto aponta para esses mesmos arquivos. Os nomes contêm hashes de conteúdo: uma build antiga no site é uma publicação pendente, não uma falha que deva ser resolvida apagando o progresso do jogador.

## Loja e missões — 21/09/2026

A versão com os novos atalhos e telas do Figma usa `index-DD-gIv7w.js` e `index-CBsqJPHb.css`. Inclui 18 acessórios em três categorias, prévia de combinações, compra com moedas da cidade e visual persistente nas cinco poses do Impactus. Saves anteriores recebem o inventário inicial sem perder a história. A arte e o prompt de limpeza do personagem estão documentados em `assets-source/ui/wardrobe/README.md`.

As missões têm progresso diário, recompensas de resgate único e bônus. O painel mantém o acesso à lista de problemas da cidade. A loja e as missões bloqueiam a interação com o mapa enquanto estão abertas e devolvem o foco ao botão de origem ao fechar. O retrato se adapta à altura disponível sem deformar a imagem; a prévia de 3,5 segundos e a proteção contra toque duplo continuam ativas.

Validação: TypeScript, build com o prefixo do Pages, 35 testes unitários, 18 testes de interface em desktop e dois tamanhos de celular, além dos testes de enquadramento e toque duplo com e sem movimento reduzido. `tests/e2e/wardrobe.spec.ts` cobre compra, saldo exato, combinações, persistência, descarte de prévia, recompensas e teclado; também verifica a loja em paisagem.

## Correção de encaixe das jaquetas e chapéus

A correção usa `index-us2VH2Ly.js` e `index-BBYldPko.css`. Jaquetas e chapéus passam a usar imagens com volume e iluminação compatíveis com o Impactus, compartilhadas com as miniaturas da loja. O encaixe varia entre as cinco poses; máscaras conservam as mãos/queixo à frente da roupa sem repintar a capa. A composição reserva espaço para os chapéus mais altos.

Os IDs dos itens e o formato do save permanecem compatíveis com os acessórios já comprados. Os sete WebPs novos ficam em `public/assets/accessories/rendered`, e os fontes/prompts e o processo de recorte estão documentados em `assets-source/ui/wardrobe/README.md`. TypeScript, build e dez testes de interface em desktop/celular aprovados, incluindo os seis chapéus, as seis jaquetas, compra, persistência, remoção e comparação de pixels da capa.

## Encaixe por pose e atalhos à direita — 22/09/2026

Build: `index-CwQf1s4S.js` e `index-6C66uAVE.css`. As jaquetas usam contornos separados de tronco e mangas para acompanhar as cinco poses, com tecido proporcional e mãos à frente. Chapéu maré, boina e boné ocultam as aberturas vazias que devem ser ocupadas pela cabeça. Experimentar um chapéu na loja mantém o tamanho e a posição do corpo.

Missões e Loja ficam à direita, abaixo do cabeçalho, com recuo de área segura no celular. Inventário, preços, compras e formato do save permanecem compatíveis. O diagnóstico das camadas está em `assets-source/ui/wardrobe/README.md`.

Validação: TypeScript e build aprovados; os seis cenários de interface foram verificados em desktop e celular de 360 × 640, incluindo rotação para paisagem. As comparações de imagem mantêm o mesmo estado do aviso de prévia e aceitam somente arredondamento de até 1/255 por canal de cor. Capturas da navegação, seis combinações e diálogos ficam em `test-results`; comparações isoladas ficam em `test-results/fit-regression`.

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
