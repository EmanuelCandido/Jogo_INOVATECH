# Segunda entrega: custo dos materiais e desenho dos fundos

Continuação do [plano de 60 fps no máximo](PLANO-60-FPS-DESKTOP-E-MOBILE.md) e da [primeira entrega](APLICACAO-60-FPS-ETAPA-1.md). A meta de 60 fps ainda não está certificada.

## Mudanças

- Os acabamentos de grama, pintura, madeira, pavimento, solo, telhados e areia preservam seus ruídos e os mesmos filtros. Quando o filtro existente já resulta em contribuição exatamente zero, deixam de calcular o ruído descartado. A faixa de transição e todos os detalhes visíveis continuam calculados.
- Os cálculos de derivadas usados pelo filtro continuam fora dos desvios condicionais. Somente aritmética sem derivadas é pulada. Isso evita o comportamento indefinido de derivadas em fluxo não uniforme descrito na [especificação GLSL ES](https://registry.khronos.org/OpenGL/specs/es/3.2/GLSL_ES_Specification_3.20.html).
- Nenhuma geometria, instância, arquivo de modelo, densidade, resolução, sombra, projeção de folhas ou animação foi simplificada. Os shaders de folhas e água não foram substituídos.

## Diagnóstico reproduzível

`npm run benchmark:materials -- NOME --profile` mede oito vistas fixas com HUD visível, Ultra, escala de 150%, sombras de 4.096 e animações. Confere modelos, quantidade de instâncias, resolução e configurações máximas. Panorama, centro, mata, indústria, praia, rio e duas aproximações têm capturas separadas com animação congelada.

O perfil por material usa consultas assíncronas de GPU ao redor de cada chamada de desenho. Ele altera o custo de submissão e serve para localizar o trabalho, não para certificar o tempo de quadro. As amostras de tempo de quadro são coletadas separadamente, sem o perfil por chamada ativo. Resultados sem temporizadores disponíveis não equivalem a zero milissegundos.

Alterar a preferência de movimento reinicia a transição da câmera. Por isso, o script conclui todas as medições animadas antes de mudar essa preferência para as capturas, espera a transição e reposiciona cada câmera. Uma tentativa inicial com essas etapas intercaladas foi descartada.

## Resultados

Os relatórios registram os hashes das builds realmente carregadas. A alteração mantida nos fontes, apenas com os ruídos filtrados, preservou as oito capturas pixel a pixel: [comparação](performance/ultra-materials-filtered/image-comparison.json). TypeScript e build Vite dessa versão passaram, sem erros de navegador nos percursos de medição das oito vistas. O aviso de módulos JavaScript grandes permanece.

Cada execução contém 16 amostras de seis segundos, duas por vista, em Intel UHD / ANGLE Direct3D 11, Chromium headless, viewport 1.280 × 800 e canvas 1.920 × 1.200. Foram preservadas 77 URLs de modelos e 34.005 componentes instanciados; todas as verificações da configuração máxima passaram.

As consultas de GPU ficaram indisponíveis em três das 16 amostras tanto na referência quanto na versão filtrada. Várias outras receberam somente quatro resultados de temporizador. Portanto, os tempos servem como diagnóstico preliminar; não há base suficiente para afirmar um ganho sustentado de FPS.

Dados: [referência](performance/ultra-materials-baseline/results.json) e [ruídos filtrados](performance/ultra-materials-filtered/results.json). O perfil por material aponta terreno, folhas e pintura entre os maiores custos. Na vista central, o custo instrumentado do terreno passou de 14,11 para 10,36 ms por quadro; esse número inclui a interferência do perfil e não equivale ao ganho no tempo total de quadro.

### Percurso real após retomar a validação

Cinco repetições de arrasto e tecla mantida por build no desktop: três na ordem referência → otimizada e duas na ordem otimizada → referência, com a mesma sequência de entrada e os mesmos parâmetros máximos. Tabela com medianas entre as cinco repetições:

| Medida durante o arrasto | Referência | Ruídos filtrados |
| --- | ---: | ---: |
| GPU, p50 | 67,39 ms | 65,93 ms |
| CPU da chamada de renderização, p50 | 3,8 ms | 3,8 ms |
| Taxa média dos intervalos de renderização | 11,03/s | 11,32/s |
| Intervalo de renderização, p95 | 152,0 ms | 146,2 ms |

O tempo de GPU caiu cerca de 2,2% no agregado. A primeira sequência de três repetições apresentou piora do p95 na versão otimizada; ao inverter a ordem, a própria referência apresentou picos maiores. O p95 variou de 79,6 a 181,6 ms na referência e de 139,4 a 151,9 ms na otimizada. O resultado é modesto e **não comprova movimento suave nem 60 fps**. Cada arrasto recebeu entre 113 e 178 consultas de GPU válidas, uma cobertura maior que nas amostras estáticas anteriores. A captura é headless e não confirma quadros apresentados no monitor. [Resumo agregado e cobertura das amostras](performance/shader-navigation-after/aggregate-summary.json), [primeira sequência](performance/shader-navigation-after/summary.json) e [ordem inversa](performance/shader-navigation-reverse-after/summary.json).

Na emulação móvel, um arrasto e uma pinça por versão passaram com canvas de 1.170 × 2.532. No arrasto, a taxa dos intervalos passou de 15,24/s para 15,51/s, enquanto o p50 de GPU passou de 58,39 para 60,06 ms. Uma repetição não permite concluir ganho sustentado; essa medição usa a Intel UHD do computador, não a GPU de um telefone. [Resumo móvel](performance/shader-mobile-after/summary.json).

As quatro capturas móveis após os gestos ficaram idênticas pixel a pixel. [Comparação móvel](performance/shader-mobile-after/image-comparison.json). As capturas desktop feitas após a navegação variaram entre cinco e 14 pixels por vista, com diferença máxima de 22 em um canal; não são apresentadas como idênticas. A repetição estática da própria build de referência preservou as oito imagens originais, com câmera e instante da animação registrados por captura. [Controle da referência](performance/shader-baseline-repeat/image-comparison.json). A comparação estática repetida da build final otimizada também ficou idêntica nas oito vistas. [Repetição da comparação final](performance/shader-filtered-repeat/image-comparison.json).

## Experimento de ordem de desenho retirado dos fontes

Foi testado desenhar o terreno após os objetos opacos, usando a profundidade já preenchida para evitar pintar trechos encobertos. O teste estrito de profundidade procurava preservar a prioridade dos objetos nos empates coplanares. Sete capturas permaneceram idênticas, mas a vista industrial apresentou cinco pixels diferentes, com diferença máxima de 13 em um canal. A causa ainda não foi demonstrada; a alteração foi retirada para respeitar a exigência de preservação visual. [Comparação do experimento](performance/ultra-materials-after/image-comparison.json).

Adiar apenas o terreno também transferiu trabalho para a água: ela passou a pintar áreas posteriormente encobertas. Depois de restabelecida a autenticação, a hipótese objetos → terreno → mar/reservatório opacos foi comparada na mesma cena, com o teste de profundidade original e com o teste estrito. A primeira apresentou diferenças em sete vistas; a segunda, na indústria e na praia. Nenhuma foi adotada. [Comparação controlada](performance/background-order-desktop/results.json).

O comando `node scripts/verify-background-order.mjs NOME` reproduz essa investigação sem alterar a ordem de desenho do jogo normal. A API de experimento é carregada apenas pela rota diagnóstica. Os arquivos de modelos e a geometria não foram alterados em nenhum desses experimentos.

## Validação e próximos passos

A autenticação foi restabelecida e o bloqueio da revisão automática foi resolvido. A build foi reconstruída com a ordem de desenho original e os ruídos filtrados. TypeScript, Vite e os 12 testes focados de renderização/configuração máxima passaram.

Os sete testes de navegador de navegação e gráficos passaram nos projetos desktop, mobile e tela pequena; dois casos de teclado físico são intencionalmente ignorados nos projetos móveis. Os percursos comparativos desktop/móvel concluíram sem erros e com todas as verificações de referência máxima aprovadas. A suíte completa de testes do projeto não foi executada nesta entrega. Não houve novo commit ou push nesta etapa.

Ainda é necessário resolver a cadência irregular, ampliar as amostras e testar celulares físicos por dez minutos. A redução isolada dos ruídos não resolve o gargalo de GPU. Os próximos candidatos são o agrupamento de geometrias com materiais equivalentes e a redução de trabalho de folhas, mantendo todas as projeções e detalhes. A variação de poucos pixels após navegar também precisa ser distinguida das diferenças entre shaders antes de estabelecer um critério de aceitação em movimento.

## Reprodução

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
```

Em outro terminal:

```powershell
$env:BENCH_URL='http://127.0.0.1:4175'
$env:BENCH_SECONDS='6'
$env:BENCH_RUNS='2'
npm run benchmark:materials -- ultra-materials-next --profile
node scripts/compare-render-captures.mjs ultra-materials-baseline ultra-materials-next
# Somente capturas, com verificação da câmera e registro dos relógios:
npm run benchmark:materials -- ultra-captures-next --captures-only
```

Usar nomes novos para preservar medições anteriores. `--mobile` verifica o enquadramento móvel emulado, sem certificar hardware de telefone. A certificação da meta exige os percursos com entrada real e os testes sustentados em aparelhos físicos definidos no plano.
