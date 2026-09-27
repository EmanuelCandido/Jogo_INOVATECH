# Coleções do Impactus

As mochilas e os acessórios de cabeça das três coleções usam agora artes vestidas, com recortes e registros próprios. O [diagnóstico e registro da correção 2D](DIAGNOSTICO-ENCAIXE-2D.md) explica a substituição das imagens de catálogo e a retirada dos fragmentos da capa original.

A loja apresenta três coleções ligadas à transformação da cidade. Cada uma tem uma mochila, um traje e um acessório para a cabeça, com arte própria. As peças podem ser combinadas entre coleções.

| Coleção | Tema | Peças | Total em moedas |
| --- | --- | --- | --- |
| Pulso Solar | Energia limpa e mobilidade | Estação de bolso, Colete raio de sol, Capacete horizonte | 540 |
| Jardim de Bolso | Cuidado com praças e vegetação | Viveiro portátil, Avental semeador, Chapéu flor do bairro | 470 |
| Oficina Circular | Conserto e reaproveitamento | Oficina nas costas, Colete segunda vida, Óculos de boas ideias | 510 |

## Experiência

- **Coleções** permite experimentar as três peças juntas, sem gastar moedas.
- **Peças** permite misturar mochilas, trajes e acessórios da cabeça.
- **Meu armário** inclui todas as compras anteriores, mesmo as peças que saíram da vitrine.
- **Comparar** mostra o visual equipado sem perder a combinação em teste.
- **Comprar e usar** adquire e equipa a combinação inteira em uma transação. O preço inclui apenas os itens que faltam. Repetir a ação não cobra de novo.
- A saída com alterações não aplicadas mantém a confirmação para evitar perder a prévia.

Os acessórios são cosméticos e usam as moedas já existentes no jogo. Não alteram os resultados das escolhas.

## Artes e encaixe

O Impactus continua sendo a ilustração 2D original, com as cinco poses existentes. A interface não carrega um modelo 3D do personagem. O estudo 3D foi retirado da aplicação após a orientação do usuário.

As artes foram criadas com a ferramenta integrada ImageGen. Os fontes e os prompts estão em `assets-source/ui/wardrobe/urban/` e `assets-source/ui/wardrobe/fitted/`. As três novas referências vestidas e a folha das mochilas fornecem peças com a perspectiva do personagem. A vitrine mostra as mesmas peças utilizadas pelo avatar.

`node scripts/prepare-urban-accessories.mjs` verifica o canal alfa, retira margens transparentes, preserva as proporções e exporta os WebPs para `public/assets/accessories/urban/`. Os nove arquivos totalizam aproximadamente 1 MB.

`node scripts/prepare-fitted-accessories.mjs` exporta separadamente os acessórios de cabeça, alças e costas. Os contornos retiram o fundo dos fontes e preservam a posição dentro do quadro de 768 × 768. As nove novas camadas com transparência real somam cerca de 115 KB.

O colete de oficina usa o trecho da ilustração em que já está vestido, com gola, costuras e sombras compatíveis com o peito do Impactus. Os tecidos solar e jardim são deformados em triângulos 2D entre gola, laterais e cintura. O mesmo mapeamento posiciona costuras e sombras de contato nas cinco poses. As mãos que cruzam o peito ficam na frente do tecido. A cor da armadura original é preservada.

As mochilas mostram sua lateral, apoiadas atrás do tronco, e têm alças ilustradas sobre os ombros. Os chapéus cobrem o trecho apropriado do capacete e recebem sombra de contato; os óculos têm uma tira que acompanha a cabeça. Os contornos do corpo foram revistos nas cinco poses para remover os fragmentos de capa. A área reservada aos acessórios mantém constante o tamanho do corpo durante a prévia. As compras antigas continuam no armário e podem ser combinadas com as novas peças.

Os identificadores persistidos `cape`, `jacket` e `hat` foram mantidos para compatibilidade com os salvamentos antigos. A posição `cape` aceita uma mochila ou uma capa clássica.

## Verificação

- Testes de transação: saldo exato/insuficiente, compra repetida, coleção parcialmente comprada, combinação inválida, mistura com peças antigas e restauração do salvamento.
- Testes de navegador: compra e comparação, recarga da página, visual nos diálogos, decodificação das nove artes, tamanho do corpo, encaixe dos acessórios antigos, navegação por teclado e saída sem salvar.
- Revisão visual das três coleções nas cinco poses do personagem, além da loja em retrato e paisagem.

Validação em 26/09/2026: TypeScript e compilação de produção concluídos; 17 testes unitários passaram. Os seis fluxos de navegador foram verificados em desktop e em 360 × 640. O teste de missões precisou de 120 segundos de limite por inicializar a cidade duas vezes; passou após esse ajuste, sem alterar as verificações. A compra e a combinação de peças foram repetidas na compilação final do celular, incluindo paisagem, persistência e uso no diálogo.
