# EcoQuest — Vila Esperança

**Versão atual: cidade costeira inspirada na referência.** O mapa reúne 77 edifícios, bairros residenciais compactos, escola com esportes, parque, ferrovia, porto e farol. O terreno continua para o interior, com mata densa e mar apenas na costa. A cena usa 51 modelos GLB, incluindo cinco novas árvores para agrupamentos, e permite arrasto, zoom e centralização. Veja a [composição e validação](docs/MAPA-REFERENCIA.md) e a [revisão de acabamento dos modelos](docs/REVISAO-MODELOS.md). Os relatórios anteriores registram as etapas históricas e a arquitetura narrativa.

Para experimentar: `npm ci` e `npm run dev`. Para testar: `npm test` e `npm run test:e2e -- --workers=1` (a suíte de navegador compila e serve a versão de produção automaticamente). Para reexportar os modelos: `npm run assets:build` com Blender disponível conforme o relatório.

Os terrenos incluem quintais mobiliados, hortas, esplanadas de café e jardins com vegetação em grupos irregulares. As [capturas com zoom](docs/MAPA-REFERENCIA.md) permitem conferir os acabamentos e a relação desses espaços com as calçadas.

O menu oferece **Automático, Muito baixa, Baixa, Média, Alta e Ultra**, com resolução, sombras, animações e medição de desempenho. Alta e Ultra incluem uma camada extra de detalhes urbanos. Veja os [perfis e a compatibilidade gráfica](docs/GRAFICOS.md).

Jogo narrativo educativo 3D para navegador. Um robô companheiro observa a cidade com o jogador: oito falas iniciais, um tutorial gratuito e dez situações em cinco temas. Cada decisão modifica seu lugar no mapa. Veja a [auditoria da narrativa, situações, custos e poses](docs/NARRATIVA-SITUACOES.md). A visão geral permite mover e ampliar o mapa, sem física ou combate.

## Executar

Requer Node.js 22.12+ (validado com Node 24).

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. Para produção: `npm run build` e `npm run preview`. Os arquivos publicáveis ficam em `dist/`. Esta entrega não foi publicada em um serviço externo.

```sh
npm test
npx playwright install chromium
npm run test:e2e -- --workers=1
```

Os testes de navegador iniciam o servidor quando necessário. `node scripts/capture.mjs` gera capturas com o servidor já aberto na porta 5173.

## Histórico da base

A pasta fornecida estava vazia. Não havia mapa, câmera, personagens, perguntas, HUD, assets, dependências ou histórico Git a manter/refatorar/substituir/remover. O registro anterior à implementação está em [docs/AUDITORIA.md](docs/AUDITORIA.md). Nenhum código anterior foi descartado. A base foi criada seguindo o escopo do prompt.

## Sistemas entregues

- Cidade composta por modelos reutilizáveis, bairros, porto, parque e vegetação instanciada; o robô aparece na interface com cinco poses transparentes.
- Apresentação e tutorial gratuito separados das dez situações. O tutorial explica observação e só libera o mapa após a resposta completa.
- `CameraDirector`: comandos `focusCity`, `focusProblem`, `focusCharacter`, `focusRegion` e `returnToOverview`; apenas `CameraRig` altera a câmera. Visão geral → foco do problema → diálogo → retorno, interpolados. Enquadramento adapta-se ao espaço disponível e redução de movimento.
- `ProblemManager`: seleção, validação de tentativa, estados, desbloqueios por dados, recompensas únicas, recorrência e reavaliação manual de temporários.
- `NarrativeManager`: avança apresentação, contexto, resultado e progressão após chegada da câmera. Conteúdo está separado da renderização.
- Economia com Moedas da Cidade, desconto atômico, saldo nunca negativo, custo exato permitido e alternativas indisponíveis identificadas.
- Três alternativas por pergunta, com COMPLETE / TEMPORARY / NONE e preços sem associação automática entre mais caro e melhor.
- Camadas visuais inicial, provisória e definitiva para dez situações: poluição, segurança, natureza, saúde e acessibilidade, duas por tema.
- Zustand com progresso global; animação e estado de menus ficam fora do save de gameplay.
- Save versionado por adapter, validação estrutural, restauração de resultado sem cobrança duplicada, configurações persistidas e aviso quando storage falha.
- UI HTML/React, seleção alternativa também pelo painel da jornada, navegação por teclado, foco no painel, toque, contraste e redução de movimento.
- Cinco perfis manuais e Automático controlam resolução, sombras, vegetação, veículos e detalhes decorativos. A cena usa renderização sob demanda; a água animada em Alta/Ultra tem atualização limitada e pode ser desligada. O módulo 3D e a camada de detalhes urbanos têm carregamento separado.

## Dependências

Runtime: React, React DOM, Three.js, React Three Fiber, Drei e Zustand. Desenvolvimento: TypeScript, Vite, plugin React, tipos, Vitest e Playwright. Versões exatas resolvidas estão no lockfile. Prettier foi usado como ferramenta temporária, sem adicionar dependência ao projeto.

Rapier, BVH, Ecctrl e postprocessing não foram adicionados: o recorte não exige física, locomoção, raycasting complexo ou efeitos adicionais. Fontes de apresentação são solicitadas ao Google Fonts por uma única declaração CSS, com fallback local sans-serif.

## Organização

```text
src/
  app/              aplicação, limites de erro, Canvas carregado sob demanda
  assets/           AssetRegistry, materiais/texturas e mídia
  components/       renderização de assets, cidade, instancing e marcadores
  config/           composição do ambiente, posições e qualidade
  content/          problemas, perguntas, categorias e história
  game/             tipos, câmera, problemas, narrativa, economia e save
  stores/           coordenação global e persistência
  ui/               HUD, jornada, perguntas, diálogos, menus e estilos
tests/
  game.test.ts      regras, conteúdo, economia, progressão e save
  e2e/              ciclo no navegador desktop/mobile
scripts/            captura visual reproduzível
docs/               auditoria, relatório e capturas
```

O fluxo é `UI → store → regras puras → novo progresso → save + renderização`. O renderizador recebe estado; marcadores não cobram nem desbloqueiam problemas por conta própria. A câmera avisa o NarrativeManager quando termina a transição.

## Adicionar um problema

1. Cadastre contexto, pergunta, três alternativas, categoria, posição e `unlockAfter` em `src/content/situations.ts`.
2. Acrescente os três estados físicos em `src/config/situationVisuals.ts` e reserve seu espaço em `situationSites.ts`, quando necessário.
3. Perguntas, custos, problemas e marcadores são derivados desses dados. Ajuste o enquadramento em `problems.ts` se necessário.
4. Valide o orçamento em `balance.ts` e atualize os testes que atualmente exigem exatamente dez situações.

Um problema temporário reaparece após outra decisão; também pode ser reavaliado pela jornada. COMPLETE é definitivo e recebe recompensa apenas uma vez. NONE continua disponível. A cada duas situações diferentes investigadas, outro par é revelado. O tutorial possui progresso próprio e não consome moedas nem conta entre as dez situações.

O usuário autorizou descartar os saves do escopo anterior. O conteúdo atual exige `contentVersion: 2` e salva o novo progresso no navegador. Alterações futuras com jogadores reais devem incluir uma estratégia de migração.

## Trocar um modelo

Coloque o arquivo em `public/assets/` e altere somente a entrada lógica de `src/assets/registry.ts`:

```ts
hero: { kind: 'glb', url: '/assets/characters/salvador.glb' }
```

As peças do ambiente também usam IDs (`ground.sidewalk`, `prop.bench`, `prop.fountain`). Modelos GLB devem usar eixo Y para cima, origem no apoio e escala coerente. Posição, escala e rotação pertencem às configurações de composição em `config/world.ts` ou às camadas de cada problema. Procedurais são placeholders editáveis; substituí-los não altera economia/narrativa.

O loader usa cache do Drei. Os edifícios e objetos repetidos são agrupados em instâncias por modelo e material através de `AssetBatch`; a vegetação é dividida em setores para permitir descarte fora da câmera. Os modelos de missão usam clones da cena. `ShadowCache` atualiza as sombras após carregamentos, mudanças de qualidade ou mudanças narrativas, preservando-as durante o arrasto e o zoom.

## Trocar material ou textura

Em `materials`, dentro de `src/assets/registry.ts`:

```ts
'sidewalk.default': {
  color: '#ddd8be',
  roughness: 0.9,
  texture: '/assets/textures/sidewalk.webp',
}
```

Remova `texture` para voltar a cor sólida. Materiais têm IDs semânticos, incluindo asfalto, calçada, grama e água. A alteração visual não modifica o estado do problema. Use texturas pequenas e valide UVs do modelo; materiais internos de um GLB pertencem ao próprio arquivo e devem ser editados na autoria do asset.

Poses do companheiro: `src/content/characters.ts`, com imagens em `public/assets/portraits/robot`. Os SVGs incorporam os recortes PNG; o jogo usa WebP transparente. Não há reprodução de áudio nesta etapa. Ícones, cores, rótulos e formas de categoria estão centralizados em `content/problems.ts`.

## Criar pergunta e categoria

Uma pergunta possui `id`, `text` e uma tupla de três alternativas. Cada alternativa define `id`, `text`, `cost`, `effectiveness`, `explanation`, `consequence` e `resultState`. COMPLETE corresponde a SOLVED; TEMPORARY a TEMPORARILY_SOLVED; NONE a AVAILABLE. O teste verifica referências, três eficácias e custos válidos. Altere textos em `situations.ts` e custos em `balance.ts`, nunca nos componentes de UI.

Os cinco temas já estão cadastrados. Para uma categoria adicional, estenda `Category` em `game/types.ts`, acrescente os metadados em `categories` e utilize-a nos novos problemas. Se escolher uma nova forma de marcador, defina a classe correspondente no CSS. Regiões são configurações espaciais, não restrições temáticas.

## Limitações e próximos passos

- A campanha atual tem dez situações e um tutorial. A edição do conteúdo é feita em arquivos, sem editor visual.
- As mudanças do mapa são representações educativas estilizadas. Não simulam todos os efeitos de políticas públicas ou normas de construção.
- Não há backend, autenticação, múltiplos slots, áudio ou sistema de concessão de novas moedas além da recompensa de solução definitiva. `economy.ts` é o ponto de extensão para concessões narrativas. Os modelos GLB e o pipeline Blender/glTF-Transform estão disponíveis.
- Se gastar todos os recursos, pode voltar ao mapa e inspecionar outros desafios; sem recursos para nenhuma opção, é necessário recomeçar. Recuperação narrativa de orçamento é uma próxima funcionalidade, não uma concessão automática escondida.
- Save é local ao navegador/origem. Mudança de porta/domínio não compartilha o progresso. Falhas de storage mostram aviso.
- Conteúdo de capítulos ainda é um capítulo inicial. O estado possui capítulo para futura expansão; adicionar capítulos requer definir sua sequência e política de recompensa.
- O pacote Three/WebGL continua sendo o maior download, embora carregado separadamente da UI. Texturas comprimidas, LOD e BVH devem ser introduzidos quando assets reais e medições justificarem.
- Testes em Chromium e emulação mobile não equivalem a testes físicos de Android/iOS. Metas de 30/60 FPS não foram certificadas em aparelhos reais. Validar Safari, dispositivos de entrada, acessibilidade com leitores de tela e hardware intermediário antes de distribuição escolar.

Antes de uma distribuição escolar, revisar conteúdo com educadores e medir o desempenho em aparelhos reais.




