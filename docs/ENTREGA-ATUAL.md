# Entrega — EcoQuest narrativo

## Base e decisões

A base encontrada nesta rodada já possuía React/TypeScript/Vite, R3F/Drei/Three, Zustand, gestores, save, dois desafios, retrato e composição urbana. A evolução anterior e o estado original estão registrados em AUDITORIA.md e AUDITORIA-V2.md. A revisão desta rodada está em AUDITORIA-ATUAL.md.

Mantidos: economia, progressão, save, câmera dirigida, camadas de consequências, pipeline de modelos, UI HTML e instancing. Refatorados nesta revisão: personagem e nome da região de cada problema agora vêm do conteúdo. A introdução já aceita personagem por nó. Substituídos ao longo da evolução: cidade exclusivamente procedural e diálogo básico por modelos GLB e palco com retrato, placa, escolhas e objetivos. Nenhum sistema funcional foi descartado nesta rodada. Nenhuma nova dependência foi adicionada nesta revisão; a evolução do pipeline adicionou @gltf-transform/core/functions, documentados no relatório V2.

## Arquitetura final

`src/app` inicializa a aplicação; `game` contém regras, câmera e persistência; `stores` coordena ações; `content` define história, personagens, problemas e perguntas; `assets` resolve IDs; `config` compõe bairros e infraestrutura; `components` renderiza o mundo; `ui` contém diálogo, escolhas, HUD e menus. `scripts/blender` produz arquivos editáveis em `assets-source` e GLBs otimizados em `public/assets/models`. Testes ficam em `tests` e evidências em `docs/screenshots`.

Fluxo: introdução → mapa → marcador → aproximação → contexto → três alternativas → custo validado → consequência visual → explicação → retorno → próximo problema. FULL aplica melhoria definitiva, TEMPORARY aplica adaptação parcial com recorrência e NONE mantém o problema. O save restaura moedas, decisões, tutorial, cursor narrativo e configurações.

## Como expandir

- **Retrato/personagem:** cadastre retrato por ID em `src/assets/registry.ts` e personagem em `src/content/characters.ts`; use `characterId` no nó de `dialogues.ts` ou no problema de `problems.ts`. `regionName` configura a legenda local. O protagonista no mundo continua usando o ID `hero`.
- **Modelo da cidade:** substitua a URL do ID lógico no registry. Transformações ficam em `config/world.ts` e `config/districts.ts`. Para reexportar: `npm run assets:build`.
- **Textura:** configure `materials` no registry; materiais internos de GLBs são alterados no Blender/script e reexportados.
- **Problema:** acrescente ID, categoria, região, personagem, pergunta, câmera, camadas visuais e condições de desbloqueio em `content/problems.ts`; conecte `nextProblems` e registre os assets. Mudanças de IDs exigem migração de save.
- **Pergunta:** em `content/questions.ts`, forneça exatamente três alternativas com custo, eficácia, explicação, consequência e estado resultante.
- **Categoria:** estenda `Category` em `game/types.ts` e seus metadados em `content/problems.ts`.

## Validação e limites

Build TypeScript/Vite aprovado. 22 testes unitários aprovados após a parametrização narrativa. A suíte completa de navegador passou com 12 cenários em desktop, Pixel 7 emulado e 360 × 640 antes desse último ajuste de metadados. Capturas do fluxo desktop e mobile verificam a apresentação final. Cobertura inclui retrato, nome, escolhas, câmera, custos, saldo insuficiente, três consequências, recorrência, desbloqueio, tutorial e reload.

Há 22 GLBs, aproximadamente 1,12 MB após otimização. A referência inspira o diorama e a composição narrativa; o jogo não reproduz sua densidade ou acabamento de ilustração. A praça e o jardim têm os dois problemas jogáveis; outras regiões são cenográficas. Os cinco temas estão registrados, mas segurança, natureza e saúde ainda precisam de conteúdo jogável. Não há exploração livre, física, multiplayer ou inventário.

O bundle 3D ainda gera aviso de tamanho no Vite. 30/60 FPS não foram certificados em dispositivos físicos. Próximos passos: revisão pedagógica, medição Android/iOS, refinamento de arte e novos capítulos usando os contratos existentes.
