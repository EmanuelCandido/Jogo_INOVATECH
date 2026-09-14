# Desempenho com a cidade preservada

Aplicação do [plano de desempenho](PLANO-DESEMPENHO.md), em 6 de setembro de 2026. O cenário, os GLBs, as posições e os perfis visuais não foram simplificados nesta etapa.

## O que mudou

- O ambiente solicita o próximo quadro com o ciclo do navegador, removendo o agendamento de 30 Hz. Água e espraiamento usam tempo transcorrido; pausam em abas ocultas e ao desligar a animação. Uma cena sem animação continua renderizando sob demanda.
- Arrasto, pinça e roda consolidam eventos por quadro. A última atualização é aplicada antes de terminar ou mudar um gesto. Os limites de zoom e de exploração continuam ativos.
- Edifícios, adereços e pavimentos conservam seus arrays entre mudanças da interface. Os buffers de matrizes e cores só são refeitos quando a implantação ou a seleção visível muda.
- A floresta compartilha grupos por modelo e pela política de sombra já existente. O mapa conserva as 3.589 árvores da floresta principal de Ultra, além das árvores das outras camadas.
- Primitivas GLB, pavimentos e detalhes de paisagismo selecionam instâncias individualmente por limites completos. Copas, altura, coberturas, escalas, rotação e a posição do grupo de cada situação fazem parte do cálculo. Todos os objetos continuam residentes.
- A seleção ocorre no callback da **cena**, depois de atualizar transformações e antes do upload WebGL. Fazer isso no callback de cada objeto atrasaria o upload em um quadro na versão instalada do Three.js.
- Ao atualizar a sombra estática, o renderer restaura todos os lançadores originais, incluindo os que estão fora da câmera. Nesse quadro ele aceita o custo do conjunto completo; no seguinte volta ao conjunto visível. Abrir uma pergunta sem alterar a aparência da situação não invalida a sombra.
- Materiais GLB equivalentes compartilham a mesma instância. A comparação inclui propriedades serializadas, shader e parâmetros adicionais de renderização. Vidro, folhas, relva, tinta, metal e madeira mantêm seus acabamentos e coordenadas locais.
- A pré-carga das próximas situações ocorre gradualmente, dando prioridade aos modelos visíveis. Quando há suporte a compilação paralela, materiais residentes são preparados durante ociosidade. Recursos compartilhados não são descartados ao trocar de situação.
- O painel mostra tempo mediano e p95 por quadro. A medição não baixa automaticamente a qualidade ou a densidade. O perfil Automático mantém a recomendação inicial do dispositivo; o jogador pode alterá-lo manualmente.

## Critérios de fidelidade

A comparação usa Ultra, canvas de 1.280 × 800 pixels e sombras de 4.096 pixels. O inventário anterior e o otimizado têm **36.573 instâncias de primitivas**: essa contagem inclui as várias partes de um mesmo modelo, não corresponde a 36.573 edifícios ou árvores.

As capturas estáticas congelam a animação para comparar geometria, materiais e sombras. A versão anterior congelava os relógios após alguns quadros de inicialização; por isso a fase da água pode diferir nas capturas históricas. A verificação adicional compara o renderer final com descarte ligado/desligado no mesmo instante, inclusive na praia e nas bordas da câmera.

## Medição e limites

O [comparativo completo](performance/RESULTADOS.md) registra os tempos e contadores por câmera. Na execução controlada em SwiftShader, o ganho de taxa mediana foi de **1,2× a 6,9×**, conforme a região, com redução do p95 nas seis vistas. O centro envia 93% menos triângulos e a praia 98% menos. Esses ganhos pertencem ao mesmo renderer e às mesmas configurações; não são uma previsão para qualquer dispositivo.

O benchmark usa a versão compilada, aquece cada câmera e registra três amostras de 30 segundos em panorama, centro, mata, porto, praia e situação. FPS é derivado do intervalo entre renderizações; não é uma medição de apresentação física do monitor. CPU mede a chamada de renderização e inclui a seleção das instâncias; não representa todo o trabalho JavaScript do aplicativo. p95, p99 e o 1% mais lento ficam nos JSONs.

O Chromium padrão deste ambiente usa **ANGLE/SwiftShader**, com renderização pela CPU e sem `EXT_disjoint_timer_query_webgl2`. Portanto, não há tempo de GPU separado no comparativo em software. O instrumento suporta leitura assíncrona dessa extensão quando disponível, descarta amostras disjoint e não usa `gl.finish()`.

Uma sondagem adicional com `--enable-gpu --use-angle=d3d11` conseguiu acessar a **Intel UHD Graphics**. A medição da versão otimizada nessa GPU usa animação ligada e fica separada do comparativo em software; não há baseline anterior nessa GPU.

As contagens de geometrias/texturas são inventário, não bytes exatos de VRAM. `sourceBytes` registra apenas os arrays adicionais de matrizes e cores necessários para recuperar instâncias ocultas; não inclui os limites geométricos e outras estruturas JavaScript.

## Experimentos que não entraram no jogo

Um protótipo de árvores com `BatchedMesh` fica disponível exclusivamente no módulo de diagnóstico. A amostra exploratória não demonstrou vantagem consistente sobre as instâncias compactadas e adicionou recursos de geometria/textura. O resultado não justifica substituir o caminho principal; testes em GPUs físicas podem reavaliá-lo.

As texturas procedurais, normais, folhas, rugosidade, espuma, resolução e filtros foram mantidos. Transformá-los em texturas pré-calculadas ou mesclar geometrias com novas coordenadas exige outra comparação de fidelidade e GPU. Compressão com perdas, redução de polígonos e troca de engine não foram usadas como ganho de FPS.

## Reproduzir

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Em outro terminal, sem outra renderização pesada em paralelo:

```powershell
npm run benchmark -- after
npm run test:rendering
```

`BENCH_URL` troca a URL do servidor; `BENCH_SECONDS` e `BENCH_RUNS` ajustam a duração e as repetições. `--ambient` liga a animação, `--headed` abre o navegador visível para medição local, `--hardware` solicita aceleração gráfica (Direct3D 11 no Windows) e `--software` força SwiftShader. `--batched` ativa o protótipo apenas no benchmark. Conferir sempre o campo `device.renderer` antes de interpretar os FPS.

Continuam pendentes de hardware disponível: desktop com GPU dedicada, tela de alta frequência e execução sustentada de cinco minutos em celular físico. Emulação de viewport verifica interação e layout, não certifica desempenho desses dispositivos.

## Validação executada

- **69 testes unitários** e compilação de produção aprovados. O Vite mantém o aviso de tamanho do módulo principal de Three.js.
- **6 testes de navegador** aprovados: navegação/gestos e troca de perfis em desktop, Pixel 7 emulado e tela de 360 × 640.
- **5 comparações de pixels**, incluindo borda de câmera e praia, com erro máximo **zero** entre seleção individual ligada/desligada no mesmo instante.
- Verificações adicionais aprovadas: buffers estáticos ao alterar o painel, relógios da água, pausa em segundo plano e desativação de animação. Sem erros de JavaScript/WebGL na bateria visual.

O benchmark prolongado foi concluído antes do último ajuste de invalidação das sombras por pré-carga e dos textos do painel. Esses ajustes não alteram o caminho medido em cena aquecida. A compilação, os 69 testes e a bateria visual/de comportamento foram repetidos depois deles.
