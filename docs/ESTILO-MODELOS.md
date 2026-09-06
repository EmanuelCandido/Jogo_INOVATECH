# Modelos — referência de cidade estilizada

Registro histórico da direção anterior. A referência mais recente e o conjunto completo de 33 modelos estão em [MODELOS-MINIATURA.md](MODELOS-MINIATURA.md).

Referência fornecida nesta etapa: `image-1.png`, cidade isométrica com prédios coral, árvores de copa arredondada e ruas ameixa.

## Critérios extraídos da imagem

| Característica | Aplicação no projeto | Evidência a conferir |
| --- | --- | --- |
| Fachadas coral, salmão e amarelo, materiais foscos | Paleta linear em `reference_style.py` | Captura da cidade e GLBs exportados |
| Janelas estreitas e separadas, moldura clara | Janelas modeladas nas faces frontal/lateral, proporção reduzida | Fachadas em overview e foco |
| Telhados planos com borda elevada e equipamentos | Platibandas, acesso de cobertura, exaustores e HVAC | Coberturas visíveis na câmera isométrica |
| Escadas de incêndio externas escuras | Patamares, degraus, guarda-corpos nos prédios maiores | Faces laterais dos modelos |
| Lojas com toldos listrados | Térreo comercial salmão e escola | Modelos na praça e escola |
| Casas baixas com telhado inclinado | Dois modelos com varanda, cerca e terreno | Bairro residencial |
| Árvores arredondadas com tronco fino | Copas lobadas suavizadas, galhos e duas variações | Vegetação em todas as regiões |
| Carros miniatura mais definidos | Cabine trapezoidal, rodas, pilares de janela, faróis e para-choques | Ruas e arquivos de modelo |
| Postes finos e semáforos | Modelos leves, instanciados nas vias | Cruzamentos |
| Chão verde, água azul viva e asfalto ameixa | Materiais semânticos atualizados | Cidade no navegador |

O pedido é de estilo dos modelos. A disposição da cidade, a narrativa e as regras do jogo foram preservadas. Não foi inserida uma imagem estática como cenário nem copiado o layout exato da referência.

## Autoria e integração

O módulo `scripts/blender/reference_style.py` define a nova direção de arte. O gerador existente importa essas definições, mantém os IDs lógicos e exporta `.blend`/GLB. `npm run assets:build` reconstrói e otimiza tudo com glTF-Transform.

Novos IDs: `building.house.cream`, `building.house.coral`, `prop.car.blue`, `prop.car.white`, `prop.traffic`. Modelos existentes usam os mesmos caminhos para preservar composição e gameplay. Árvores, edifícios, carros e semáforos continuam em lotes instanciados.

As proporções verticais do centro foram reduzidas para aproximar a relação entre árvores e prédios da referência. Não foi adicionado desfoque constante à câmera: o acabamento vem das malhas, cores e materiais, mantendo a leitura dos problemas.

O conjunto atual contém 22 GLBs: 1.491.280 bytes antes e 1.121.924 bytes depois da otimização. O aumento sobre a versão anterior vem principalmente das fachadas, coberturas e escadas modeladas. Os objetos repetidos continuam compartilhando geometria/material por instancing; não foram adicionadas dependências.

## Verificação

Comparar a captura final `docs/screenshots/desktop-overview.png` com os critérios acima. Os testes de navegador verificam carregamento, interação e consequências; a correspondência estilística depende da inspeção visual, não apenas de testes automatizados.
