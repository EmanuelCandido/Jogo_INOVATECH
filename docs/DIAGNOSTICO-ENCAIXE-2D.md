# Diagnóstico do encaixe dos acessórios 2D

Data: 26/09/2026. Diagnóstico da versão anterior e registro da correção 2D.

## O problema real

O Impactus é uma ilustração 2D em três quartos, com perspectiva, iluminação, volumes e sobreposições já desenhados. Acessórios independentes de catálogo não se tornam peças vestidas apenas por receberem escala, deslocamento, rotação, máscara e sombra.

### Evidências da versão reprovada

| Parte | Implementação/arte atual | Consequência visual |
| --- | --- | --- |
| Mochila | `WearablePreview` e `BackpackLayer` usam o mesmo `urbanSource(item.art)`. Os prompts em `assets-source/ui/wardrobe/urban/prompts.json` pedem a face externa da mochila visível, sem personagem. | O painel traseiro da mochila fica voltado para a câmera enquanto o personagem é visto pela frente. Parece um objeto ao lado dele. Diminuir e aproximar não cria a lateral que deveria estar visível. |
| Apoio da mochila | `BackpackLayer` usa o centro e a rotação da cabeça (`wearablePoses[pose].head`). `BackpackStraps` desenha outras alças, separadas das alças que já existem na imagem do produto. | A mochila e suas alças não compartilham pontos de fixação no tronco/ombros. O desenho não comunica um peso realmente apoiado nas costas. |
| Chapéu | `UrbanHeadwear` desenha a imagem inteira por último. Só os óculos têm um recorte parcial. A abertura, o contorno do capacete e a crista do Impactus não foram desenhados juntos. | A peça fica visualmente pousada acima do personagem. Falta a relação entre a parte da aba que passa atrás, a que passa na frente e o capacete que entra na abertura. |
| Sombra | O `feDropShadow` desloca a silhueta inteira do item. | Isso é uma sombra de recorte. Não descreve a pequena sombra de contato e a sombra projetada sobre a superfície curva da cabeça/ombros. |
| Base do personagem | O PNG contém corpo, braços e capa. `CharacterAvatar` tenta retirar a capa pela diferença entre canais de cor (`0 -6 6 0 -.7`), protegendo áreas com polígonos. | É uma seleção aproximada por cor; não fornece uma base limpa do corpo nem informação confiável de quais superfícies estão na frente em cada pose. |
| Poses | O mesmo chapéu e a mesma mochila recebem deslocamento/rotação nas cinco poses. | Um giro da imagem inteira não altera perspectiva, faces visíveis ou o recorte que um braço levantado exige. |
| Validação | Os testes existentes verificam compras, carregamento, tamanho do sprite e preservação de certas áreas. | Eles não demonstram que a perspectiva e o encaixe são convincentes. Aprovação funcional não é aprovação da arte. |

## Por que o ajuste anterior falhou

O ajuste tratou o sintoma — distância e tamanho — mantendo a arte incompatível. As alças e a sombra acrescentadas não corrigem uma face da mochila voltada para a direção errada. A solução depende de arte vestida no personagem, além de uma composição adequada no código.

O colete de oficina editado sobre o próprio Impactus é um exemplo do processo apropriado: a ilustração foi produzida com o corpo presente, estabelecendo gola, cintura, costuras e iluminação. Isso não valida automaticamente a mochila, o chapéu ou todas as poses.

## Critérios usados na correção

1. **Usar a ilustração original como referência imutável.** Manter rosto, capacete, membros, pose, proporções e posição no quadro. O personagem continua 2D.
2. **Finalizar primeiro um chapéu e uma mochila vestidos na pose inicial.** Criar a composição completa sobre o original, com perspectiva correta, recortes e sombras. A mochila deve mostrar a lateral e apenas a parcela da face externa realmente visível. A abertura do chapéu deve envolver a cabeça; decidir visualmente quais trechos da crista ficam encobertos.
3. **Separar arte de vitrine de arte vestida.** Os PNGs existentes podem continuar nos cards. O personagem precisa de sprites próprios: parte traseira, parte frontal, sombra de contato e máscara da área encoberta, quando aplicável. Exportar todos no mesmo quadro, com registro consistente.
4. **Preparar uma base limpa e máscaras por pose.** Corpo sem capa, contorno real da cabeça, braços/mãos que cruzam o tronco e áreas que recebem sombras. A capa clássica deve ser um componente recuperável, sem depender de seleção de cor para desaparecer.
5. **Compor as peças em uma ordem definida.** Partes traseiras → corpo → roupa e alças → membros que passam na frente. Na cabeça: parte traseira da aba → capacete com o recorte apropriado → parte frontal → sombra de contato limitada ao capacete. As ordens exatas pertencem à pose e à peça, não a uma única regra de “tudo por último”.
6. **Adaptar às outras quatro poses.** Ombros, cintura e cabeça têm registros próprios. Quando muda a face visível do acessório, produzir a vista correspondente; uma rotação 2D não substitui essa arte.
7. **Manter combinações independentes.** Mochila, traje e chapéu usam esses mesmos registros e máscaras. Não embutir os três acessórios em um único sprite que impeça o jogador de misturar peças.

## Critério de aceite antes de expandir para a coleção

- A mochila parece apoiada nas costas, com alças contínuas saindo de pontos plausíveis nos ombros; não exibe sua face traseira inteira como um card lateral.
- A abertura e as duas partes da aba do chapéu contornam o capacete; não há flutuação, interseção inexplicável ou crista atravessando a peça.
- Sombras acompanham a superfície do personagem, com a mesma direção de luz da ilustração.
- As mãos ficam corretamente na frente durante gestos, sem reaparecerem por cima de áreas que deveriam ser roupa.
- Tirar qualquer peça restaura o original sem mudar rosto, escala, pose ou outras peças.
- Revisar ampliado, no tamanho real do celular e nas cinco poses. Só então aplicar o processo aos demais itens.

## Implementação

- As três coleções têm referências ilustradas com as peças já vestidas no Impactus. `gear-prompts.json` preserva os pedidos completos e os PNGs ficam em `assets-source/ui/wardrobe/fitted`.
- `wornArtwork.ts` registra os contornos da cabeça e das alças. A arte de costas foi desenhada novamente em vista lateral, completando o material oculto pelos braços; um gesto não revela outro braço embutido na mochila.
- `prepare-fitted-accessories.mjs` extrai nove camadas registradas em 768 × 768, com alfa verdadeiro. Os fundos opacos das folhas de referência não chegam ao jogo. As nove camadas somam cerca de 115 KB.
- `FittedGear.tsx` monta mochila atrás do corpo, alças sobre o peito e acessórios envolvendo a cabeça. Cabeça e tronco têm registros independentes nas cinco poses. A ilustração original continua fornecendo rosto, mãos, corpo e expressões.
- `bodySilhouettes.ts` separa corpo e capa por contornos de cada pose. Não usa mais a diferença de canais para retirar a capa. A revisão ampliada identificou e corrigiu os fragmentos deixados junto a braços, mãos e pernas.
- Os cards de mochilas e acessórios de cabeça usam as próprias camadas vestidas; as descrições refletem a arte final.
- Cada posição continua independente. Tirar a mochila restaura a capa clássica; trocar o chapéu não troca a mochila nem o traje. As compras antigas permanecem no armário.

## Verificação reproduzível

`tests/wardrobe-silhouettes.test.ts` verifica coordenadas reais dos fragmentos de capa, preservação de pontos dos membros e transparência das exportações. `wardrobe-fitting.test.ts` verifica o registro 2D; `wardrobe.test.ts` verifica compras e persistência. Os testes de navegador cobrem mistura entre coleções, compra, recarga, diálogo, peças antigas e teclado. Esses testes complementam a inspeção ampliada das cinco poses; não substituem a avaliação visual.
