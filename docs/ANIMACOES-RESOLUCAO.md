# Transformações após uma decisão

As escolhas continuam sendo salvas imediatamente pelo `ProblemManager`. A apresentação usa um estado transitório (`resolution`) separado do progresso salvo. Recarregar, voltar ao mapa ou pular a animação conserva a decisão e nunca cobra as moedas novamente.

- Coleta de lixo: 6,8 segundos de animação, com chegada do caminhão, recolhimento, recuperação do terreno, instalação das lixeiras e crescimento das árvores.
- Demais situações: 5,2 segundos, com deslocamento dos animais e veículos, instalação gradual de equipamentos, vegetação e pisos, limpeza da água e dissipação da fumaça.
- Cada mudança recebe um papel (`changeRole` em `src/game/resolution.ts`) que decide quando e como ela se move: a fumaça sobe e se dissipa, obstáculos tremem e afundam, veículos que saem aceleram e os que chegam freiam; depois o piso se espalha em sequência (o piso tátil é assentado ao longo do caminho), os equipamentos descem e assentam com um pequeno amortecimento, as árvores crescem com um leve balanço e a placa informativa aparece por último.
- `ResolutionBursts.tsx` desenha poeira quando algo é removido ou assentado, folhas quando uma árvore cresce e brilhos sobre a área ao final (menos e amarelos numa solução parcial). É uma única malha instanciada, sem sombra nem transparência, com no máximo 240 partículas determinísticas.
- O cartão acima de “Ver resultado” mostra três etapas com o nome do que está acontecendo em cada situação (`src/content/resolutionSteps.ts`) e uma barra que acompanha o relógio da animação.
- Soluções parciais usam apenas o estado visual temporário. Escolhas sem melhoria não exibem uma transformação positiva.
- O diálogo de resultado só aparece ao final. “Ver resultado” permite pular; “Voltar” encerra a sequência e retorna ao mapa.
- Movimento reduzido, inclusive pela preferência do sistema, apresenta o resultado diretamente. Abas ocultas não consomem o tempo da animação.

`src/game/resolution.ts` calcula transformações absolutas sem modificar os modelos, materiais ou posicionamentos compartilhados. `ResolutionScene.tsx` mantém objetos iguais em lotes estáticos e anima somente as diferenças. Ao terminar, a cena volta aos lotes normais. Cor do terreno, água e fumaça acompanham o mesmo relógio.

As sombras são atualizadas em intervalos de 180 ms durante a sequência. `InstanceCulling` conserva o lote completo por um quadro após cada atualização de sombra antes de voltar à seleção da câmera; isso evita desenhar a contagem reduzida com matrizes antigas e fazer árvores piscarem. A verificação visual da coleta também compara uma região estática entre quadros.

## Fontes e exportação dos modelos

Os modelos `waste-pile`, `waste-partial`, `waste-bin`, `industrial-waste` e `cleanup-truck` foram criados/atualizados no Blender pelo MCP. Os fontes ficam em `assets-source/*.blend`; os GLBs de qualidade normal e reduzida ficam em `public/assets/models`.

A construção reproduzível está em `scripts/blender/waste_cleanup.py`, registrada por `build_city.py`. Para reconstruir, confirme a conexão e inspecione a cena no Blender MCP; execute `build_city.py` pelo MCP com `--only waste-pile,waste-partial,waste-bin,industrial-waste,cleanup-truck`. Em seguida, otimize os GLBs exportados:

```powershell
node scripts/optimize-assets.mjs --only waste-pile,waste-partial,waste-bin,industrial-waste,cleanup-truck
```

O caminhão utiliza o percurso reservado em `dumpSite.ts`, com escala 1,3 e coleta na traseira. O teste `dump-site.test.ts` verifica seu volume durante a manobra contra obstáculos nos três estados do terreno. O entulho mantém o limite de seis materiais por modelo.

## Verificação

`resolution.test.ts` cobre as dez situações, melhorias parciais, conservação dos objetos e os extremos das transformações. `e2e/resolution.spec.ts` verifica quadros diferentes durante a coleta, ausência de diálogo sobre a animação, pulo e persistência após recarregar. O fluxo completo em `e2e/loop.spec.ts` também aguarda as transformações antes de continuar.
