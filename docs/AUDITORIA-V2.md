# Auditoria técnica — evolução visual e narrativa

Realizada antes das alterações desta etapa. A base atual possui React 19, TypeScript estrito, Vite 7, Three, R3F, Drei e Zustand. Há 16 testes unitários e 9 cenários E2E documentados, uma praça procedural e dois problemas. Não há Blender nem glTF-Transform instalados no projeto.

| Sistema | Classificação | Evidência e decisão |
| --- | --- | --- |
| Stack e organização engine/content/UI/assets | KEEP | Divisão útil e sem dependência desnecessária; estender diretórios especializados. |
| Economia e perguntas | KEEP | Regras puras com saldo insuficiente e recompensas únicas; conteúdo tipado com três alternativas. |
| ProblemManager e consequências | KEEP | Desbloqueio por dados, recorrência e camadas funcionam; manter IDs para preservar saves. |
| Store e save | REFACTOR | Preservar adapter e dados existentes; acrescentar cursor narrativo com migração compatível. |
| NarrativeManager | REFACTOR | Intro é array e transições são fixas; faltam personagens por fala, nós, choices narrativas e eventos tipados. |
| Câmera | REFACTOR | Centralização e interpolação funcionam; reenquadrar mapa maior e palco narrativo sem múltiplos controladores. |
| UI de diálogo | REPLACE | Componente GameUI acumula painéis; retrato é uma inicial e escolhas parecem formulário. Substituir apresentação, reaproveitar ações e regras. |
| HUD, menus, acessibilidade | REFACTOR | Preservar moedas, configurações, foco, teclado e toque; separar componentes e integrar objetivos. |
| Cidade e composição | REFACTOR | Registry e posições são reaproveitáveis; seis prédios simples, árvores e duas ruas não atingem variedade desejada. Expandir composição intencional ao redor da praça. |
| AssetRegistry e loaders | REFACTOR | IDs e GLB loader já existem; introduzir assets reais otimizados, personagens/retratos e kits instanciáveis. |
| Performance | KEEP/REFACTOR | Preservar renderização sob demanda, DPR e sombras; generalizar instancing para peças repetidas dos novos modelos. |
| CSS anterior de painéis | REMOVE | Remover regras substituídas, sem sobrepor folhas intermináveis. |

## Gargalos e riscos

- Os edifícios procedurais geram múltiplos meshes/draw calls por janela. Aumentar quantidade diretamente multiplicaria o custo. Novos módulos devem agrupar peças e instanciar referências repetidas.
- Vegetação GLB usa clones sem instancing; preparar renderizador em lote para GLBs estáticos.
- A UI concentra conteúdo de interface e estrutura em um arquivo grande. Faltam contratos para personagem ativo e sequência de falas.
- Layout focado recorta o Canvas; um palco inferior e retrato lateral precisam reservar espaço para consequências, especialmente em 360 px.
- Modelos, material e interface de produção ainda não existem. As referências são direção de arte, não promessa de reproduzir uma ilustração 2D detalhada em tempo real.

## Plano de migração

1. Preservar regras e IDs dos problemas, perguntas e saldo. Registrar baseline dos testes.
2. Criar conteúdo de personagens e grafo de diálogo com choices e eventos explícitos. Migrar save sem perder progresso.
3. Substituir apenas a camada de apresentação por CharacterStage, DialogueBox, ChoiceList, HUD e objetivos.
4. Expandir a região existente com rio, pontes, escola, saúde, residências e distrito industrial cenográfico. Manter somente os desafios atuais jogáveis.
5. Criar pipeline reproduzível de modelos modulares, otimizar GLBs, registrar assets e usar instancing em peças repetidas.
6. Ajustar enquadramentos/qualidade e executar testes de regras, navegador e inspeção de capturas.
