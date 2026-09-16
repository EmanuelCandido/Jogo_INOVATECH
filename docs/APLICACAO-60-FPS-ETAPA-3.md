# Terceira etapa: profundidade antes dos materiais

Objetivo: reduzir cálculos de materiais em superfícies encobertas, preservando todos os modelos e a configuração máxima. A meta de 60 fps continua pendente.

## Implementação

A passagem de profundidade foi integrada ao modo Ultra após a comparação do protótipo. Os outros perfis continuam com uma passagem de renderização. A rota `?benchmark=1` permite comparar os caminhos com `ecoBenchmark.depthPrepass(true/false)`.

A implementação faz uma passagem sem escrita de cor, seguida da passagem de cor na ordem original. A primeira reutiliza as transformações de vértices dos materiais, com fragmento mínimo. A segunda mantém os materiais, efeitos e teste de profundidade originais. Nenhum arquivo de modelo, geometria, resolução, densidade ou parâmetro de qualidade foi alterado nesta etapa.

Materiais transparentes, com recorte de alfa, deslocamento, stencil ou regras de profundidade incompatíveis não participam da primeira passagem. Quadros que atualizam sombras usam o caminho normal para preservar todos os lançadores, inclusive fora da câmera. O quadro seguinte também usa esse caminho, respeitando a recuperação do buffer de instâncias de Three. Os estados do renderer são restaurados mesmo se houver erro. Materiais auxiliares são liberados quando o material de origem é descartado.

O cronômetro de GPU engloba as duas passagens. As chamadas e os triângulos somam o trabalho extra; os tempos não descontam o custo da primeira passagem. Uma entrada única de quadro evita empilhar interceptadores de renderização durante o ciclo de efeitos do React. O perfil individual de materiais desativa temporariamente a passagem de profundidade e registra essa condição no resultado; ele serve para investigar materiais isoladamente, não para medir o quadro completo otimizado.

## Protocolo

`node scripts/verify-depth-prepass.mjs NOME` compara três vistas no máximo, com duas repetições e inversão da ordem ligado/desligado. Em seguida, congela a animação para comparar oito vistas: original, profundidade, profundidade após atualização das sombras e retorno ao original. O relatório guarda GPU/CPU, configurações, modelos, resolução, arquivos da build, câmeras, relógios, diferenças de pixels e erros. Uma consulta de GPU indisponível permanece `null`.

`--mobile` usa viewport de 390 × 844 e DPR 3. É emulação de tela e entrada no computador; não mede um telefone físico. `--captures-only` executa somente a parte visual.

## Validação

TypeScript e Vite passaram na build integrada. Os 21 testes focados passaram: 11 de renderização, um de configuração máxima e nove de restauração de estado, materiais incompatíveis, descarte de materiais, entrada única de quadro e atualização de sombras.

A comparação desktop na Intel UHD terminou sem erros: as oito vistas foram idênticas pixel a pixel em cada um dos três modos comparados à referência (24 comparações). Isso inclui a atualização das sombras e o retorno ao caminho original. [Relatório visual e amostras estáticas](performance/depth-prepass-desktop/results.json).

As amostras estáticas válidas indicaram menor tempo de GPU: cerca de 104 para 70 ms na vista geral, 51 para 29–31 ms no centro e 61–63 para 34 ms na floresta. Entretanto, três das 12 amostras não receberam consultas de GPU válidas; algumas das demais receberam apenas quatro. A CPU subiu, e as chamadas de desenho quase dobraram. Esses números são preliminares e não certificam fluidez nem 60 fps.

## Percursos comparativos do protótipo

As duas repetições por modo e dispositivo mantiveram as verificações de máximo aprovadas, os modelos completos e a resolução. Não houve erro de navegador. As medianas abaixo resumem as duas repetições; a taxa se refere aos intervalos de renderização medidos em navegador headless.

| Percurso | GPU antes → depois | Taxa antes → depois | Intervalo p95 antes → depois |
| --- | --- | --- | --- |
| Desktop, arrasto | 71,18 → 48,55 ms | 12,03 → 15,93/s | 180,65 → 140,35 ms |
| Desktop, teclado | 73,02 → 50,73 ms | 12,43 → 16,86/s | 89,50 → 67,90 ms |
| Móvel emulado, arrasto | 62,38 → 34,87 ms | 14,12 → 23,36/s | 241,45 → 150,15 ms |
| Móvel emulado, pinça | 58,55 → 27,64 ms | 16,00 → 30,39/s | 204,65 → 106,10 ms |

O custo de GPU do arrasto caiu cerca de 32% no desktop e 44% na emulação móvel. A CPU aumentou: no arrasto desktop, de 3,9 para 7,5 ms; no móvel, de 2,85 para 6,15 ms. O arrasto recebeu 135–218 consultas de GPU por repetição, muito mais que o ensaio estático. [Resumo desktop](performance/depth-navigation-on/summary.json) e [resumo móvel](performance/depth-mobile-on/summary.json).

As quatro capturas após navegar foram idênticas pixel a pixel em cada dispositivo: [desktop](performance/depth-navigation-on/image-comparison.json) e [móvel](performance/depth-mobile-on/image-comparison.json). O canvas móvel ficou em 1.170 × 2.532, com a GPU Intel UHD do computador. A primeira repetição móvel de referência teve uma pequena diferença no volume de uploads durante o arrasto; as seguintes usaram 4.406.976 bytes. Os demais parâmetros de referência passaram nas verificações.

Os picos continuam altos e a meta de 60 fps não foi alcançada. A conclusão atual é redução de trabalho de GPU com imagem preservada nos cenários testados. Falta medir celulares físicos, consumo sustentado e os percursos por dez minutos. As medições acima são do protótipo; a build integrada recebe validação separada.

## Build integrada

A build `index-Ct8z2fU0.js`, `World-xQxMyCsn.js` e `Benchmark-DxcH28RL.js` passou nos sete testes de navegador de navegação e gráficos, nos projetos desktop, mobile e tela pequena. Dois casos de teclado físico são intencionalmente ignorados nos projetos móveis. Foram verificados troca de qualidade, preferências, sombras, arrasto, pinça, limites da câmera e retorno de missão. A suíte completa do projeto não foi executada nesta etapa.

As oito capturas da build integrada ficaram idênticas à versão da segunda etapa, com a passagem de profundidade ativada automaticamente pelo Ultra. As capturas mantiveram os 77 modelos e 34.005 instâncias de origem. O relatório também registra o trabalho adicional de geometria: na vista geral, 1.267 chamadas e 8.495.528 triângulos contando as duas passagens. [Capturas e configuração efetiva](performance/depth-integrated-captures/results.json), [comparação de pixels](performance/depth-integrated-captures/image-comparison.json).

Uma repetição móvel adicional na build integrada confirmou 22,90 quadros/s no arrasto e 30,54 na pinça, com p50 de GPU de 34,33 e 27,59 ms. Foram recebidas 210 e 116 consultas de GPU, respectivamente, sem erro e com as verificações de máximo aprovadas. O p95 dos intervalos permaneceu alto: 145,5 ms no arrasto e 100,1 ms na pinça. As quatro capturas móveis ficaram idênticas à referência sem a passagem de profundidade. [Verificação integrada móvel](performance/depth-integrated-mobile/results.json), [resumo](performance/depth-integrated-mobile/summary.json), [comparação visual](performance/depth-integrated-mobile/image-comparison.json). É uma verificação adicional de integração, não uma nova comparação sustentada com o mesmo número de repetições.

Para reproduzir a comparação de navegação, usar `node scripts/benchmark-navigation.mjs NOME --hardware` para a referência sem a passagem, e acrescentar `--depth-prepass` para a otimizada. Acrescentar `--mobile` para emulação móvel. `node scripts/benchmark-materials.mjs NOME --captures-only` usa a ativação automática do Ultra na build integrada.

As alterações desta etapa são locais; não houve novo commit ou push.
