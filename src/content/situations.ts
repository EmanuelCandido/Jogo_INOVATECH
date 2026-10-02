import type {Category,CharacterPose,Effectiveness,Vec3} from '../game/types';
export interface SituationContent {id:string;category:Category;title:string;regionName:string;worldPosition:Vec3;markerIcon:string;comment:string;characterPose:CharacterPose;unlockAfter:number;questionId:string;description:string;question:string;answers:{id:string;text:string;cost:number;effectiveness:Effectiveness;explanation:string;consequence:string}[]}
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
    "comment": "O lixo está chegando perto dos animais. Vamos investigar!",
    "characterPose": "character_thinking",
    "unlockAfter": 0,
    "questionId": "waste",
    "description": "Há lixo nas ruas e perto dos animais. Eles podem se machucar, e a sujeira aumenta a cada dia.",
    "question": "Como diminuir o lixo nas ruas?",
    "answers": [
      {
        "id": "collection",
        "text": "Melhorar a coleta, instalar lixeiras e ensinar a separar o lixo.",
        "cost": 60,
        "effectiveness": "COMPLETE",
        "explanation": "Boa escolha! Com coleta e lixeiras, o lixo vai para o lugar certo.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cleanup",
        "text": "Aplicar multas a quem jogar lixo nas ruas.",
        "cost": 90,
        "effectiveness": "TEMPORARY",
        "explanation": "As multas ajudam, mas ainda faltam lugares para jogar o lixo.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "banner",
        "text": "Colocar cartazes pedindo para não jogar lixo no chão.",
        "cost": 35,
        "effectiveness": "NONE",
        "explanation": "Os cartazes avisam, mas o lixo ainda fica sem destino.",
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
    "comment": "Há muitos carros e poucos ônibus nesta avenida.",
    "characterPose": "character_thinking",
    "unlockAfter": 2,
    "questionId": "transport",
    "description": "Muita gente usa carro porque faltam ônibus. O trânsito aumenta e a fumaça dos carros polui o ar.",
    "question": "Como reduzir os carros poluentes?",
    "answers": [
      {
        "id": "public_transport",
        "text": "Oferecer mais ônibus, com conforto e horários confiáveis.",
        "cost": 90,
        "effectiveness": "COMPLETE",
        "explanation": "Com mais ônibus e bons horários, mais pessoas podem deixar o carro em casa.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "fares",
        "text": "Dar descontos nas passagens dos ônibus que já existem.",
        "cost": 45,
        "effectiveness": "TEMPORARY",
        "explanation": "A passagem mais barata ajuda, mas ainda faltam ônibus.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "lectures",
        "text": "Fazer palestras sobre a poluição causada pelos carros.",
        "cost": 100,
        "effectiveness": "NONE",
        "explanation": "As palestras informam, mas as pessoas ainda precisam de mais ônibus.",
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
    "comment": "Os animais estão perto dos carros. Que perigo!",
    "characterPose": "character_alert",
    "unlockAfter": 2,
    "questionId": "road_animals",
    "description": "Os animais perderam parte da floresta onde vivem. Agora chegam à estrada e correm risco de atropelamento.",
    "question": "Como proteger os animais na estrada?",
    "answers": [
      {
        "id": "rescue",
        "text": "Chamar uma equipe para levar os animais a um lugar seguro.",
        "cost": 45,
        "effectiveness": "COMPLETE",
        "explanation": "A equipe protegeu os animais. Também precisamos cuidar da floresta onde vivem.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "food",
        "text": "Deixar comida para os animais perto da estrada.",
        "cost": 80,
        "effectiveness": "TEMPORARY",
        "explanation": "A comida atrai os animais para perto dos carros. O perigo continua.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "ignore",
        "text": "Passar pelos animais sem fazer nada para protegê-los.",
        "cost": 60,
        "effectiveness": "NONE",
        "explanation": "Sem ajuda, os animais continuam na estrada e podem se machucar.",
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
    "comment": "Aqui é difícil pedir ajuda. O que está faltando?",
    "characterPose": "character_alert",
    "unlockAfter": 4,
    "questionId": "street_safety",
    "description": "Há acidentes e perigo nestas ruas. Faltam equipes de segurança, e as pessoas não conseguem pedir ajuda rapidamente.",
    "question": "Como deixar estas ruas mais seguras?",
    "answers": [
      {
        "id": "emergency",
        "text": "Instalar botões de emergência e colocar mais equipes nas ruas.",
        "cost": 85,
        "effectiveness": "COMPLETE",
        "explanation": "Agora as pessoas podem chamar ajuda e receber atendimento mais rápido.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cameras",
        "text": "Instalar câmeras nas ruas onde há mais problemas.",
        "cost": 60,
        "effectiveness": "TEMPORARY",
        "explanation": "As câmeras mostram o que acontece, mas ainda faltam equipes para ajudar.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "signs",
        "text": "Colocar placas pedindo cuidado a quem passa por ali.",
        "cost": 35,
        "effectiveness": "NONE",
        "explanation": "As placas avisam, mas não ajudam a chamar as equipes de segurança.",
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
      -25,
      0,
      -27
    ],
    "markerIcon": "🦋",
    "comment": "Os animais estão perdendo seu lar. Como protegê-los?",
    "characterPose": "character_thinking",
    "unlockAfter": 4,
    "questionId": "habitat",
    "description": "Alguns animais estão desaparecendo. A caça e a perda dos lugares onde vivem colocam essas espécies em perigo.",
    "question": "Como proteger as espécies ameaçadas?",
    "answers": [
      {
        "id": "restore",
        "text": "Proteger e recuperar os lugares onde os animais vivem.",
        "cost": 65,
        "effectiveness": "COMPLETE",
        "explanation": "Com seu lar protegido, os animais têm comida, abrigo e espaço para viver.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "reintroduce",
        "text": "Trazer mais animais da espécie de volta à natureza.",
        "cost": 90,
        "effectiveness": "TEMPORARY",
        "explanation": "Trazer animais de volta ajuda, mas eles ainda precisam de um lar protegido.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "observe",
        "text": "Contar os animais que restam, sem proteger seu lar.",
        "cost": 80,
        "effectiveness": "NONE",
        "explanation": "Contar os animais não impede a caça nem a destruição do lugar onde vivem.",
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
    "comment": "Que calor! Há poucas árvores e muitos aparelhos ligados.",
    "characterPose": "character_thinking",
    "unlockAfter": 6,
    "questionId": "climate",
    "description": "A cidade gasta muita energia e tem poucas árvores. Sem sombra, as ruas ficam ainda mais quentes.",
    "question": "Como reduzir o calor e cuidar do clima?",
    "answers": [
      {
        "id": "green_energy",
        "text": "Plantar mais árvores e usar energia de forma sustentável.",
        "cost": 95,
        "effectiveness": "COMPLETE",
        "explanation": "Mais árvores e energia sustentável ajudam a refrescar a cidade e cuidar do clima.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "reduce_hours",
        "text": "Economizar energia só em alguns horários do dia.",
        "cost": 50,
        "effectiveness": "TEMPORARY",
        "explanation": "Economizar por algumas horas ajuda, mas ainda faltam árvores e mais economia.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "more_ac",
        "text": "Ligar mais ventiladores e aparelhos de ar-condicionado.",
        "cost": 80,
        "effectiveness": "NONE",
        "explanation": "Mais aparelhos gastam mais energia, e as ruas continuam sem sombra.",
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
    "comment": "O rio recebe sujeira todo dia. De onde ela vem?",
    "characterPose": "character_alert",
    "unlockAfter": 6,
    "questionId": "river",
    "description": "Lixo e água suja chegam ao rio todos os dias. Pessoas que entram em contato com essa água estão ficando doentes.",
    "question": "Como cuidar do rio e da saúde das pessoas?",
    "answers": [
      {
        "id": "sanitation",
        "text": "Tratar o esgoto da cidade e recuperar o rio poluído.",
        "cost": 80,
        "effectiveness": "COMPLETE",
        "explanation": "Tratar o esgoto reduz a sujeira que chega. A recuperação ajuda a limpar o rio.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "cleanups",
        "text": "Reunir moradores para limpar o rio de vez em quando.",
        "cost": 45,
        "effectiveness": "TEMPORARY",
        "explanation": "A limpeza tira parte do lixo, mas a água suja continua chegando ao rio.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "warnings",
        "text": "Colocar placas avisando que a água do rio está suja.",
        "cost": 95,
        "effectiveness": "NONE",
        "explanation": "As placas avisam do perigo, mas não impedem a sujeira de chegar ao rio.",
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
    "comment": "A fumaça chega aos vizinhos. Vamos descobrir de onde vem.",
    "characterPose": "character_alert",
    "unlockAfter": 8,
    "questionId": "air",
    "description": "Queimadas e outras fontes de poluição soltam muita fumaça. O ar sujo faz mal às pessoas que vivem por perto.",
    "question": "Como diminuir a fumaça e melhorar o ar?",
    "answers": [
      {
        "id": "prevent_burning",
        "text": "Impedir queimadas e reduzir a poluição na cidade.",
        "cost": 100,
        "effectiveness": "COMPLETE",
        "explanation": "Controlar as fontes de poluição diminui a fumaça e melhora o ar.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "trees",
        "text": "Plantar árvores e cuidar das áreas verdes da cidade.",
        "cost": 75,
        "effectiveness": "TEMPORARY",
        "explanation": "As árvores ajudam, mas as queimadas e outras fontes de fumaça continuam.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "talks",
        "text": "Fazer palestras sobre os perigos causados pela fumaça.",
        "cost": 40,
        "effectiveness": "NONE",
        "explanation": "As palestras ensinam, mas não param a fumaça que polui o ar.",
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
    "comment": "Como encontrar o hospital sem enxergar o caminho?",
    "characterPose": "character_thinking",
    "unlockAfter": 8,
    "questionId": "hospital_path",
    "description": "Uma pessoa com deficiência visual precisa chegar ao hospital. Sem piso tátil na calçada, é difícil encontrar o caminho com segurança.",
    "question": "Como tornar o caminho até o hospital acessível?",
    "answers": [
      {
        "id": "tactile",
        "text": "Instalar piso tátil em todo o caminho até o hospital.",
        "cost": 50,
        "effectiveness": "COMPLETE",
        "explanation": "O piso tátil ajuda a pessoa a encontrar o hospital com mais autonomia.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "handrails",
        "text": "Instalar corrimãos em algumas partes do caminho.",
        "cost": 35,
        "effectiveness": "TEMPORARY",
        "explanation": "Os corrimãos ajudam em alguns trechos, mas não indicam todo o caminho.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "hospital_sign",
        "text": "Colocar uma placa mostrando onde fica o hospital.",
        "cost": 85,
        "effectiveness": "NONE",
        "explanation": "A placa não ajuda quem não consegue vê-la. O caminho ainda precisa de piso tátil.",
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
    "comment": "Só há escadas. Como entrar usando cadeira de rodas?",
    "characterPose": "character_thinking",
    "unlockAfter": 0,
    "questionId": "plaza_access",
    "description": "A entrada do prédio só tem escadas. Quem usa cadeira de rodas depende de ajuda para entrar.",
    "question": "Como tornar a entrada do prédio acessível?",
    "answers": [
      {
        "id": "ramp",
        "text": "Construir uma rampa fixa e adaptar a entrada do prédio.",
        "cost": 80,
        "effectiveness": "COMPLETE",
        "explanation": "A rampa permite entrar com cadeira de rodas sem depender de ajuda.",
        "consequence": "Uma melhoria completa neste lugar."
      },
      {
        "id": "support",
        "text": "Trazer uma rampa móvel quando alguém pedir para entrar.",
        "cost": 40,
        "effectiveness": "TEMPORARY",
        "explanation": "A rampa móvel ajuda, mas a pessoa ainda precisa pedir que a tragam.",
        "consequence": "A situação melhorou parcialmente."
      },
      {
        "id": "campaign",
        "text": "Colocar uma placa dizendo que todos são bem-vindos.",
        "cost": 65,
        "effectiveness": "NONE",
        "explanation": "A placa dá boas-vindas, mas as escadas ainda impedem a entrada.",
        "consequence": "A causa do problema continua."
      }
    ]
  }
];
