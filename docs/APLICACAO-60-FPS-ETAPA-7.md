# Sétima entrega: preparação de recursos durante a navegação

15 de setembro de 2026. Implementação aplicada e validada nos controles abaixo. A meta de 60 fps ainda não foi atingida; esta entrega trata preparação de recursos e não reduz o custo dos pixels já renderizados.

## Mudança

O aquecimento anterior chamava `compileAsync` para toda a cena em um único callback. Na Three instalada, a preparação dos materiais dessa chamada é síncrona; a promessa aguarda a compilação na GPU. Agendá-la em um callback de idle não impedia sua execução durante um gesto, especialmente quando o timeout expirava.

A nova fila prepara um renderizável por callback e aguarda a promessa antes de iniciar o próximo. Passa os objetos originais e a cena real à Three, mantendo instanciamento, materiais, iluminação e ambiente. Não clona recursos nem altera a hierarquia. A lista libera suas referências quando termina ou é cancelada.

Arrasto, pinça, teclas mantidas e movimentos da câmera suspendem a preparação opcional. O bloqueio inclui dedos parados na tela e o intervalo entre eventos de repetição do teclado. A fila retoma depois de 500 ms sem interação. Pré-cargas de situações também respeitam esse bloqueio e continuam priorizando os carregamentos visíveis.

A admissão pede pelo menos 4 ms disponíveis no callback de idle. Quando seu timeout expira, admite uma unidade somente se a interação e os carregamentos visíveis permitirem. Isso é um orçamento de admissão, não um limite rígido: uma chamada individual ao driver não pode ser interrompida. A API diagnóstica registra o maior tempo síncrono por unidade.

Nenhum modelo, shader visual, animação, densidade, sombra ou parâmetro de resolução foi reduzido. O trabalho é distribuído no tempo. Essa distribuição pode prolongar o aquecimento completo e precisa ser avaliada na primeira exploração.

## Validação

51 testes focados passaram, incluindo doze novos testes da fila e do aquecimento: bloqueio durante gestos, orçamento insuficiente, fallback sem `requestIdleCallback`, serialização, cancelamento, substituição de filas, objetos removidos e preservação dos objetos originais com a cena de iluminação. O controle da cena inteira também aguarda a unidade em voo antes de começar. Os dois testes adicionais verificam a continuação sem espera artificial e o recuo de 80 ms quando a fila está bloqueada.

TypeScript e build de produção passaram: `index-DTQnp3Qa.js`, `World-CzL_OpFG.js`, `Benchmark-B3-nBtZM.js`.

No desktop com Ultra em 150% e canvas de 1.920 × 1.200, arrasto e tecla mantida iniciaram zero unidades opcionais durante a interação e a fila retomou após a liberação. As 731 unidades terminaram, sem erros, com maior trecho síncrono de 0,60 ms nessa coleta. Foram preservados os 77 modelos e 34.005 instâncias. Esse tempo descreve preparação na CPU, não tempo de quadro ou ganho de FPS. [Coleta desktop](performance/preparation-desktop/results.json).

No controle móvel emulado, com canvas de 1.170 × 2.532, arrasto e pinça também iniciaram zero unidades opcionais durante os gestos e retomaram após a liberação. As 731 unidades terminaram, com maior trecho síncrono de 2,80 ms e sem erros. Modelos, instâncias e parâmetros de máximo foram preservados. [Coleta móvel emulada](performance/preparation-mobile/results.json).

As imagens da primeira coleta ficaram inválidas para comparação: o canvas conservou o anel de foco do teste de teclado e o botão de centralização perdeu o hover da referência. A captura foi separada dos gestos e passou a restaurar explicitamente esses estados e aguardar a câmera. Restaram diferenças entre sessões: 2 a 879 pixels por vista. A comparação entre duas coletas antigas, anteriores a esta mudança, reproduziu exatamente as mesmas contagens e máximos. As oito imagens novas são idênticas pixel a pixel ao outro controle antigo, `leaf-hashes-reuse-images`. Portanto, essas diferenças não foram tratadas como regressão causada pela fila. A causa da variação preexistente entre sessões não foi isolada aqui. [Controles cruzados](performance/preparation-images/control-comparison.json).

Foi acrescentado também um controle dentro da mesma sessão: primeiro o método anterior, com `compileAsync(scene,camera)`, depois a fila incremental. As oito vistas foram idênticas pixel a pixel e não houve erros. Nesse controle já aquecido, a chamada anterior consumiu 6,90 ms síncronos; a maior unidade da fila consumiu 0,60 ms. A fila inteira levou 68,24 segundos, distribuídos entre callbacks, sem bloquear a interação nesse intervalo. Isso não representa comparação de primeiro carregamento nem ganho de FPS. Build desse controle: `index-s6Yi8RGB.js`, `World-mWoEwKrc.js`, `Benchmark-CBTjiGPO.js`. [Controle na mesma sessão](performance/preparation-same-session/results.json).

O controle revelou que a pausa fixa de 80 ms, apropriada para espaçar pré-cargas, prolongava desnecessariamente a fila de shaders. Ela foi retirada apenas entre unidades de shader prontas: continuam uma unidade por callback de idle, sem sobreposição. Quando o trabalho está bloqueado, os 80 ms de recuo permanecem; a fila não entra em polling contínuo durante um gesto. Os downloads também conservam seu intervalo.

Na build final, `index-C4HBIcEt.js`, `World-GyO8CIGs.js` e `Benchmark-CrHhHQhH.js`, o controle da fila residente terminou em 12,80 segundos, contra 68,24 segundos da versão com espera fixa. São coletas distintas de conclusão de aquecimento; a diferença não representa aumento de FPS. Dentro da sessão final, a preparação da cena inteira levou 4,80 ms síncronos; a maior unidade da fila, 0,30 ms. As oito vistas permaneceram idênticas pixel a pixel. Arrasto e teclado mantiveram a fila pendente, sem iniciar nenhuma nova unidade enquanto pressionados, e passaram na verificação contínua dos parâmetros de máximo. [Controle desktop final](performance/preparation-final-desktop/results.json).

Na mesma build final, toque e pinça também conservaram a fila pendente, com zero unidades iniciadas durante os gestos e verificações de máximo aprovadas. Depois da liberação, as 731 unidades terminaram sem erros; maior trecho síncrono de 1,20 ms. Foram mantidos os 77 modelos, 34.005 instâncias e canvas de 1.170 × 2.532. [Controle móvel final, emulado](performance/preparation-final-mobile/results.json).

Os testes de carregamento, navegação e troca de qualidade da versão anterior ao ajuste de intervalo passaram em desktop, mobile e small: 10 aprovados e dois testes de teclado físico ignorados nos perfis móveis. Não houve falha nem teste instável. [Resultado dos fluxos](performance/preparation-e2e/results.json). Após o ajuste de intervalo, os três testes de restauração da partida, espera por modelos e retorno à cidade passaram novamente na build final. [Carregamento final](performance/preparation-final-loading/results.json).

Ainda faltam primeira exploração comparada, memória sustentada e celulares físicos; não há um novo ganho de FPS certificado nesta entrega.

As alterações desta entrega estão locais, sem novo commit ou push. O checkpoint anterior à aplicação do plano já havia sido enviado.
