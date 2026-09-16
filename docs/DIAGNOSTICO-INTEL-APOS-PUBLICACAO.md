# Intel UHD: primeira entrada e navegação da versão publicada

16/09/2026. Publicação permanente disponível em https://emanuelcandido.github.io/Jogo_INOVATECH/. O ensaio usa uma cópia local da mesma build para separar rede de renderização. RTX não foi testada nesta rodada.

## Condições

Chrome sem janela, GPU real Intel UHD confirmada no contexto WebGL, viewport 1920 × 1080, DPR 1 e canvas 2880 × 1620. Ultra, escala 150%, sombras 4096, animações ligadas, 77 URLs de modelos e 34.005 instâncias. A navegação usa teclas reais em seis trechos de dez segundos; os saltos entre regiões são diagnósticos. Não mede quadros apresentados numa tela física ou desempenho de celular.

Nenhuma consulta de GPU foi feita durante as amostras de navegação. O perfil por material e os tempos de GPU foram coletados depois, em amostras separadas. Não é um comparativo causal com outra build: a variação em relação a sessões antigas não deve ser atribuída a uma mudança específica.

## Resultados

| Região | FPS médio | Quadro p95 | CPU de renderização p50 |
| --- | ---: | ---: | ---: |
| Panorama | 7,91 | 145,7 ms | 7,6 ms |
| Centro | 15,44 | 74,6 ms | 5,2 ms |
| Floresta | 13,38 | 89,0 ms | 5,6 ms |
| Rio | 13,40 | 83,1 ms | 6,0 ms |
| Área u=35, v=35 | 15,15 | 75,4 ms | 4,8 ms |
| Retorno ao panorama | 8,18 | 138,9 ms | 7,6 ms |

Os seis trechos somaram aproximadamente 60,06 segundos, sem tarefas longas de JavaScript registradas durante a navegação. O campo `industry` do relatório original identifica a coordenada u=35, v=35 deste ensaio, não o enquadramento industrial u=79, v=54 usado em outros scripts.

Nas amostras diagnósticas, a GPU consumiu 115,61 ms no panorama, 54,30 ms no centro, 60,43 ms na floresta e 64,95 ms no rio. Isso sustenta priorizar o custo de desenho na GPU para melhorar a navegação. A CPU de renderização é apenas uma parcela da CPU do quadro.

O perfil por material indica folhas como frente relevante: aproximadamente 33,08 ms no panorama e 20,62 ms na floresta. A passagem de profundidade marcou 29,25 ms no panorama. Esses números incluem a sobrecarga das consultas individuais; não podem ser somados aos tempos do quadro nem anunciados como economia disponível.

## Primeira entrada

Em contexto novo com cache HTTP desativado, o diagnóstico ficou acessível em 13,37 s e a preparação dos modelos terminou em 31,13 s. A coleta com trace registrou uma tarefa de avaliação de módulo de 6,87 s e outra chamada de 4,93 s. Esses tempos incluem a sobrecarga da instrumentação, usam um progresso já no mapa e não representam um primeiro acesso físico a partir da tela inicial. O cache do driver não foi controlado.

Há, portanto, duas frentes distintas: trabalho síncrono na montagem inicial e custo de GPU contínuo durante a movimentação. O trace ainda não identifica a função de origem responsável pelas tarefas longas; é necessário perfil de CPU com mapeamento de código antes de alterar a inicialização.

## Hipótese das máscaras das folhas — rejeitada

O material das folhas calcula nervuras e tonalidade mesmo quando sua máscara já é exatamente zero. A candidata evita somente esse trecho, depois de calcular as derivadas e a máscara originais. Permanece optativa em `ecoBenchmark.leafEmptyMasks`, fora do jogo normal. Não altera modelos, densidade, resolução, sombras ou animações.

Concluídas 24 comparações visuais em oito vistas, todas com zero pixels diferentes, incluindo atualização das sombras e restauração. Nos quatro pares de navegação por vista, porém, a mediana do panorama passou de 8,42 para 8,00 fps; na floresta, de 15,24 para 15,21 fps. A mudança não atingiu o critério de ganho. Dois pares do panorama tiveram aumento de tempo de quadro superior a 9%; a causa precisa não foi isolada. Evitar aritmética não basta para presumir ganho quando se introduz uma condição no shader.

**Decisão:** não ativar nem publicar a candidata. [Evidências completas](performance/leaf-empty-mask-intel/results.json). A investigação seguinte mede a CPU da primeira abertura com mapeamento para os arquivos de origem.

Critério mantido: imagem preservada e ganho repetido de pelo menos 5% no quadro completo, sem piora recorrente dos percentis. A meta de 60 fps permanece não atingida.

Dados: [resultados](performance/intel-published-entry/results.json), trace comprimido em `performance/intel-published-entry/first-entry.trace.json.gz`. Reprodução: `scripts/profile-intel-entry.mjs`, usando a build publicada servida localmente na porta 4185 com base `/Jogo_INOVATECH/`.
