import type {Category,CharacterPose,Effectiveness,Vec3} from '../game/types';
export interface SituationContent {id:string;category:Category;title:string;regionName:string;worldPosition:Vec3;markerIcon:string;comment:string;characterPose:CharacterPose;unlockAfter:number;questionId:string;description:string;question:string;costBand:'standard'|'community';answers:{id:string;text:string;effectiveness:Effectiveness;explanation:string;consequence:string}[]}
// Editorial content is independent of rendering and question order.
export const situations:SituationContent[]=[
  {
    "id": "pollution_01",
    "category": "POLLUTION",
    "title": "Lixo nas ruas",
    "regionName": "Jardim do Rio",
    "worldPosition": [
      17.5,
      0,
      6.5
    ],
    "markerIcon": "♻",
    "comment": "Os resíduos chegaram perto dos animais. Vamos observar de onde vem esse acúmulo.",
    "characterPose": "character_thinking",
    "unlockAfter": 0,
    "questionId": "waste",
    "description": "Em vários bairros da cidade, as pessoas estão jogando lixo nas ruas e em terrenos vazios. Além de deixar a cidade suja, o lixo está chegando a áreas onde vivem animais, que acabam ingerindo resíduos ou se machucando. Se nada for feito, a quantidade de lixo continuará aumentando.",
    "question": "O que a cidade deve fazer para reduzir o lixo jogado nas ruas?",
    "costBand": "community",
    "answers": [
      {
        "id": "collection",
        "text": "Instalar mais lixeiras e pontos de coleta seletiva, realizar campanhas de conscientização e melhorar a coleta de lixo.",
        "effectiveness": "COMPLETE",
        "explanation": "Boa escolha! Além de orientar a população, agora existem locais adequados para descartar os resíduos.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cleanup",
        "text": "Criar leis mais rígidas e aplicar multas para quem jogar lixo nas ruas.",
        "effectiveness": "TEMPORARY",
        "explanation": "As multas podem diminuir o problema, mas ainda faltam locais adequados para o descarte.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "banner",
        "text": "Colocar apenas cartazes pela cidade dizendo para não jogar lixo no chão.",
        "effectiveness": "NONE",
        "explanation": "Os cartazes alertam as pessoas, mas o lixo continua sem ter um destino adequado.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "pollution_02",
    "category": "POLLUTION",
    "title": "Carros poluentes",
    "regionName": "Avenida Central",
    "worldPosition": [
      10,
      0,
      -11
    ],
    "markerIcon": "🚍",
    "comment": "Há muitos carros nesta avenida e pouca opção para quem precisa de ônibus.",
    "characterPose": "character_thinking",
    "unlockAfter": 2,
    "questionId": "transport",
    "description": "A cidade possui muitos carros circulando ao mesmo tempo, principalmente veículos movidos a gasolina. O trânsito está aumentando e, junto com ele, a quantidade de poluentes liberados no ar. Cada vez mais pessoas usam carros particulares porque o transporte público não consegue atender bem a população.",
    "question": "Qual seria a melhor forma de diminuir a quantidade de carros poluentes circulando pela cidade?",
    "costBand": "standard",
    "answers": [
      {
        "id": "public_transport",
        "text": "Investir em transporte público de qualidade, com veículos suficientes para atender mais pessoas.",
        "effectiveness": "COMPLETE",
        "explanation": "Um transporte público suficiente e confiável oferece uma alternativa real ao carro particular. A avenida ganhou mais ônibus e menos carros.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "fares",
        "text": "Dar descontos e benefícios nas passagens de ônibus.",
        "effectiveness": "TEMPORARY",
        "explanation": "A tarifa menor facilita o uso, mas a quantidade de ônibus continua insuficiente.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "lectures",
        "text": "Fazer apenas palestras explicando que os carros poluem.",
        "effectiveness": "NONE",
        "explanation": "Informar ajuda a compreender o problema, mas sem uma alternativa de transporte os carros continuam circulando.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "security_01",
    "category": "SECURITY",
    "title": "Animais na estrada",
    "regionName": "Estrada da Mata",
    "worldPosition": [
      -30,
      0,
      -28
    ],
    "markerIcon": "⚠",
    "comment": "Há animais perto da pista. Eles e as pessoas que passam por aqui correm risco.",
    "characterPose": "character_alert",
    "unlockAfter": 2,
    "questionId": "road_animals",
    "description": "Com a construção de novos prédios, alguns animais estão perdendo partes do seu habitat e começando a procurar novos lugares para viver. Durante esse deslocamento, muitos acabam chegando às estradas da cidade, onde correm risco de serem atropelados e também podem causar acidentes.",
    "question": "O que deve ser feito para proteger os animais que estão chegando às estradas?",
    "costBand": "community",
    "answers": [
      {
        "id": "rescue",
        "text": "Resgatar os animais e levá-los para um local seguro e adequado, onde possam receber alimento e proteção.",
        "effectiveness": "COMPLETE",
        "explanation": "Uma equipe capacitada encaminhou os animais para um local adequado. A pista ficou mais segura, e a proteção do habitat continua necessária.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "food",
        "text": "Deixar comida para os animais próximos da estrada, sem retirá-los do local.",
        "effectiveness": "TEMPORARY",
        "explanation": "A comida mantém os animais perto dos veículos. Eles continuam expostos ao risco de atropelamento.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "ignore",
        "text": "Apenas passar pelo local e não fazer nada.",
        "effectiveness": "NONE",
        "explanation": "Sem uma ação de proteção, os animais permanecem na estrada e o risco de acidente continua.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "security_02",
    "category": "SECURITY",
    "title": "Segurança nas ruas",
    "regionName": "Rua do Comércio",
    "worldPosition": [
      35,
      0,
      12.6
    ],
    "markerIcon": "🛡",
    "comment": "Neste trecho, pedir ajuda rapidamente parece difícil. Que estrutura está faltando?",
    "characterPose": "character_alert",
    "unlockAfter": 4,
    "questionId": "street_safety",
    "description": "Algumas regiões da cidade estão registrando acidentes e situações de insegurança. Em certos locais, as pessoas têm dificuldade para pedir ajuda rapidamente e há pouca presença de equipes de segurança.",
    "question": "Qual medida pode tornar esses locais mais seguros para a população?",
    "costBand": "standard",
    "answers": [
      {
        "id": "emergency",
        "text": "Instalar botões de emergência em pontos estratégicos e aumentar o policiamento nas regiões com mais ocorrências.",
        "effectiveness": "COMPLETE",
        "explanation": "Os pontos de emergência e as equipes presentes permitem pedir e receber ajuda mais rapidamente.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cameras",
        "text": "Instalar câmeras de segurança nos locais com mais problemas.",
        "effectiveness": "TEMPORARY",
        "explanation": "As câmeras ajudam a acompanhar a região, mas ainda falta uma resposta rápida no local.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "signs",
        "text": "Colocar apenas placas pedindo para as pessoas tomarem cuidado.",
        "effectiveness": "NONE",
        "explanation": "As placas chamam a atenção, mas não oferecem uma forma de pedir ajuda nem ampliam a presença das equipes.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "nature_01",
    "category": "NATURE",
    "title": "Espécies ameaçadas",
    "regionName": "Borda da Mata",
    "worldPosition": [
      -24,
      0,
      -36
    ],
    "markerIcon": "🦋",
    "comment": "Este habitat está ficando menor. Trazer animais de volta basta se eles não tiverem onde viver?",
    "characterPose": "character_thinking",
    "unlockAfter": 4,
    "questionId": "habitat",
    "description": "Algumas espécies da região estão diminuindo porque estão perdendo seus habitats. Além disso, ações como a caça ilegal aumentam ainda mais o risco de esses animais desaparecerem da natureza.",
    "question": "Qual ação pode ajudar de forma mais completa a proteger essas espécies?",
    "costBand": "community",
    "answers": [
      {
        "id": "restore",
        "text": "Proteger e recuperar os habitats onde esses animais vivem.",
        "effectiveness": "COMPLETE",
        "explanation": "A recuperação e a proteção do habitat devolvem alimento, abrigo e espaço para as espécies.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "reintroduce",
        "text": "Reintroduzir animais da espécie na natureza.",
        "effectiveness": "TEMPORARY",
        "explanation": "Reintroduzir animais pode ajudar, mas o habitat continua reduzido e sem proteção suficiente.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "observe",
        "text": "Apenas observar a quantidade de animais existentes sem realizar nenhuma ação de proteção.",
        "effectiveness": "NONE",
        "explanation": "Acompanhar as espécies fornece informação, mas não impede a perda de habitat ou a caça ilegal.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "nature_02",
    "category": "NATURE",
    "title": "Mudanças climáticas",
    "regionName": "Quarteirão Central",
    "worldPosition": [
      26,
      0,
      -25
    ],
    "markerIcon": "🌳",
    "comment": "Quase não há sombra neste quarteirão. Os aparelhos ligados também consomem energia.",
    "characterPose": "character_thinking",
    "unlockAfter": 6,
    "questionId": "climate",
    "description": "O consumo de energia na cidade aumentou muito. Casas e prédios utilizam ventiladores, ar-condicionado e vários equipamentos durante muitas horas do dia. Ao mesmo tempo, existem poucas áreas verdes, deixando a cidade ainda mais quente.",
    "question": "O que pode ser feito para ajudar a diminuir os impactos das mudanças climáticas na cidade?",
    "costBand": "standard",
    "answers": [
      {
        "id": "green_energy",
        "text": "Investir em reflorestamento, aumentar as áreas verdes e buscar formas de utilizar energia de maneira mais sustentável.",
        "effectiveness": "COMPLETE",
        "explanation": "Mais áreas verdes e uso sustentável de energia atuam juntos sobre o calor e os impactos ambientais da cidade.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "reduce_hours",
        "text": "Reduzir o uso de energia apenas em alguns momentos do dia.",
        "effectiveness": "TEMPORARY",
        "explanation": "Economizar em alguns horários ajuda, mas o quarteirão continua com pouca vegetação e consumo elevado.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "more_ac",
        "text": "Continuar utilizando cada vez mais ventiladores e ar-condicionado sem mudar nenhuma outra ação.",
        "effectiveness": "NONE",
        "explanation": "Usar cada vez mais aparelhos aumenta a demanda de energia e mantém as causas do problema.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "health_01",
    "category": "HEALTH",
    "title": "Rio poluído",
    "regionName": "Rio das Flores",
    "worldPosition": [
      -15,
      0,
      -45.6
    ],
    "markerIcon": "💧",
    "comment": "A água está recebendo resíduos todos os dias. Limpar uma vez resolve a origem?",
    "characterPose": "character_alert",
    "unlockAfter": 6,
    "questionId": "river",
    "description": "Um rio que passa pela cidade está recebendo lixo e água contaminada. Algumas pessoas que vivem perto dele estão entrando em contato com essa água e começando a ficar doentes. A sujeira continua chegando ao rio todos os dias.",
    "question": "O que deve ser feito para melhorar a qualidade da água e proteger a saúde da população?",
    "costBand": "community",
    "answers": [
      {
        "id": "sanitation",
        "text": "Melhorar o saneamento da cidade e realizar a recuperação das áreas poluídas do rio.",
        "effectiveness": "COMPLETE",
        "explanation": "O saneamento reduz a chegada de contaminantes e a recuperação melhora o rio. A água ficou visualmente mais limpa.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cleanups",
        "text": "Realizar mutirões de reciclagem e limpeza do rio de tempos em tempos.",
        "effectiveness": "TEMPORARY",
        "explanation": "O mutirão remove parte dos resíduos, mas a água contaminada continua chegando ao rio.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "warnings",
        "text": "Colocar apenas placas avisando que a água do rio está poluída.",
        "effectiveness": "NONE",
        "explanation": "Os avisos alertam sobre o risco, mas não interrompem o descarte nem recuperam a água.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "health_02",
    "category": "HEALTH",
    "title": "Fumaça e qualidade do ar",
    "regionName": "Distrito Industrial",
    "worldPosition": [
      4,
      0,
      -48
    ],
    "markerIcon": "☁",
    "comment": "A fumaça desta área chega à vegetação e aos prédios vizinhos. Vamos entender a fonte.",
    "characterPose": "character_alert",
    "unlockAfter": 8,
    "questionId": "air",
    "description": "Algumas regiões da cidade estão com muita fumaça causada por queimadas e outras fontes de poluição. O ar está ficando mais quente e desagradável, podendo prejudicar a saúde das pessoas que vivem próximas desses locais.",
    "question": "Qual medida ajudaria de forma mais completa a melhorar essa situação?",
    "costBand": "standard",
    "answers": [
      {
        "id": "prevent_burning",
        "text": "Fiscalizar as áreas onde acontecem queimadas, impedir novas queimas e incentivar formas menos poluentes de funcionamento da cidade.",
        "effectiveness": "COMPLETE",
        "explanation": "A fiscalização e a prevenção atuam na fonte das emissões. O local ganhou controle e menos fumaça.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "trees",
        "text": "Plantar mais árvores e cuidar delas para aumentar as áreas verdes da cidade.",
        "effectiveness": "TEMPORARY",
        "explanation": "As árvores ajudam o ambiente, mas as queimas e as demais fontes de fumaça continuam ativas.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "talks",
        "text": "Apenas realizar palestras falando sobre os problemas causados pela fumaça.",
        "effectiveness": "NONE",
        "explanation": "As palestras informam, mas sem medidas sobre a fonte da fumaça a qualidade do ar não melhora.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "accessibility_02",
    "category": "ACCESSIBILITY",
    "title": "Caminho até o hospital",
    "regionName": "Hospital Municipal",
    "worldPosition": [
      -15,
      0,
      13.1
    ],
    "markerIcon": "◉",
    "comment": "Como encontrar a entrada com autonomia quando faltam referências táteis no caminho?",
    "characterPose": "character_thinking",
    "unlockAfter": 8,
    "questionId": "hospital_path",
    "description": "Uma pessoa com deficiência visual precisa ir ao hospital, mas o caminho até o prédio não possui piso tátil. Ela encontra dificuldades para identificar o caminho correto e se deslocar com segurança pelas calçadas.",
    "question": "O que deve ser feito para tornar esse caminho mais acessível?",
    "costBand": "community",
    "answers": [
      {
        "id": "tactile",
        "text": "Instalar piso tátil ao longo do caminho até o hospital e nos principais pontos de circulação.",
        "effectiveness": "COMPLETE",
        "explanation": "O piso tátil oferece uma referência contínua até a entrada, favorecendo a orientação e o deslocamento com autonomia.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "handrails",
        "text": "Instalar corrimãos apenas em algumas partes do caminho.",
        "effectiveness": "TEMPORARY",
        "explanation": "Os corrimãos ajudam em alguns trechos, mas não formam uma referência contínua até o hospital.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "hospital_sign",
        "text": "Colocar apenas uma placa indicando onde fica o hospital.",
        "effectiveness": "NONE",
        "explanation": "A placa pode orientar parte das pessoas, mas não substitui uma rota com referências táteis.",
        "consequence": "A causa do problema continua."
      }
    ]
  },
  {
    "id": "accessibility_01",
    "category": "ACCESSIBILITY",
    "title": "Acesso ao prédio",
    "regionName": "Prefeitura",
    "worldPosition": [
      -6.8,
      0,
      -1.8
    ],
    "markerIcon": "♿",
    "comment": "Esta escada é uma barreira para quem usa cadeira de rodas. Vamos observar a entrada.",
    "characterPose": "character_thinking",
    "unlockAfter": 0,
    "questionId": "plaza_access",
    "description": "Uma pessoa que utiliza cadeira de rodas precisa entrar em um prédio público da cidade, mas a entrada possui apenas escadas. Por causa disso, ela depende da ajuda de outras pessoas para conseguir acessar o local.",
    "question": "Qual mudança deixaria o prédio realmente mais acessível?",
    "costBand": "standard",
    "answers": [
      {
        "id": "ramp",
        "text": "Construir uma rampa de acesso adequada e adaptar a entrada para permitir a passagem de cadeiras de rodas.",
        "effectiveness": "COMPLETE",
        "explanation": "A rampa integrada à entrada oferece passagem contínua e permite entrar com mais autonomia.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "support",
        "text": "Disponibilizar uma rampa móvel somente quando uma pessoa cadeirante precisar entrar.",
        "effectiveness": "TEMPORARY",
        "explanation": "A rampa móvel ajuda quando está disponível, mas o acesso ainda depende de solicitar a estrutura.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "campaign",
        "text": "Colocar uma placa na entrada informando que o prédio busca ser inclusivo.",
        "effectiveness": "NONE",
        "explanation": "A placa expressa uma intenção, mas a escada continua impedindo a passagem de cadeiras de rodas.",
        "consequence": "A causa do problema continua."
      }
    ]
  }
];
