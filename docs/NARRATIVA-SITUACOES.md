# Narrativa, situações e companheiro

A cidade passou a ter cinco temas e dez situações, com duas situações por tema. Antes de explorar, o jogador acompanha oito falas e responde a um tutorial gratuito, separado das dez perguntas principais. As cinco poses pertencem ao mesmo robô fornecido pelo usuário, tratado como companheiro de observação.

## Auditoria da estrutura existente

O projeto utiliza React 19, TypeScript, Vite, Three.js com React Three Fiber/Drei e Zustand. `App` carrega `World` de forma assíncrona; `City` reúne infraestrutura, edifícios, vegetação, detalhes e situações. A cidade continua inteiramente no navegador. Os modelos GLB, materiais, instâncias, câmera ortográfica, navegação e ajustes gráficos foram reaproveitados.

Os sistemas reutilizados são `NarrativeManager`, `ProblemManager`, economia, adaptador de salvamento, `ChoiceList`, `DialogueStage`, `QuestPanel`, `CameraRig`, `AssetBatch` e `DetailInstances`. O HUD mantém o saldo e as configurações. A lista de situações tem rolagem para não ocupar os controles do mapa.

Além dos arquivos de conteúdo listados abaixo, foram alterados `src/game/types.ts`, `NarrativeManager.ts`, `ProblemManager.ts`, `save.ts` e `CameraDirector.tsx`; `src/components/City.tsx`, `environment/Landscape.tsx` e `WaterMaterial.tsx`; `src/config/landscape.ts` e `terrain.ts`; e os componentes de interface `CharacterStage`, `DialogueStage`, `ChoiceList`, `QuestPanel` e `styles.css`. O cálculo puro do rio foi extraído para `riverProfile.ts`, evitando carregar Three.js junto à interface inicial.

As adições são o catálogo `situations.ts`, a configuração `balance.ts`, as cenas `situationVisuals.ts`, suas reservas `situationSites.ts`, o renderizador `SituationLayers.tsx` e o exportador de poses. Elas usam os sistemas existentes de decisão, câmera, economia e instâncias. Os testes unitários e de navegador foram atualizados; não foi adicionado outro motor de jogo, backend ou gerenciador de estado. `sharp` ficou registrado como dependência de desenvolvimento para reproduzir a conversão de formatos.

## Cadastro e manutenção

| Arquivo | Responsabilidade |
| --- | --- |
| `src/content/situations.ts` | Textos, categorias, locais, ícones, comentários, alternativas e explicações das dez situações. |
| `src/content/questions.ts` | Adaptação desses dados ao sistema de perguntas existente e pergunta tutorial separada. |
| `src/content/problems.ts` | Liga dados narrativos, câmeras, marcadores e representações físicas. |
| `src/content/balance.ts` | Saldo inicial, recompensa e faixas de custos. |
| `src/content/story.ts` | Oito falas iniciais, instruções e mensagens gerais. |
| `src/content/dialogues.ts` | Sequência narrativa, pose e região observada em cada fala. |
| `src/content/characters.ts` | Único companheiro e associação entre cinco estados emocionais e imagens. |
| `src/config/situationVisuals.ts` | Peças dos cenários inicial, temporário e resolvido. |
| `src/config/situationSites.ts` | Pequenas reservas de espaço para cenas educativas, sem remover edifícios ou ruas. |
| `src/components/city/SituationLayers.tsx` | Instancia cenas, marcadores e condição do rio segundo o estado da partida. |

Para editar uma pergunta, altere o registro em `situations.ts`. Cada alternativa possui ID semântico, texto, `effectiveness`, explicação e consequência. O custo e o estado resultante são associados em `questions.ts`. Os resultados são `COMPLETE`, `TEMPORARY` e `NONE`; a decisão usa o ID, não a posição A/B/C.

Para adicionar situações no futuro, acrescente um registro de conteúdo, os três estados visuais e sua área de implantação. Defina `unlockAfter` e valide o orçamento completo. Os testes atuais exigem exatamente dez situações, conforme esta entrega; devem acompanhar uma expansão futura.

## Locais e consequências

| Tema | Situação | Representação e mudança completa |
| --- | --- | --- |
| Poluição | Lixo nas ruas | Resíduos e animal próximo; coleta seletiva e retirada dos resíduos. |
| Poluição | Carros poluentes | Trecho da avenida com carros e emissões; mais ônibus e menos carros. |
| Segurança | Animais na estrada | Animais perto da pista e obra; encaminhamento para área cercada e veículo de equipe. |
| Segurança | Segurança nas ruas | Ponto sem estrutura de ajuda; botão de emergência e veículo de equipe. |
| Natureza | Espécies ameaçadas | Clareira pressionada pela construção; recuperação de vegetação e área protegida. |
| Natureza | Mudanças climáticas | Área pouco arborizada com climatização; árvores e energia solar. |
| Saúde | Rio poluído | Mancha acompanhando o rio existente, resíduos e saída de efluentes; água mais limpa e infraestrutura de saneamento. |
| Saúde | Fumaça e qualidade do ar | Emissões próximas à fábrica; controle da fonte e redução da fumaça. |
| Acessibilidade | Caminho até o hospital | Obstáculos e falta de orientação; percurso tátil contínuo até a entrada. |
| Acessibilidade | Acesso ao prédio | Escada na prefeitura e cadeira de rodas; rampa integrada à entrada. |

Os cenários existem desde o início, mesmo quando seus marcadores ainda não foram revelados. O modo gráfico reduz decoração ambiental, mas preserva os elementos necessários para compreender cada situação. Fumaça usa poucas formas transparentes instanciadas, sem novas luzes ou sistemas pesados de partículas.

Os modelos dos três resultados são antecipados no cache. `AssetBatch` solicita um novo quadro e atualiza as sombras depois de aplicar suas matrizes, corrigindo a rampa que podia demorar a aparecer enquanto a câmera permanecia parada no modo de renderização sob demanda.

## Fluxo e descoberta

Narrativa → tutorial → mapa → marcador → comentário do companheiro → contexto → pergunta → decisão → explicação e mudança visual → retorno ao mapa.

O tutorial só libera a exploração após a resposta completa. As outras respostas explicam a diferença e permitem nova tentativa, sem custo ou registro entre as decisões principais.

Lixo e acesso ao prédio são os dois primeiros marcadores. A cada duas situações diferentes investigadas, outro par é revelado. Repetir uma situação não avança a descoberta. Soluções temporárias podem ser reavaliadas e voltam a exigir atenção depois de outra decisão; soluções completas permanecem. Os cinco temas não ficam presos a uma ordem única de resolução dentro de cada grupo.

## Recursos e salvamento

O saldo inicial continua em 1.500 moedas e a recompensa por solução completa permanece em 100, uma única vez por situação. Os custos usam as faixas existentes: 220/120/400 ou 250/100/300 para completa/temporária/nenhuma. Resolver as dez diretamente custa 2.350 e devolve 1.000 em recompensas, deixando 150 moedas. Repetir decisões ineficazes pode consumir o orçamento; o jogo mantém a possibilidade de sair para o mapa e reiniciar pelo menu.

Por orientação posterior do usuário, o escopo anterior não é migrado. A nova partida usa `contentVersion: 2`; seus próprios diálogos, decisões, recursos e preferências continuam salvos no navegador. Não há backend ou contas.

## Imagens e limitações

O personagem antigo deixou de ser instanciado no mapa e não aparece nos diálogos. Seus arquivos históricos permanecem no kit, sem download pela cena atual. O robô é apresentado na interface; não foi inventado um novo modelo 3D para substituir as imagens fornecidas.

As cinco poses transparentes estão em `public/assets/portraits/robot/`: PNGs em `source/`, SVGs autônomos `pose-1.svg` a `pose-5.svg` e WebPs de 768 × 768 usados no jogo. A [galeria das poses](../public/assets/portraits/robot/index.html) permite alternar o fundo e baixar cada formato. O mapeamento é apresentação, reflexão, alerta, comemoração e preocupação, respectivamente. Para trocar as imagens no jogo, altere `src/content/characters.ts`.

Cada SVG incorpora os bytes integrais de seu PNG transparente, sem redesenhar detalhes. Isso não equivale a vetorização por traçados nem oferece resolução infinita. O script `scripts/export-robot-poses.mjs` verifica transparência e identidade dos bytes incorporados e gera WebPs e `manifest.json`, com dimensões, tamanhos e hashes. Os SVGs de exportação não são baixados pelo jogo.

A remoção de fundo foi feita com a ferramenta integrada `imagegen`, não com Blender. As instruções e o mapeamento de origem estão em [PROMPT-POSES.md](PROMPT-POSES.md). A quinta pose exigiu novas tentativas: versões com quadriculado pintado foram rejeitadas antes da integração. O recorte automático pode apresentar pequenas diferenças nos contornos em relação às imagens originais; a igualdade sem perda garantida pelo exportador é entre cada PNG final e seu SVG.

## Verificação

Os 44 testes unitários passaram: tutorial, cinco temas, dez perguntas, três resultados por situação, economia, progressão, estados visuais, saves desta versão, gráficos e implantação. A campanha completa foi percorrida no navegador desktop, terminando com dez soluções e saldo de 150. Soluções temporárias, reavaliação, resposta sem melhoria e saldo insuficiente também foram exercitados.

Os testes de poses, tutorial, teclado, restauração, arrasto, zoom e retorno passaram nas três dimensões: desktop 1440 × 900, Pixel 7 emulado e tela de 360 × 640. A captura com qualidade Alta verificou a rampa, a condição do rio e os cinco SVGs sem erros de página ou WebGL. A inspeção dos modelos confirmou sua presença na cena depois da decisão. Não foram feitos testes em aparelhos físicos.

Capturas atuais: [tutorial no desktop](screenshots/robot-tutorial-desktop.png), [tutorial no celular](screenshots/robot-tutorial-mobile.png), [rampa após a decisão](screenshots/current-accessibility_01-solved.png), [rio recuperado](screenshots/current-health_01-solved.png) e [galeria de SVGs](screenshots/robot-gallery.png). `scripts/capture-situations.mjs` reproduz a revisão visual com o servidor Vite na porta 5173. A compilação de produção mantém o módulo 3D separado da interface; o aviso de chunk grande refere-se principalmente a Three.js.
