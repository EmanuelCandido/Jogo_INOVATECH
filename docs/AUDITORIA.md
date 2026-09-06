# Fase 1 — auditoria anterior à implementação

Em 05/09/2026, a listagem incluindo arquivos ocultos confirmou que o diretório EcoQuest 1.1 estava vazio. Não existe repositório Git, aplicação, mapa, câmera, carregador, interação, UI, store, perguntas, assets ou dependências. Não foram encontrados AGENTS.md no projeto ou nos diretórios ancestrais consultados.

Não é possível atribuir problemas de arquitetura, duplicação ou performance a código inexistente. KEEP / REFACTOR / REPLACE / REMOVE: nenhuma parte existente a classificar. Nenhum sistema será removido ou substituído.

# Fase 2 — plano de implantação

Criar React/TypeScript/Vite com Three, R3F, Drei e Zustand. Separar conteúdo tipado, regras puras de problemas/economia/progressão, orquestração narrativa, persistência por adapter, direção de câmera, composição visual e UI DOM. Construir uma praça com problema de acesso, Salvador e um próximo problema pequeno para comprovar desbloqueio e recorrência.

O registro terá modelos procedurais provisórios e suporte a GLB, materiais/texturas e ícones substituíveis. Configurar posições e enquadramentos nos dados. Instanciar vegetação repetida. Não adicionar Rapier, BVH, controles de personagem ou pós-processamento sem necessidade. As metas de FPS requerem medição em dispositivos reais; não serão presumidas.

# Decisões

- Recursos globais: apenas moedas, capítulo, problemas, decisões, tutorial, configurações e fase narrativa/seleção. Interpolação de câmera e hover permanecem locais.
- A conclusão de uma tentativa libera o próximo problema mesmo sem solução definitiva; a cidade mantém o resultado real. Temporários reaparecem depois de outra decisão. Recompensas definitivas ocorrem uma única vez.
- Salvamento versionado inclui a fase, permitindo retomar resultados sem cobrar novamente. Dados inválidos ou indisponibilidade de storage têm tratamento explícito.
- A primeira região é procedural, evitando depender de arquivos de terceiros. O registry permite substituição posterior por GLB sem mudar regras do jogo.
