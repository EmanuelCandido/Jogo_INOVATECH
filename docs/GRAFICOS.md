# Gráficos e desempenho

Abra o menu **Configurações** e escolha **Qualidade gráfica**. As mudanças são aplicadas durante a partida e salvas neste navegador. O mapa, os 77 edifícios principais, o personagem, as alternativas e as consequências das missões permanecem disponíveis em todos os níveis.

| Perfil | Floresta¹ | Partes decorativas dos jardins | Conjuntos urbanos extras | Sombras padrão | Limite de pixels |
| --- | ---: | ---: | ---: | --- | ---: |
| Muito baixa | 433 | 809 | 0 | Desativadas | 0,8 milhão |
| Baixa | 975 | 1.997 | 0 | Desativadas | 1,4 milhão |
| Média | 1.877 | 5.105 | 0 | 1.024 px | 2,6 milhões |
| Alta | 2.888 | 8.473 | 161 | 2.048 px | 4,5 milhões |
| Ultra | 3.610 | 10.679 | 417 | 4.096 px | 6,5 milhões |

¹ Instâncias da camada de mata e árvores urbanas. As árvores do parque e dos jardins complementares são contabilizadas à parte. Contagens de instâncias não equivalem a chamadas de desenho nem a FPS.

Alta e Ultra acrescentam moradores nas calçadas, bicicletas e suportes, jardineiras, árvores nos terraços, carros estacionados, empilhadeiras e paletes. Ultra contém 5.062 peças adicionais, agrupadas por geometria e instância. A camada extra tem carregamento separado e só é solicitada ao usar Alta ou Ultra. As coberturas verdes e os painéis solares essenciais agora pertencem aos edifícios em todos os perfis.

O catálogo futurista tem 77 modelos. Muito baixa e Baixa selecionam 45 variantes GLB com menos segmentos e sem ferragens pequenas, preservando silhuetas, entradas e encaixes. Média, Alta e Ultra usam o modelo completo. A seleção leve do catálogo soma 8,37 MB, contra 13,30 MB da seleção completa; esses valores não são o download de uma única vista. A pré-carga das situações acompanha o perfil, e a troca mantém o modelo anterior visível até a variante estar pronta. Veja a [galeria comparativa](CIDADE-FUTURISTA.html).

A montanha mantém seu relevo e afloramentos em todos os níveis. A distribuição de árvores respeita altitude e inclinação. O material das folhas usa desenhos pontudos, nervuras e variação tonal em todos os perfis, sem relevo granulado. A grama dos 13 modelos com cobertura verde tem material próprio, suave e com fibras finas. A textura é procedural e não acrescenta downloads de imagens ou chamadas de desenho por folha.

A água mantém variação de profundidade, ondulações e espuma nos perfis leves; Alta e Ultra acrescentam normais de ondas finas e animação. O canal da montanha fica aberto em todos os perfis, com margens contínuas. Veja a [revisão de água e vegetação](AGUA-E-VEGETACAO.md).

## Ajustes individuais

- **Escala de resolução, de 60% a 150%:** reduz ou aumenta a resolução do cenário, respeitando o orçamento de pixels do perfil e o limite da GPU. A interface mantém sua resolução nativa.
- **Sombras:** seguir o perfil, desativadas, suaves ou detalhadas. Os mapas de sombra são reconstruídos ao trocar a resolução, evitando reaproveitar uma textura de tamanho anterior.
- **Animar água e ambiente:** pequenas ondulações em Alta e Ultra, sem renderizar uma segunda cena para reflexos. Com o mapa parado, a animação solicita até 30 atualizações por segundo e pausa quando a aba fica oculta.
- **Reduzir movimentos:** também interrompe a animação decorativa da água, mantendo os detalhes estáticos e a navegação.
- **Mostrar desempenho:** exibe o FPS de uma amostra curta de renderização. É uma medição local, não uma promessa de taxa constante.

## Automático

Novas partidas começam em Automático. O perfil inicial considera os dados disponíveis de memória, núcleos, tipo de interação e renderizador por software. Sem dados completos, usa uma escolha conservadora.

Após preparar a cena, o jogo renderiza uma amostra com aquecimento e mostra o tempo mediano entre quadros e o p95. A medição não reduz o perfil, a densidade ou a resolução. Tempo parado no modo de renderização sob demanda não entra na amostra. Novas amostras podem ocorrer após explorar o mapa, com intervalo mínimo de 12 segundos. **Reavaliar dispositivo** recalcula a recomendação inicial e reinicia a medição. O jogador continua podendo escolher outro perfil manualmente.

A escolha automática é uma estimativa: navegador, GPU, temperatura e outros programas influenciam a fluidez. O jogo requer suporte a WebGL 2. Não foi validado em todos os dispositivos físicos.

## Compatibilidade e verificações

Saves anteriores com LOW, MEDIUM e HIGH são migrados sem apagar progresso e sem mudar a qualidade escolhida. As novas preferências recebem valores padrão. Valores de resolução fora da faixa são limitados.

Os testes unitários cobrem migração, persistência, escolhas manuais, limites de pixels, seleção automática e implantação dos novos objetos. O teste de navegador percorre todos os perfis na mesma instância do Canvas, ajusta resolução e sombras, recarrega o save e verifica o modo Automático em desktop, Pixel 7 e 360 × 640. As emulações usam SwiftShader; seus FPS não representam uma GPU física.

Na revisão futurista, os 60 testes unitários passaram, incluindo variantes leves, dimensões exportadas, encaixes e circulação. A resolução física do Canvas também é conferida depois de mudar outras opções e recarregar a partida. O teste permite até 30 segundos para essa leitura, pois o SwiftShader pode ocupar o navegador durante a preparação dos modelos. A compilação passou, mantendo o aviso do Vite sobre o tamanho do módulo Three.js. O [relatório atual](CIDADE-FUTURISTA.md) reúne os resultados de navegador e as medições.

Comandos reproduzíveis:

```sh
npm test
npx playwright test tests/e2e/graphics.spec.ts tests/e2e/loading.spec.ts tests/e2e/loop.spec.ts tests/e2e/navigation.spec.ts --workers=1
node scripts/audit-graphics.mjs
node scripts/capture-graphics.mjs
```

As capturas precisam do servidor local na porta 5173.

![Menu de qualidade](screenshots/graphics-menu-ultra.png)

![Ultra com detalhes ampliados](screenshots/graphics-ultra-detail.png)

![Modo Muito baixa](screenshots/graphics-minimum.png)
