import type {CharacterPose} from '../game/types';
/** The game's ending: when every situation has a complete solution, Impactus
 * notices it, the camera visits each transformed place, the city celebrates
 * and a closing screen sums up the journey. Text only; the timing lives in
 * src/game/ending.ts and the presentation in src/ui/ending. */
export interface EndingLine {text:string;pose:CharacterPose;actionLabel?:string}
/** Places in the order the camera visits them, a short hop from one to the next. */
export const endingTour:{problemId:string;caption:string}[]=[
 {problemId:'accessibility_01',caption:'Com a rampa, todo mundo entra na prefeitura.'},
 {problemId:'accessibility_02',caption:'O piso tátil guia o caminho até o hospital.'},
 {problemId:'pollution_01',caption:'Lixeiras e coleta seletiva deixaram as ruas limpas.'},
 {problemId:'security_02',caption:'Botões de emergência trazem ajuda rápida.'},
 {problemId:'nature_02',caption:'Árvores e energia solar refrescam o quarteirão.'},
 {problemId:'pollution_02',caption:'Mais ônibus, menos carros na avenida.'},
 {problemId:'health_02',caption:'Sem queimadas e com filtros, a fumaça sumiu.'},
 {problemId:'health_01',caption:'Com saneamento, o rio voltou a ficar limpo.'},
 {problemId:'nature_01',caption:'A mata recuperada voltou a abrigar os animais.'},
 {problemId:'security_01',caption:'Os animais estão seguros, e a estrada também.'},
];
export const endingOpening:EndingLine={pose:'character_alert',actionLabel:'Ver a cidade',
 text:'Espera aí… Esse era o último problema da cidade! Vamos dar uma volta para ver como ela ficou?'};
export const endingDialogue:EndingLine[]=[
 {pose:'character_success',text:'Olha só para a nossa cidade! Não sobrou nenhum problema sem solução.'},
 {pose:'character_thinking',text:'Lembra de quando chegamos? Tinha lixo nas ruas, fumaça no ar e lugares onde nem todo mundo conseguia entrar.'},
 {pose:'character_intro',text:'Agora tem rampa na prefeitura, piso tátil até o hospital, rio limpo e animais protegidos.'},
 {pose:'character_intro',text:'O ar ficou mais limpo, os ônibus levam mais gente e as ruas estão mais seguras.'},
 {pose:'character_success',text:'E sabe o que fez a diferença? Você observou com calma, entendeu cada problema e escolheu soluções que cuidam da causa.'},
 {pose:'character_success',actionLabel:'Ver o encerramento',text:'Obrigado por cuidar da Eco City comigo. Cada escolha deixou uma marca, e as suas deixaram a cidade melhor!'},
];
export const endingCopy={
 tourLabel:'Cidade transformada',
 finaleTitle:'Cidade transformada!',
 finaleText:'Os dez lugares da Eco City receberam soluções completas.',
 skipTour:'Pular passeio',
 skipDialogue:'Pular conversa',
 eyebrow:'FIM DA JORNADA',
 title:'A Eco City mudou com você',
 perfect:'Você acertou todas de primeira. Que olhar atento!',
 learned:'Errar também fez parte: cada nova tentativa trouxe uma ideia melhor.',
 thanks:'Obrigado por jogar! A cidade continua aqui para você explorar quando quiser.',
 explore:'Continuar explorando',
 replay:'Ver o final de novo',
 restart:'Jogar desde o começo',
 restartConfirm:'Apagar o progresso, as moedas e os acessórios e começar uma nova história?',
 restartYes:'Sim, começar de novo',
 restartNo:'Cancelar',
};
