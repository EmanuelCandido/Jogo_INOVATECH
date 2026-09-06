# Registro de validação

## Atualização V2

Após a evolução visual/narrativa: build aprovado, **22 testes unitários e 12 testes de navegador aprovados** contra produção (1440 × 900, Pixel 7 emulado e 360 × 640). Há teste de imagem do personagem carregada, nome, ramo narrativo opcional e retomada da fala. Os testes anteriores de economia, efeitos, recorrência e tutorial foram preservados. A inspeção visual gerou também capturas `*-intro.png`. O relatório atual está em `RELATORIO-V2.md`; as informações abaixo registram a primeira entrega.

O projeto foi compilado com TypeScript estrito e Vite. A suíte de regras valida os três resultados, saldo exato/insuficiente, prevenção de cobrança duplicada, desbloqueio, recorrência, saída sem decisão e persistência por adapter.

Resultado confirmado: 16 testes unitários e 9 cenários E2E aprovados. Os seis cenários de desktop (1440 × 900) e Pixel 7 emulado (412 × 839) passaram após a mudança para renderização sob demanda. Os três cenários adicionais de 360 × 640 também passaram, incluindo toque e rolagem dos painéis. As capturas finais foram inspecionadas; o retorno à cidade permanece fixo na área visível do resultado móvel.

Build: UI inicial com aproximadamente 216 KB de JavaScript (69 KB gzip); módulo 3D separado com aproximadamente 960 KB (262 KB gzip). O Vite avisa sobre o tamanho do módulo 3D; isso permanece registrado como limite para otimizações com conteúdo real.

No Chromium, o ciclo foi executado com mouse e toque emulado: introdução → marcador → transição de câmera → contexto → três alternativas → resultado → retorno → próximo marcador → reload. Foram verificados FULL, TEMPORARY, NONE, moedas, tutorial persistido e configurações LOW/redução de movimento.

A primeira execução E2E encontrou um seletor incorreto (`Continuar` versus `Continuar →`); foi corrigido. A inspeção visual encontrou o painel encobrindo a consequência no celular; o Canvas agora ocupa a área acima do painel em foco. Painéis pequenos têm rolagem interna. Não há rolagem horizontal nas larguras 360, 412 e 1440 verificadas.

Capturas em `docs/screenshots/` mostram overview, pergunta e resultado definitivo em três viewports. `scripts/capture.mjs` reproduz as capturas. O renderizador é real (WebGL em Chromium com SwiftShader no ambiente de teste), não uma imagem estática.

Performance: vegetação procedural instanciada, uma luz com sombras limitadas, DPR por qualidade e renderização sob demanda. O teste funcional não certifica FPS em aparelhos físicos. Nenhuma afirmação de 60 FPS é feita.
