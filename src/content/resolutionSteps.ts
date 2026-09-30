import type {VisualKey} from '../config/situationVisuals';
/** Captions shown while the city changes. The three steps follow the
 * animation: the problem leaves, the solution is built, the result settles. */
export const resolutionStepStarts=[0,.4,.8] as const;
type Steps=readonly [string,string,string];
export const resolutionSteps:Record<string,Partial<Record<VisualKey,Steps>>>={
 pollution_01:{solved:['Recolhendo o lixo','Recuperando o terreno','Instalando lixeiras e coleta seletiva'],temporary:['Recolhendo parte do lixo','Recuperando o terreno','Afixando os avisos de multa']},
 pollution_02:{solved:['Tirando carros das ruas','Colocando mais ônibus em circulação','Ar mais limpo na avenida'],temporary:['Reduzindo o trânsito','Promovendo as passagens com desconto','Ainda há fumaça na avenida']},
 security_01:{solved:['Resgatando os animais','Levando os animais ao abrigo','Protegendo a estrada'],temporary:['Atraindo os animais','Deixando comida perto da estrada','Os animais ainda correm risco']},
 security_02:{solved:['Preparando o ponto de apoio','Instalando o botão de emergência','Patrulha na região'],temporary:['Preparando o poste','Instalando a câmera','Rua monitorada, mas sem socorro']},
 nature_01:{solved:['Limpando a área desmatada','Recuperando o habitat','Plantando árvores nativas'],temporary:['Preparando a área','Soltando novos animais','O habitat ainda precisa de cuidado']},
 nature_02:{solved:['Removendo a terra seca','Instalando energia solar','Plantando árvores'],temporary:['Programando os horários','Desligando um aparelho','Economia só em alguns horários']},
 health_01:{solved:['Retirando o lixo do rio','Construindo a estação de tratamento','Rio limpo de novo'],temporary:['Mutirão de limpeza no rio','Retirando parte do lixo','O esgoto ainda chega ao rio']},
 health_02:{solved:['Apagando as queimadas','Instalando o filtro de ar','Plantando árvores'],temporary:['Plantando árvores','Cuidando das mudas','A queima continua']},
 accessibility_02:{solved:['Liberando o caminho','Instalando o piso tátil','Caminho acessível até o hospital'],temporary:['Liberando parte do caminho','Instalando corrimãos','Ainda faltam trechos']},
 accessibility_01:{solved:['Removendo o degrau','Construindo a rampa','Entrada acessível'],temporary:['Preparando a entrada','Posicionando a rampa móvel','A rampa só aparece quando pedida']},
};
export const fallbackSteps:Steps=['Preparando a obra','Aplicando a solução','Cidade transformada'];
export function resolutionStep(value:number){
 let step=0;for(let i=0;i<resolutionStepStarts.length;i++)if(value>=resolutionStepStarts[i])step=i;return step;
}
