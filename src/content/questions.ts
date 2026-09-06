import type {Question} from '../game/types';
import {situations} from './situations';
import {balance} from './balance';
const states={COMPLETE:'SOLVED',TEMPORARY:'TEMPORARILY_SOLVED',NONE:'AVAILABLE'} as const;
export const questions:Record<string,Question>=Object.fromEntries(situations.map(s=>[s.questionId,{
 id:s.questionId,text:s.question,alternatives:s.answers.map(a=>({...a,cost:balance.costs[s.costBand][a.effectiveness],resultState:states[a.effectiveness]})) as Question['alternatives']
}]));
export const tutorialQuestion:Question={id:'arrival_tutorial',text:'O que deve fazer primeiro?',alternatives:[
 {id:'observe',text:'Observar a cidade, identificar os problemas e entender cada situação antes de tomar uma decisão.',cost:0,effectiveness:'COMPLETE',explanation:'Faz sentido. Primeiro eu preciso entender o que está acontecendo.\nCada parte da cidade pode ter um problema diferente… e cada decisão vai ter uma consequência.\nÉ melhor começar a investigar.',consequence:'Observar antes de decidir.',resultState:'SOLVED'},
 {id:'rush',text:'Tentar resolver imediatamente o primeiro problema que aparecer.',cost:0,effectiveness:'TEMPORARY',explanation:'Agir rapidamente pode ajudar em um momento, mas é preciso entender a causa para escolher uma solução adequada. Vamos observar as alternativas novamente?',consequence:'Vale entender a situação primeiro.',resultState:'TEMPORARILY_SOLVED'},
 {id:'ignore',text:'Ignorar os problemas por enquanto e continuar andando pela cidade.',cost:0,effectiveness:'NONE',explanation:'Continuar sem observar deixa os problemas como estão. Podemos começar identificando o que cada lugar precisa.',consequence:'Ainda podemos começar pela observação.',resultState:'AVAILABLE'}
]};
