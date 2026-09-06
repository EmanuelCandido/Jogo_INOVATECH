import {readFile,writeFile} from 'node:fs/promises';
// One-time editorial importer. Normal content edits belong in situations.ts.
// Explicit arguments avoid accidentally replacing subsequent editorial changes.
if(process.argv[2]!=='--replace-content'||!process.argv[3]){
 console.log('Usage: node scripts/prepare-narrative.mjs --replace-content <prompt.txt>');
 process.exit(0);
}
const prompt=await readFile(process.argv[3],'utf8');
const configs=[
 ['pollution_01','POLLUTION','Lixo nas ruas','Jardim do Rio',[17.5,0,6.5],'♻','Os resíduos chegaram perto dos animais. Vamos observar de onde vem esse acúmulo.','character_thinking',0,'waste',['collection','cleanup','banner']],
 ['pollution_02','POLLUTION','Carros poluentes','Avenida Central',[10,0,-11],'🚍','Há muitos carros nesta avenida e pouca opção para quem precisa de ônibus.','character_thinking',2,'transport',['public_transport','fares','lectures']],
 ['security_01','SECURITY','Animais na estrada','Estrada da Mata',[-30,0,-28],'⚠','Há animais perto da pista. Eles e as pessoas que passam por aqui correm risco.','character_alert',2,'road_animals',['rescue','food','ignore']],
 ['security_02','SECURITY','Segurança nas ruas','Rua do Comércio',[35,0,12.6],'🛡','Neste trecho, pedir ajuda rapidamente parece difícil. Que estrutura está faltando?','character_alert',4,'street_safety',['emergency','cameras','signs']],
 ['nature_01','NATURE','Espécies ameaçadas','Borda da Mata',[-24,0,-36],'🦋','Este habitat está ficando menor. Trazer animais de volta basta se eles não tiverem onde viver?','character_thinking',4,'habitat',['restore','reintroduce','observe']],
 ['nature_02','NATURE','Mudanças climáticas','Quarteirão Central',[26,0,-25],'🌳','Quase não há sombra neste quarteirão. Os aparelhos ligados também consomem energia.','character_thinking',6,'climate',['green_energy','reduce_hours','more_ac']],
 ['health_01','HEALTH','Rio poluído','Rio das Flores',[-15,0,-45.6],'💧','A água está recebendo resíduos todos os dias. Limpar uma vez resolve a origem?','character_alert',6,'river',['sanitation','cleanups','warnings']],
 ['health_02','HEALTH','Fumaça e qualidade do ar','Distrito Industrial',[4,0,-48],'☁','A fumaça desta área chega à vegetação e aos prédios vizinhos. Vamos entender a fonte.','character_alert',8,'air',['prevent_burning','trees','talks']],
 ['accessibility_02','ACCESSIBILITY','Caminho até o hospital','Hospital Municipal',[-15,0,13.1],'◉','Como encontrar a entrada com autonomia quando faltam referências táteis no caminho?','character_thinking',8,'hospital_path',['tactile','handrails','hospital_sign']],
 ['accessibility_01','ACCESSIBILITY','Acesso ao prédio','Prefeitura',[-6.8,0,-1.8],'♿','Esta escada é uma barreira para quem usa cadeira de rodas. Vamos observar a entrada.','character_thinking',0,'plaza_access',['ramp','support','campaign']],
];
const feedback=[
 ['Boa escolha! Além de orientar a população, agora existem locais adequados para descartar os resíduos.','As multas podem diminuir o problema, mas ainda faltam locais adequados para o descarte.','Os cartazes alertam as pessoas, mas o lixo continua sem ter um destino adequado.'],
 ['Um transporte público suficiente e confiável oferece uma alternativa real ao carro particular. A avenida ganhou mais ônibus e menos carros.','A tarifa menor facilita o uso, mas a quantidade de ônibus continua insuficiente.','Informar ajuda a compreender o problema, mas sem uma alternativa de transporte os carros continuam circulando.'],
 ['Uma equipe capacitada encaminhou os animais para um local adequado. A pista ficou mais segura, e a proteção do habitat continua necessária.','A comida mantém os animais perto dos veículos. Eles continuam expostos ao risco de atropelamento.','Sem uma ação de proteção, os animais permanecem na estrada e o risco de acidente continua.'],
 ['Os pontos de emergência e as equipes presentes permitem pedir e receber ajuda mais rapidamente.','As câmeras ajudam a acompanhar a região, mas ainda falta uma resposta rápida no local.','As placas chamam a atenção, mas não oferecem uma forma de pedir ajuda nem ampliam a presença das equipes.'],
 ['A recuperação e a proteção do habitat devolvem alimento, abrigo e espaço para as espécies.','Reintroduzir animais pode ajudar, mas o habitat continua reduzido e sem proteção suficiente.','Acompanhar as espécies fornece informação, mas não impede a perda de habitat ou a caça ilegal.'],
 ['Mais áreas verdes e uso sustentável de energia atuam juntos sobre o calor e os impactos ambientais da cidade.','Economizar em alguns horários ajuda, mas o quarteirão continua com pouca vegetação e consumo elevado.','Usar cada vez mais aparelhos aumenta a demanda de energia e mantém as causas do problema.'],
 ['O saneamento reduz a chegada de contaminantes e a recuperação melhora o rio. A água ficou visualmente mais limpa.','O mutirão remove parte dos resíduos, mas a água contaminada continua chegando ao rio.','Os avisos alertam sobre o risco, mas não interrompem o descarte nem recuperam a água.'],
 ['A fiscalização e a prevenção atuam na fonte das emissões. O local ganhou controle e menos fumaça.','As árvores ajudam o ambiente, mas as queimas e as demais fontes de fumaça continuam ativas.','As palestras informam, mas sem medidas sobre a fonte da fumaça a qualidade do ar não melhora.'],
 ['O piso tátil oferece uma referência contínua até a entrada, favorecendo a orientação e o deslocamento com autonomia.','Os corrimãos ajudam em alguns trechos, mas não formam uma referência contínua até o hospital.','A placa pode orientar parte das pessoas, mas não substitui uma rota com referências táteis.'],
 ['A rampa integrada à entrada oferece passagem contínua e permite entrar com mais autonomia.','A rampa móvel ajuda quando está disponível, mas o acesso ainda depende de solicitar a estrutura.','A placa expressa uma intenção, mas a escada continua impedindo a passagem de cadeiras de rodas.']
];
const outcomes=['COMPLETE','TEMPORARY','NONE'];
const situations=configs.map((c,i)=>{
 const start=prompt.indexOf(`SITUAÇÃO ${String(i+1).padStart(2,'0')} —`),end=i<9?prompt.indexOf(`SITUAÇÃO ${String(i+2).padStart(2,'0')} —`,start+10):prompt.indexOf('CONSEQUÊNCIAS VISUAIS',start);
 const section=prompt.slice(start,end),quote=label=>{const m=section.match(new RegExp(`${label}:\\s*"([\\s\\S]*?)"`));if(!m)throw Error(label+i);return m[1];};
 return {id:c[0],category:c[1],title:c[2],regionName:c[3],worldPosition:c[4],markerIcon:c[5],comment:c[6],characterPose:c[7],unlockAfter:c[8],questionId:c[9],description:quote('CONTEXTO'),question:quote('PERGUNTA'),costBand:i%2?'standard':'community',answers:outcomes.map((outcome,j)=>({id:c[10][j],text:quote(outcome),effectiveness:outcome,explanation:feedback[i][j],consequence:j===0?'Uma melhoria completa neste lugar.':j===1?'A situação melhorou parcialmente.':'A causa do problema continua.'}))};
});
await writeFile('src/content/situations.ts',`import type {Category,CharacterPose,Effectiveness,Vec3} from '../game/types';\nexport interface SituationContent {id:string;category:Category;title:string;regionName:string;worldPosition:Vec3;markerIcon:string;comment:string;characterPose:CharacterPose;unlockAfter:number;questionId:string;description:string;question:string;costBand:'standard'|'community';answers:{id:string;text:string;effectiveness:Effectiveness;explanation:string;consequence:string}[]}\n// Editorial content is independent of rendering and question order.\nexport const situations:SituationContent[]=${JSON.stringify(situations,null,2)};\n`);
console.log('10 situations extracted verbatim. Character assets are managed separately.');
