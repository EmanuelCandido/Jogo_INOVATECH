# Coleções do Impactus

As mochilas e os acessórios de cabeça das três coleções usam agora artes vestidas, com recortes e registros próprios. O [diagnóstico e registro da correção 2D](DIAGNOSTICO-ENCAIXE-2D.md) explica a substituição das imagens de catálogo e a retirada dos fragmentos da capa original.

A loja apresenta três coleções ligadas à transformação da cidade. Cada uma tem uma mochila, um traje e um acessório para a cabeça, com arte própria. As peças podem ser combinadas entre coleções.

| Coleção | Tema | Peças | Total em moedas |
| --- | --- | --- | --- |
| Pulso Solar | Energia limpa e mobilidade | Estação de bolso, Colete raio de sol, Capacete horizonte | 540 |
| Jardim de Bolso | Cuidado com praças e vegetação | Viveiro portátil, Avental semeador, Chapéu flor do bairro | 470 |
| Oficina Circular | Conserto e reaproveitamento | Oficina nas costas, Colete segunda vida, Óculos de boas ideias | 510 |

## Experiência

A loja mantém o layout anterior (prévia à esquerda, abas por posição e compra peça a peça). Em 27/09/2026, a versão do Astra com as abas Coleções, Peças e Meu armário foi substituída por esse layout, a pedido de Emanuel, conservando as peças, as artes e o encaixe.

- As abas **Costas**, **Trajes** e **Cabeça** mostram primeiro as três peças novas de cada posição e depois as clássicas, que continuam à venda. As capas e os chapéus clássicos ganharam artes vestidas novas (seção abaixo); as jaquetas clássicas não mudaram.
- O detalhe da peça selecionada mostra a coleção e o destaque da peça, na cor da coleção.
- Experimentar não custa moedas. Cada peça é comprada no botão "Comprar por", e "Salvar visual" equipa a combinação.
- A saída com alterações não aplicadas mantém a confirmação para evitar perder a prévia.

Os acessórios são cosméticos e usam as moedas já existentes no jogo. Não alteram os resultados das escolhas.

## Artes e encaixe

O Impactus continua sendo a ilustração 2D original, com as cinco poses existentes. A interface não carrega um modelo 3D do personagem. O estudo 3D foi retirado da aplicação após a orientação do usuário.

As artes foram criadas com a ferramenta integrada ImageGen. Os fontes e os prompts estão em `assets-source/ui/wardrobe/urban/` e `assets-source/ui/wardrobe/fitted/`. As três novas referências vestidas e a folha das mochilas fornecem peças com a perspectiva do personagem. A vitrine mostra as mesmas peças utilizadas pelo avatar.

`node scripts/prepare-urban-accessories.mjs` verifica o canal alfa, retira margens transparentes, preserva as proporções e exporta os WebPs para `public/assets/accessories/urban/`. Os nove arquivos totalizam aproximadamente 1 MB.

`node scripts/prepare-fitted-accessories.mjs` exporta separadamente os acessórios de cabeça, alças e costas. Os contornos retiram o fundo dos fontes e preservam a posição dentro do quadro de 768 × 768. As nove novas camadas com transparência real somam cerca de 115 KB.

O colete de oficina usa o trecho da ilustração em que já está vestido, com gola, costuras e sombras compatíveis com o peito do Impactus. Os tecidos solar e jardim são deformados em triângulos 2D entre gola, laterais e cintura. O mesmo mapeamento posiciona costuras e sombras de contato nas cinco poses. As mãos que cruzam o peito ficam na frente do tecido. A cor da armadura original é preservada.

As mochilas mostram sua lateral, apoiadas atrás do tronco, e têm alças ilustradas sobre os ombros. Os chapéus cobrem o trecho apropriado do capacete e recebem sombra de contato; os óculos têm uma tira que acompanha a cabeça. Os contornos do corpo foram revistos nas cinco poses para remover os fragmentos de capa. A área reservada aos acessórios mantém constante o tamanho do corpo durante a prévia. As compras antigas continuam no armário e podem ser combinadas com as novas peças.

Os identificadores persistidos `cape`, `jacket` e `hat` foram mantidos para compatibilidade com os salvamentos antigos. A posição `cape` aceita uma mochila ou uma capa clássica. Na loja essa aba se chama **Costas**.

## Capas e chapéus clássicos renovados

Os seis chapéus clássicos passaram pelo mesmo processo de arte vestida das coleções: aba, tecido, pontos de contato e registro na cabeça. O código não usa mais as fotografias de produto no personagem nem diminui seu corpo ao colocar um chapéu nos diálogos.

As seis capas têm artes de tecido completas e independentes, com motivos de cidade, rio, jardim, reaproveitamento, vento e energia solar. São compostas atrás do corpo, usando os contornos das cinco poses. Isso substitui o filtro de recoloração e os símbolos sobrepostos à capa antiga. IDs e preços continuam iguais, preservando todas as compras.

Fontes, prompts completos e instruções de exportação: [classic-v2](../assets-source/ui/wardrobe/classic-v2/README.md). As doze camadas exportadas ficam em `public/assets/accessories/classic-v2` e somam aproximadamente 456 KiB.

Validação desta etapa em 27/09/2026: TypeScript e build de produção passaram, assim como 19 testes unitários. Os 12 cenários de navegador em desktop e celular passaram após a correção dos cards em telas pequenas e a atualização das áreas de comparação do rosto: o teste compara olhos e boca, deixando a aba cobrir a testa. A revisão visual cobre os seis chapéus e as seis capas nas cinco poses, com mistura entre peças antigas e coleções.

## Verificação

- Testes unitários: peças das três coleções nas posições certas, compra peça a peça, mistura com peças antigas e restauração do salvamento; registro 2D e contornos do corpo (`wardrobe-fitting`, `wardrobe-silhouettes`).
- Testes de navegador (`wardrobe.spec.ts`, `hud-controls.spec.ts`): as nove peças novas aparecem nas abas, carregam e não mudam a escala do corpo; compra, recarga, visual nos diálogos, peças antigas, teclado e saída sem salvar.
