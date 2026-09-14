# Resultados da versão compilada

Três amostras de 30 segundos por câmera; valores medianos entre as três execuções. Ultra, 1.280 × 800 pixels, sombras de 4.096 pixels e animação congelada. Mesmos 36.573 componentes instanciados.

**Renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver).** Comparativo renderizado pela CPU, sem temporizador de GPU. Estes valores não estimam o FPS de outro computador ou celular.

| Área | Chamadas antes → depois | Triângulos antes → depois | Quadro p50, ms antes → depois | Ganho de taxa |
|---|---:|---:|---:|---:|
| Panorama | 1.239 → 858 | 5.474.692 → 3.450.700 | 2.639,1 → 2.184,5 | 1,2× |
| Centro | 413 → 201 | 4.849.156 → 342.558 | 1.490,1 → 574,5 | 2,6× |
| Mata | 447 → 140 | 4.679.004 → 799.476 | 1.913,4 → 1.070,3 | 1,8× |
| Porto | 439 → 251 | 4.751.176 → 636.748 | 1.492,8 → 600,4 | 2,5× |
| Praia | 270 → 72 | 4.390.076 → 82.664 | 976,5 → 141 | 6,9× |
| Situação | 432 → 232 | 4.777.454 → 318.588 | 1.266,9 → 346,7 | 3,7× |

| Área | Quadro p95, ms antes → depois | CPU da chamada de renderização p50, ms antes → depois |
|---|---:|---:|
| Panorama | 2.708,2 → 2.341,7 | 9,2 → 6 |
| Centro | 1.827,7 → 652,6 | 5,3 → 3,2 |
| Mata | 1.974,2 → 1.157,8 | 4,2 → 2,2 |
| Porto | 1.612,8 → 659,6 | 4,8 → 3 |
| Praia | 1.095,9 → 152,5 | 4,1 → 2,8 |
| Situação | 1.352,1 → 376,8 | 5 → 3,8 |

O ganho de taxa usa a razão entre os tempos p50. CPU mede somente a chamada de renderização; inclui o descarte, mas não todo o processamento de entrada e React. Intervalos entre quadros incluem o trabalho do renderer por software.

Inventário final: 1003 meshes (antes: 2844); 1141 geometrias e 2 texturas reportadas pelo renderer. Arrays adicionais das instâncias: 2,4 MiB, sem contar os objetos de limites. Isso não é uma medição total de VRAM.

A comparação com descarte ligado/desligado passou nas 5 vistas: erro máximo 0 por canal. Também passaram a estabilidade dos buffers ao mudar o painel, o movimento, a pausa em segundo plano e a opção de desligar animação.

## Medição adicional na Intel UHD

3 amostras de 10 segundos por câmera, Ultra, 1.280 × 800, densidade completa e **animação ligada**. Renderer: ANGLE (Intel, Intel(R) UHD Graphics (0x0000A78B) Direct3D11 vs_5_0 ps_5_0, D3D11). Extensão de temporização de GPU disponível. Esta bateria mede a versão final; não existe baseline anterior nessa GPU.

| Área | Intervalo dos callbacks p50, ms | CPU render p50, ms | GPU p50, ms | GPU p95, ms |
|---|---:|---:|---:|---:|
| Panorama | 16,6 | 3,9 | 45,7 | 47,7 |
| Centro | 16,6 | 2,3 | 26,2 | 29,3 |
| Mata | 16,6 | 1,8 | 34 | 37,5 |
| Porto | 16,6 | 2,1 | 21,2 | 22,9 |
| Praia | 16,7 | 2,1 | 10,6 | 11,6 |
| Situação | 16,6 | 2,6 | 16,9 | 18,5 |

Os callbacks ficaram próximos de 16,7 ms, mas os tempos de GPU são maiores em várias regiões. Por isso, **não interpretamos o agendamento de aproximadamente 60 callbacks/s como 60 quadros fisicamente apresentados**. O teste é headless, o trabalho é assíncrono e o tempo de GPU também pode incluir espera/preempção. A apresentação no monitor e a influência de outros processos não foram isoladas. [Dados completos da Intel UHD](intel-uhd/results.json).

Arquivos completos: [antes](before/results.json), [depois](after/results.json), [verificação visual e de comportamento](verification/results.json). [Descrição da implementação e limitações](../DESEMPENHO-IMPLEMENTADO.md).
