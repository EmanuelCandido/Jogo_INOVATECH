# Validação da revisão dos modelos

Verificação local de 6 de setembro de 2026.

- **49 testes de código passaram** em cinco arquivos: campanha, narrativa, gráficos, implantação e geometria dos modelos.
- **15 testes de navegador passaram** em desktop (1440 × 900), Pixel 7 emulado e tela pequena (360 × 640). A campanha completa de dez situações foi executada no desktop; nos dois perfis móveis foram executadas as duas primeiras situações e os fluxos de reavaliação, recursos insuficientes, carregamento, navegação e qualidade.
- **Build de produção concluído**, com o aviso já existente do Vite sobre o tamanho do módulo 3D.
- **67 GLBs validados**, totalizando 215.904 triângulos e 9.336.304 bytes. Todos têm atributos de posição, normal e oclusão em cores de vértices, com índices válidos.
- As aberturas dos portões da quadra e do campo e o corredor do píer foram testados contra os triângulos reais dos modelos exportados.
- A elevação do morro foi amostrada nas pistas e calçadas próximas. As bases dos bicicletários e jardineiras são verificadas para não entrar na encosta.
- As dez situações preservaram suas matrizes e cores depois de cinco mudanças de qualidade: Alto, Baixo, Ultra, Mínimo e Alto.
- Foram capturados os dez estados iniciais, os dez estados resolvidos e os estados temporários de acessibilidade e calor. A distinção lógica dos três estados de todas as situações também está coberta pelos testes.
- A galeria carregou as **134 vistas individuais** de frente e verso. Busca, mudança de ângulo e ampliação foram verificadas no navegador.
- A inspeção final do mapa não registrou erros de página, WebGL ou carregamento de GLBs.

[Galeria](REVISAO-MODELOS.html) · [Auditoria individual](AUDITORIA-MODELOS.md) · [Resultado da inspeção no navegador](screenshots/finish/runtime-check.json)

As verificações móveis usam emulação de navegador, não aparelhos físicos. O tamanho e a contagem acima são do catálogo, não a memória de GPU nem o total desenhado por quadro da cidade.
