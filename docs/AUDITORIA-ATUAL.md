# Auditoria da base atual — referências narrativas e cidade

Inspeção realizada antes dos ajustes desta rodada, em 05/09/2026. O prompt anexado é o escopo solicitado; as imagens orientam hierarquia e direção visual, sem reprodução literal. A base já passou pela migração documentada na auditoria V2.

| Sistema | Decisão | Evidência e ação |
| --- | --- | --- |
| Pastas e stack | KEEP | Engine, content, assets e UI separados; todas as dependências obrigatórias imediatas presentes. |
| Cidade e assets | KEEP | 22 GLBs, bairros, rio, pontes, escolas, hospital, indústria e vegetação; pipeline Blender e glTF-Transform reproduzível. |
| Câmera | KEEP | CameraDirector centralizado e transições ligadas à chegada da câmera. |
| Diálogo e UI | REFACTOR | Palco HTML com retrato, placa e choices já implementado; retirar personagem e região fixos dos diálogos de problema. |
| Interações e perguntas | KEEP | Marcadores, teclado/toque, três opções e custos separados da apresentação. |
| Estado, economia e save | KEEP | Zustand coordena regras puras, adapter de save, validação de saldo e restauração. |
| Narrativa | REFACTOR | Grafo de introdução e eventos existentes; tornar personagem de problema configurável por conteúdo. |
| Performance | KEEP | Instancing, renderização sob demanda, qualidade e carregamento separado; FPS em hardware real ainda não medido. |
| Responsividade | KEEP | Três viewports cobertos por testes; concluir inspeção das capturas atuais. |
| Documentação histórica | REPLACE | Atualizar entrada do README para não apresentar limitações antigas como atuais. |
| Código a remover | REMOVE | Apenas literais de personagem/região substituídos por conteúdo; nenhum sistema inteiro exige remoção. |

Plano: preservar regras e saves; parametrizar contexto narrativo; validar build, testes e capturas; registrar instruções de extensão e limites reais. A riqueza da referência continua sendo direção artística: o recorte tem escala menor e dois desafios jogáveis.
