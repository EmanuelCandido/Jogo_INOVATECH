# EcoQuest — evolução narrativa e visual

## Auditoria e decisões

A base anterior era um vertical slice funcional: React/TypeScript/Vite, Three/R3F/Drei, Zustand, praça com seis prédios procedurais, Salvador geométrico, perguntas externas à UI, dois problemas, câmera interpolada, economia e save local. A classificação anterior à alteração está em `AUDITORIA-V2.md`.

**Mantido:** IDs, custos, perguntas, estados, regras de economia, recompensas únicas, progressão, recorrência, adapter de save, tutorial, acesso por toque/teclado, controles de qualidade e renderização sob demanda.

**Refatorado:** NarrativeManager, store, leitura de save, enquadramentos, registry, composição urbana e renderizador de lotes. A infraestrutura agora também é composta por dados e utiliza instancing.

**Substituído:** apresentação de diálogo com inicial do personagem e painéis de formulário por palco de personagem, placa de nome, caixa inferior e escolhas narrativas. Modelos principais antes procedurais foram substituídos por GLBs modulares; os procedurais pequenos compatíveis continuam disponíveis.

**Removido:** CSS antigo dos painéis e o componente monolítico de UI. Não foram removidos saves ou funcionalidades de gameplay existentes.

## Arquitetura e pastas

```text
src/
  app/                 aplicação, Canvas lazy, tratamento de erro
  assets/registry.ts   modelos, materiais, texturas, retratos, mídia
  components/
    city/AssetBatch    instancing de GLBs estáticos e volumes básicos
    environment/      rio e infraestrutura a partir de configurações
    City, Asset       composição e carregamento de assets
  config/              mundo, distritos, vias, rio, vegetação, posições
  content/             personagens, diálogos, problemas, perguntas, história
  game/                narrativa, câmera, economia, problemas, save, tipos
  stores/              estado global e gravação
  ui/
    dialogue/          CharacterStage, DialogueStage
    choices/           ChoiceList reutilizável
    hud/               objetivos
    menus/             configurações
    GameUI             composição do HUD
assets-source/         fontes Blender e relatório de otimização
public/assets/
  models/              17 GLBs finais
  portraits/           retratos de Salvador
scripts/
  blender/             geração autoral de módulos
  build-assets.ps1     Blender + otimização
  optimize-assets.mjs  glTF-Transform
  capture.mjs          capturas desktop/mobile
tests/                 regras, narrativa e navegador
```

O fluxo continua `UI → store → regra pura → progresso → save + renderização`. A UI não calcula progressão ou resolve problemas. `CameraRig` continua sendo o único componente que altera a câmera. A interpolação agora usa tempo real: FPS baixo não alonga artificialmente a duração.

## Diálogo

`content/dialogues.ts` contém nós com ID, personagem, título, texto, próximo nó, ação ou choices. `NarrativeManager` interpreta somente eventos tipados (`NEXT_LINE`, `SHOW_CITY`, `SHOW_QUESTION`, `RETURN_CITY`). A introdução inclui uma resposta opcional que explica o papel do jogador antes de revelar o mapa.

`DialogueStage` integra esses nós à descoberta, pergunta e consequência dos problemas. `CharacterStage` resolve o retrato por ID. `ChoiceList` aceita tanto respostas narrativas quanto soluções com custos. Os textos de problema, pergunta e explicação continuam nos arquivos de conteúdo anteriores.

No desktop, Salvador ocupa o primeiro plano à esquerda; escolhas aparecem acima da caixa inferior. No celular, ele fica no espaço superior e não bloqueia escolhas; painel tem rolagem quando necessário e ações permanecem disponíveis. Não foram implementados auto/skip que pulem decisões ou gastos.

O cursor `dialogueNodeId` é salvo. Saves anteriores sem cursor são migrados a partir de `introIndex`, preservando moedas, decisões, configurações e tutorial. Ramo opcional também pode ser retomado após reload.

## Cidade e arte

A praça original segue como núcleo jogável, cercada por centro, residências, hospital, escola/quadra, estufa/parque, rio com duas pontes e área industrial. Apenas os dois problemas existentes são jogáveis; os outros distritos estabelecem contexto visual para expansão.

Foram criados 17 modelos autorais no Blender: três variações de edifício, hospital, escola, fábrica, edifício cívico, estufa, árvore, pinheiro, poste, dois carros decorativos, turbina, rocha, arbusto e Salvador. Os edifícios usam painéis solares, janelas, varandas e vegetação de cobertura. O conjunto mantém cores e escala consistentes.

A direção do diálogo usa verde profundo, dourado e retrato ilustrado. A referência medieval inspirou hierarquia e composição, sem copiar personagem, texto ou cenário. A cidade continua sendo geometria 3D interativa, não uma imagem da referência aplicada como fundo.

## Dependências e pipeline

Adicionadas somente em desenvolvimento: `@gltf-transform/core` e `@gltf-transform/functions`. Blender 4.5.0 portátil foi usado em `.tools/`, sem instalação global. O jogo e o build web não precisam do Blender; todos os GLBs finais já estão em `public/assets/models`.

```powershell
npm run assets:build
# Ou, com outro Blender instalado:
powershell -File scripts/build-assets.ps1 -BlenderPath 'C:\caminho\blender.exe'
```

O script cria arquivos `.blend`, exporta GLB e executa weld/dedup/prune. O relatório com tamanho antes/depois e meshes está em `assets-source/optimization-report.json`. Materiais convertem a paleta sRGB para valores lineares antes da exportação. Não há texturas pesadas ou decoder remoto obrigatório nos GLBs atuais.

Otimização medida: **467.528 → 355.072 bytes**, redução de **24%** no conjunto dos 17 GLBs.

Documentação utilizada: [Blender oficial](https://www.blender.org/download/) e [glTF-Transform CLI/SDK](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/docs/src/lib/pages/cli.md). Rapier/BVH/postprocessing continuam sem aplicação necessária neste recorte. Ecctrl não foi instalado porque não há exploração livre.

## Como trocar conteúdo e assets

**Personagem/retrato:** em `content/characters.ts`, cada personagem informa nome, papel, `portraitId` e `modelId`. Registre o caminho em `portraits`, dentro de `assets/registry.ts`. Em `content/dialogues.ts`, escolha `characterId` por fala. Para substituir Salvador no mundo, troque a entrada `hero` por outro GLB.

**Modelo da cidade:** altere o caminho de um ID lógico no registry, por exemplo `building.hospital`. Posição/escala/rotação ficam em `config/districts.ts` ou `config/world.ts`. Modelos devem usar Y para cima no GLB e origem no chão. O pipeline Blender já faz essa conversão. O renderizador em lote aceita meshes estáticos; personagens com esqueleto/animação devem usar uma estratégia própria de clones/rig, não o lote estático.

**Textura/material:** `materials` permite cor, roughness e caminho opcional `texture`. O `Surface` resolve por ID. Para GLBs, os materiais pertencem ao `.blend`/GLB e podem ser alterados no Blender ou na paleta do script, depois reexportados. O tema da UI usa variáveis no início de `styles.css`; materiais do mundo não alteram gameplay.

**Problema:** adicione dados em `content/problems.ts`, com ID, categoria, região, pergunta, posições, enquadramento, camadas inicial/temporária/definitiva, recompensa, `nextProblems` e `unlockConditions`. Registre assets referenciados e inclua o próximo ID no problema anterior. Custo/efeito não pertencem ao marcador.

**Pergunta:** adicione uma entrada em `content/questions.ts` com exatamente três alternativas: FULL/SOLVED, TEMPORARY/TEMPORARILY_SOLVED, NONE/AVAILABLE. Informe custo, explicação e consequência. Os testes validam referências e coerência dos estados.

**Categoria:** os cinco temas já existem. Para uma nova, estenda o tipo `Category` e o registro `categories`, com rótulo, ícone, cor e forma. Temas não são limitados a uma região.

**Novo diálogo:** registre um nó e conecte seu ID por `next` ou choice. Cadastre o personagem e retrato antes de referenciá-lo. Eventos tipados evitam executar scripts arbitrários a partir do conteúdo. Novos capítulos e políticas de concessão de recursos ainda exigem dados e regras próprias; esta etapa prova o capítulo inicial.

## Verificação e limites

Os 16 testes de gameplay anteriores continuam válidos; foram adicionados seis testes narrativos. A suíte de navegador contém os três cenários de gameplay e um cenário narrativo em cada um dos três viewports. Ela usa o build de produção para evitar interferência de HMR/exportação durante a execução.

**Resultado final executado:** build TypeScript/Vite aprovado; **22 testes unitários e 12 testes E2E aprovados**. Viewports: 1440 × 900, Pixel 7 emulado e 360 × 640. Validado: retrato carregado, nome, ramo opcional, save e reload, câmera, três alternativas, FULL/TEMPORARY/NONE, recorrência, desbloqueio, saldo insuficiente e configurações. A rodada final E2E levou aproximadamente 3,3 minutos usando renderização WebGL por software no ambiente de testes.

O conjunto é deliberadamente menor e menos detalhado que a ilustração de referência. Não há multidão, simulação de trânsito, fumaça volumétrica ou ciclos ambientais. Carros e turbinas são cenográficos. A cidade prova variedade e integração, não corresponde a uma cidade completa.

GLBs repetidos e infraestrutura usam instancing; a cena continua sob demanda, com DPR/sombras por preset. A meta de 30/60 FPS não foi certificada em hardware móvel real. O bundle 3D permanece grande e o Vite registra esse aviso. O retrato PNG é o maior asset individual; uma etapa posterior pode fornecer variantes compactadas para diferentes dispositivos.

Não há backend, novos recursos econômicos, concessão automática para saldo esgotado ou migração de IDs de problemas. Os limites econômicos da primeira entrega continuam: o jogador pode sair sem decidir, e uma partida sem orçamento pode ser reiniciada pelo menu com confirmação.

Próximos passos: revisão educativa dos textos, refinamento de arte dos problemas, variantes de expressão do retrato, testes físicos Android/iOS e definição dos próximos capítulos antes de aumentar a cidade.
