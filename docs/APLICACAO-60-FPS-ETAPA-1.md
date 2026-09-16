# Primeira etapa: movimentação e uploads com gráficos no máximo

14 de setembro de 2026. Aplicação inicial do [plano para 60 fps](PLANO-60-FPS-DESKTOP-E-MOBILE.md). **A meta de 60 fps ainda não foi atingida.** A implementação abaixo reduz trabalho de CPU e envio de buffers, mantendo o conteúdo visual. A GPU continua sendo o principal limite observado.

## Versão preservada no GitHub

- `4b04eb0`: versão atual da cidade, modelos, documentação e planejamento antes desta implementação.
- `4b75283`: integração da alteração remota do README, enviada com sucesso para `origin/main`. O README curto foi mantido, com a documentação técnica local preservada em [REFERENCIA-PROJETO.md](REFERENCIA-PROJETO.md).

As otimizações desta etapa permanecem na cópia de trabalho, posteriores a esse push. Arquivos locais do editor em `.idea` não foram incluídos no commit.

## Mudanças aplicadas

**Seleção de instâncias:** o renderer guarda quais instâncias ocupam cada posição do buffer. Ao mover a câmera, mantém as posições que continuam iguais e copia apenas as que mudaram. Quando apenas a quantidade desenhada diminui, não reenvia matrizes e cores sem necessidade. A restauração de lançadores para sombra preserva os intervalos ainda pendentes de upload.

**Navegação:** manter uma seta pressionada agora movimenta a câmera pelo tempo entre quadros, sem depender da repetição de teclado do sistema. O toque inicial mantém o deslocamento pontual existente; a continuação usa velocidade por segundo. Soltar, perder foco, ocultar a aba, centralizar ou sair da exploração limpa o movimento. Arrasto e pinça reutilizam vetores e uma leitura do retângulo do canvas por atualização, preservando a consolidação dos eventos já existente.

**Benchmark:** adicionado `npm run benchmark:navigation`, com eventos reais de mouse/teclado ou toque/pinça. Usa Ultra, escala de 150%, sombras de 4.096 e animações completas, com HUD visível. Verifica preferências, resolução estável, sombras preparadas e ausência de variantes leves. Registra chamadas e bytes de `bufferSubData`, estatísticas de intervalo, CPU de renderização e temporizador de GPU quando disponível. Essas métricas de envio não são uma medição de VRAM ou de quadros apresentados.

Os modelos, materiais, shaders, densidades, antialiasing, sombras e regras de resolução do jogo não foram simplificados. O novo objeto de configuração máxima é uma referência de benchmark, sem alterar a preferência salva do jogador. O indicador de FPS da interface ainda precisa da revisão prevista no plano; as novas estatísticas completas estão no benchmark.

## Comparação preliminar

Intel UHD via ANGLE/Direct3D 11, Chromium headless. Viewport de 1.280 × 800 e canvas efetivo de **1.920 × 1.200** em escala de 150%. Três percursos de arrasto por versão; tabela com medianas entre as três amostras. Cada percurso envia a mesma sequência de 120 movimentos de ponteiro, com esperas nominais de 16 ms. O tempo real varia conforme navegador e carga.

| Medida durante o arrasto | Antes | Depois |
| --- | ---: | ---: |
| Bytes reenviados em buffers por percurso | 60.976.204 | 13.796.076 |
| Chamadas de atualização de buffers por percurso | 56.899 | 2.628 |
| CPU da chamada de renderização, p50 | 4,3 ms | 3,5 ms |
| GPU, p50 | 73,2 ms | 71,4 ms |
| Taxa média dos intervalos de renderização | 10,28/s | 10,33/s |
| Intervalo de renderização, p95 | 181,8 ms | 160,6 ms |

O volume reenviado caiu **77,4%** e as chamadas de atualização caíram **95,4%** nesse percurso. O p50 de CPU da renderização caiu aproximadamente 18,6%. A mudança de taxa média foi pequena; não há evidência de um ganho importante de FPS nesta etapa. A GPU permanece muito acima dos 16,67 ms necessários por quadro.

Esta comparação é preliminar. Uma execução de testes unitários terminou durante a sessão da medição anterior; faltam repetições com todas as condições externas isoladas. Os tempos headless e as queries de GPU podem incluir espera/preempção e não comprovam a apresentação no monitor. Não houve medição em celular físico. O segmento de teclado não é uma comparação equivalente de carga: antes a tecla produzia deslocamento discreto; agora o mapa continua se movendo enquanto a tecla é mantida.

Os relatórios registram os hashes dos módulos realmente carregados: `World-ru7R_JFz.js` antes e `World-BdnDspb5.js` depois. O campo `workingTree` é o estado dos fontes ao finalizar o relatório, que pode diferir da build servida; os hashes identificam as builds medidas.

Dados: [antes](performance/ultra-before/results.json), [depois](performance/ultra-after/results.json) e [resumo calculado](performance/ultra-after/summary.json).

### Verificação móvel em Ultra

Uma execução adicional com toque e pinça usou viewport de 390 × 844, DPR de dispositivo 3 e canvas de **1.170 × 2.532**, mantendo Ultra, escala de 150%, sombras de 4.096 e animações. As verificações de configuração máxima, resolução, modelos e quantidade de instâncias passaram, sem erros de navegador registrados.

No arrasto, a taxa média dos intervalos de renderização foi 14,05/s, com GPU p50 de 66,0 ms; na pinça, 15,26/s e GPU p50 de 60,2 ms. É uma amostra funcional com emulação móvel na mesma Intel UHD do computador, sem comparação móvel anterior. **Não representa FPS em um celular físico nem certifica 60 fps.** [Relatório móvel](performance/ultra-mobile-after/results.json).

## Qualidade preservada nas vistas verificadas

As duas builds mantiveram **77 URLs de modelos e 34.005 componentes instanciados**. A contagem de componentes inclui as primitivas que compõem um objeto; não significa 34.005 edifícios/árvores independentes.

As capturas de panorama, centro, mata e rio ficaram **idênticas pixel a pixel**, com diferença máxima zero. A animação foi congelada no mesmo instante somente para comparar imagens; ficou ligada nas medições de desempenho. As quatro vistas não substituem a revisão de todas as situações e bordas em movimento. [Resultados da comparação de imagens](performance/ultra-after/image-comparison.json).

## Validação executada e pendências

- Compilação TypeScript e build Vite aprovadas. Permanece o aviso de tamanho dos módulos JavaScript.
- 20 testes focados aprovados, em execuções separadas: onze de renderização/visibilidade/métricas, um de configuração máxima e oito de gráficos. Incluem percurso com restauração de sombras e preservação de matrizes/cores.
- Suíte de navegação aprovada: quatro testes de navegador passaram. Cobrem tecla mantida, parada ao soltar/perder foco no desktop, além de arrasto, zoom, limites, centralização e retorno da missão nos projetos desktop, mobile e tela pequena. Dois casos de teclado físico são intencionalmente ignorados nos projetos móveis.
- O teste funcional de tecla mantida usa qualidade mínima para isolar o comportamento de entrada; a preservação dos gráficos máximos é verificada separadamente nos benchmarks desktop e móvel em Ultra/150%.
- Duas execuções completas do benchmark desktop, antes/depois, com três repetições cada, concluídas sem erros registrados; parâmetros máximos preservados nas amostras.
- Quatro comparações de imagem com diferença zero. `git diff --check` passou.
- A suíte completa foi interrompida após execução parcial devido ao tempo de coleta do mapa; não está certificada nesta etapa.
- Benchmark móvel com arrasto e pinça em Ultra/150% concluído, sem erros e com parâmetros máximos preservados. O bloqueio anterior por limite de uso foi resolvido e os testes de navegador foram retomados com sucesso.
- Permanecem pendentes a medição em aparelhos físicos, a comprovação de quadros apresentados e a execução sustentada de dez minutos.

## Continuação

Com a mesma referência máxima, a próxima etapa é medir o custo dos materiais de água, folhas e acabamento e investigar operações redundantes no shader compilado. O histórico e esta comparação indicam que reduzir somente CPU/uploads não será suficiente: é necessário reduzir o tempo de GPU mantendo o resultado visual. A hierarquia espacial e o agrupamento de materiais equivalentes seguem previstos, condicionados a medições e equivalência visual.

Para reproduzir em terminais separados:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
```

```powershell
$env:BENCH_URL='http://127.0.0.1:4175'
$env:BENCH_RUNS='3'
npm run benchmark:navigation -- ultra-next --hardware
# Emulação verifica gestos/layout, não certifica hardware móvel:
npm run benchmark:navigation -- ultra-mobile-next --hardware --mobile
```

```powershell
npm test -- --maxWorkers=2 tests/render-performance.test.ts tests/maximum-graphics.test.ts tests/graphics.test.ts
$env:ECO_HARDWARE='1'
$env:ECO_BASE_URL='http://127.0.0.1:4175'
npx playwright test tests/e2e/navigation.spec.ts --workers=1 --timeout=120000
```

Usar nomes novos para preservar os relatórios anteriores. `BENCH_WIDTH`, `BENCH_HEIGHT` e `BENCH_DPR` parametrizam o viewport; `--headed` permite uma execução com janela visível. A validação final ainda exige aparelhos físicos e medição sustentada de dez minutos no máximo gráfico.
