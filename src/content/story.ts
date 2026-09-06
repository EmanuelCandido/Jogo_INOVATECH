import {balance} from './balance';
export const story={
 chapter:{id:'arrival',label:'Capítulo 01',title:'Observar a cidade.\nEntender cada escolha.',subtitle:'Cada lugar conta uma parte da história.',initialCoins:balance.initialCoins},
 intro:[
  'Então… esta é a cidade.',
  'À primeira vista, parece um lugar comum. Prédios, ruas, árvores, carros…',
  'Mas tem alguma coisa errada por aqui.',
  'Tem lixo acumulado, áreas difíceis de acessar, problemas de segurança, poluição e lugares que parecem estar prejudicando a saúde das pessoas e o meio ambiente.',
  'Eu ainda não conheço bem a cidade, então não adianta sair tomando decisões sem entender o que está acontecendo.',
  'Alguns problemas parecem simples, mas uma escolha errada pode gastar recursos sem realmente resolver a situação.',
  'Melhor observar com atenção e entender cada caso antes de decidir o que fazer.',
  'Vamos ver por onde começar.'
 ],
 tutorial:{context:'Você acabou de chegar à cidade e percebeu que existem vários problemas espalhados por diferentes regiões.',marker:'Os símbolos indicam situações para investigar. Toque ou clique em um marcador.',costs:'Cada solução possui um custo. Pense no impacto antes de decidir.'},
 results:{COMPLETE:{label:'Uma mudança que fica',icon:'✓'},TEMPORARY:{label:'Um primeiro alívio',icon:'◷'},NONE:{label:'Ainda há um caminho',icon:'↗'}},
 overview:'Observe os sinais no mapa. Novas situações aparecem conforme você investiga a cidade.',
 complete:'As dez situações receberam soluções completas. A cidade mudou com as decisões que você analisou.'
};
