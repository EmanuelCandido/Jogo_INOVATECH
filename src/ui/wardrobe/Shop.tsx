import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {accessories, accessoryById, accessoryCategories, accessoryCollections, collectionForOutfit, defaultOutfit, quoteOutfit, sameOutfit, type AccessorySlot, type Outfit, type AccessoryCollection} from '../../game/wardrobe';
import {useGame} from '../../stores/gameStore';
import {Coin} from '../hud/Coin';
import {Balance} from '../hud/Balance';
import {HudControl, HudIcon} from '../hud/HudControl';
import {useDialog} from '../menus/useDialog';
import {CharacterAvatar} from './CharacterAvatar';
import {WearablePreview} from './WearableLayers';

const views=[{id:'collections',label:'Coleções'},{id:'pieces',label:'Peças'},{id:'owned',label:'Meu armário'}] as const;
type View=typeof views[number]['id'];
const emptyLabels:Record<AccessorySlot,string>={cape:'Capa original',jacket:'Sem traje',hat:'Sem acessório'};
const collectionStyle=(collection?:AccessoryCollection):CSSProperties=>({'--collection-accent':collection?.accent??'#7024c5','--collection-surface':collection?.surface??'#eee1ff'} as CSSProperties);

export function Shop(){
  const {progress,openOverlay,purchaseLook}=useGame();
  const [draft,setDraft]=useState<Outfit>(()=>({...progress.wardrobe.equipped}));
  const [view,setView]=useState<View>('collections');
  const [category,setCategory]=useState<AccessorySlot>('cape');
  const [message,setMessage]=useState('');
  const [confirmExit,setConfirmExit]=useState(false);
  const [compare,setCompare]=useState(false);
  const [celebrating,setCelebrating]=useState(false);
  const backButton=useRef<HTMLButtonElement>(null),scroll=useRef<HTMLDivElement>(null);
  const wasConfirming=useRef(false);
  const dirty=!sameOutfit(draft,progress.wardrobe.equipped);
  const collection=collectionForOutfit(draft);
  const accentCollection=collection??accessoryCollections.find(c=>c.id===accessoryById[draft.jacket??draft.cape]?.collection);
  const quote=quoteOutfit(progress.wardrobe,draft);
  const shortfall=Math.max(0,quote.total-progress.coins);
  const close=()=>{if(confirmExit)setConfirmExit(false);else if(dirty)setConfirmExit(true);else openOverlay(null);};
  const panel=useDialog(close);
  const selected=draft[category]?accessoryById[draft[category]!]:null;
  const items=accessories.filter(item=>item.slot===category&&(view==='owned'?progress.wardrobe.owned.includes(item.id):Boolean(item.collection)));
  useEffect(()=>{
    if(wasConfirming.current&&!confirmExit)backButton.current?.focus({preventScroll:true});
    wasConfirming.current=confirmExit;
  },[confirmExit]);
  useEffect(()=>{
    if(!celebrating)return;
    const timer=window.setTimeout(()=>setCelebrating(false),900);
    return()=>window.clearTimeout(timer);
  },[celebrating]);
  function switchView(next:View){setView(next);setCompare(false);scroll.current?.scrollTo({top:0});}
  function tryOutfit(next:Outfit){setDraft({...next});setCompare(false);setMessage('');}
  function tryItem(slot:AccessorySlot,id:string|null){tryOutfit({...draft,[slot]:id});}
  function useLook(){
    const wasPurchase=quote.items.length>0;
    if(purchaseLook(draft)){setMessage(wasPurchase?'Tudo seu! Visual equipado na cidade.':'Visual equipado na cidade.');setCelebrating(true);setCompare(false);}
  }
  const previewTitle=compare?'Seu visual atual':collection?.name??(sameOutfit(draft,defaultOutfit())?'Do seu jeito':'Sua combinação');
  return <section ref={panel} className="shop-screen atelier-shop" role="dialog" aria-modal="true" aria-labelledby="shop-heading" tabIndex={-1} style={collectionStyle(accentCollection)}>
    <div className="shop-layout" inert={confirmExit}>
      <header className="shop-topbar">
        <div className="shop-navigation"><HudControl ref={backButton} icon="back" className="shop-back" onClick={close} label="Voltar ao mapa"/><div><span className="panel-eyebrow">CRIE SEU IMPACTUS</span><h2 id="shop-heading">Loja do Impactus</h2></div></div>
        <Balance coins={progress.coins} className="shop-balance"/>
      </header>
      <div className="shop-showcase" data-celebrating={celebrating}>
        <div className="showcase-heading"><span>{compare?'EQUIPADO':collection?.theme??'ESTILO QUE TRANSFORMA'}</span><h3>{previewTitle}</h3><p>{collection&&!compare?collection.description:'Novas ideias. Novas peças. A mesma vontade de cuidar.'}</p></div>
        <div className="showcase-stage">
          <div className="avatar-glow"/><div className="showcase-orbit"/><div className="avatar-shadow"/>
          <div className="shop-avatar"><CharacterAvatar outfit={compare?progress.wardrobe.equipped:draft} label="Prévia do visual do Impactus"/></div>
          <span className="showcase-spark spark-one" aria-hidden="true">✦</span><span className="showcase-spark spark-two" aria-hidden="true">✦</span>
        </div>
        <div className="fitting-controls"><span className="fitting-state"><i/>{compare?'Visual atual':dirty?'Experimentando':'Seu Impactus'}</span><button className="compare-outfit" aria-pressed={compare} disabled={!dirty} onClick={()=>setCompare(!compare)}><HudIcon name="sparkles"/>{compare?'Voltar à prévia':'Comparar'}</button></div>
        <div className="outfit-slots" aria-label="Peças na prévia">{accessoryCategories.map(({id,label})=>{
          const item=draft[id]?accessoryById[draft[id]!]:null;
          return <button key={id} className={category===id&&view!=='collections'?'active':''} onClick={()=>{setCategory(id);switchView('pieces');}} aria-label={label+': '+(item?.name??emptyLabels[id])}>
            <span>{item?<WearablePreview item={item}/>:<HudIcon name="sparkles"/>}</span><span><small>{label}</small><b>{item?.name??emptyLabels[id]}</b></span>
          </button>;
        })}</div>
      </div>
      <div className="shop-catalogue">
        <div className="shop-catalogue-header">
          <div className="shop-view-tabs" role="tablist" aria-label="Explorar a loja" onKeyDown={event=>{
            const i=views.findIndex(v=>v.id===view),next=event.key==='ArrowRight'?(i+1)%3:event.key==='ArrowLeft'?(i+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;
            if(next<0)return;event.preventDefault();switchView(views[next].id);event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
          }}>{views.map(v=><button key={v.id} id={'shop-view-'+v.id} role="tab" aria-selected={view===v.id} aria-controls="shop-products" tabIndex={view===v.id?0:-1} onClick={()=>switchView(v.id)}>{v.label}{v.id==='owned'&&<span>{progress.wardrobe.owned.length}</span>}</button>)}</div>
          {view!=='collections'&&<div className="piece-filters" role="group" aria-label="Tipo de acessório">{accessoryCategories.map(c=><button key={c.id} aria-pressed={category===c.id} onClick={()=>{setCategory(c.id);setCompare(false);scroll.current?.scrollTo({top:0});}}>{c.label}</button>)}</div>}
        </div>
        <div ref={scroll} className="shop-catalogue-scroll" id="shop-products" role="tabpanel" aria-labelledby={'shop-view-'+view} tabIndex={0}>
          {view==='collections'?<>
            <div className="catalogue-kicker"><b>Feitas para esta cidade</b><span>3 coleções · 9 peças</span></div>
            <div className="collection-list">{accessoryCollections.map(c=>{
              const q=quoteOutfit(progress.wardrobe,c.outfit),active=sameOutfit(draft,c.outfit);
              return <button type="button" key={c.id} className={'collection-card'+(active?' selected':'')} data-collection={c.id} aria-pressed={active} aria-label={'Experimentar '+c.name} style={collectionStyle(c)} onClick={()=>tryOutfit(c.outfit)}>
                <div className="collection-card-copy"><small>{c.theme}</small><h3>{c.name}</h3><p>{c.description}</p><span className="collection-price">{q.items.length?<><Coin/>{q.total}<em>{q.items.length<3?'para completar':'pelas 3 peças'}</em></>:<><HudIcon name="check"/>Coleção no armário</>}</span><span className="try-collection">{active?'Na prévia':'Experimentar'}<HudIcon name={active?'check':'forward'}/></span></div>
                <div className="collection-avatar" aria-hidden="true"><CharacterAvatar outfit={c.outfit} label=""/></div>
              </button>;
            })}</div>
            <p className="catalogue-tip"><HudIcon name="sparkles"/>Gostou de partes de cada coleção? Misture em <button onClick={()=>switchView('pieces')}>Peças</button>.</p>
          </>:<>
            <div className="catalogue-kicker"><b>{view==='owned'?'Seu armário':'Escolha sua próxima peça'}</b><span>{items.length} {items.length===1?'peça':'peças'}</span></div>
            <div className="accessory-grid urban-grid">{items.map(item=>{
              const owned=progress.wardrobe.owned.includes(item.id),active=draft[category]===item.id;
              return <button className={'accessory-card'+(active?' selected':'')} key={item.id} data-accessory={item.id} aria-pressed={active} aria-label={item.name+', '+(owned?'já adquirido':item.price+' moedas')} onClick={()=>tryItem(category,item.id)}>
                <span className="accessory-preview"><WearablePreview item={item}/>{active&&<span className="accessory-selected"><HudIcon name="check"/></span>}</span>
                <small className="piece-collection">{accessoryCollections.find(c=>c.id===item.collection)?.name??'Clássico do Impactus'}</small><strong>{item.name}</strong><span className="accessory-price">{owned?<><HudIcon name="check"/>Seu acessório</>:<><Coin/>{item.price} moedas</>}</span>
              </button>;
            })}</div>
            {!items.length&&<div className="empty-wardrobe"><HudIcon name="sparkles"/><h3>Seu próximo favorito mora aqui.</h3><p>As peças compradas aparecem no seu armário, prontas para combinar.</p><button onClick={()=>switchView('pieces')}>Explorar as peças</button></div>}
            {selected&&<div className="piece-story"><strong>{selected.name}</strong>{selected.feature&&<span>{selected.feature}</span>}<p>{selected.description}</p></div>}
            <div className="outfit-tools">{category!=='cape'&&<button aria-pressed={!selected} onClick={()=>tryItem(category,null)}>{category==='jacket'?'Retirar traje':'Retirar da cabeça'}</button>}<button onClick={()=>tryItem('cape','cape-star')}>Usar capa original</button></div>
          </>}
          <div className="shop-bottom-note"><button onClick={()=>tryOutfit(defaultOutfit())}>Restaurar visual original</button><p>Acessórios visuais, comprados com moedas do jogo.</p></div>
        </div>
        <footer className="shop-save atelier-checkout">
          <div className="checkout-summary"><div><strong>{quote.items.length?quote.items.length+' '+(quote.items.length===1?'peça nova':'peças novas'):dirty?'Pronto para usar':'Visual equipado'}</strong><span>{quote.items.length?'Só as peças que você ainda não tem.':dirty?'As peças da prévia já são suas.':'Explore e encontre sua próxima combinação.'}</span></div>{quote.total>0&&<b><Coin/>{quote.total}</b>}</div>
          <div className="shop-message" role="status">{message|| (shortfall?'Faltam '+shortfall+' moedas para este visual.':'')}</div>
          <button className="save-outfit" disabled={shortfall>0||(!dirty&&!quote.items.length)} onClick={useLook}><HudIcon name={celebrating?'check':quote.items.length?'sparkles':'check'}/>{shortfall?'Moedas insuficientes':quote.items.length?'Comprar e usar':dirty?'Usar visual':'Visual equipado'}</button>
        </footer>
      </div>
    </div>
    {confirmExit&&<div className="shop-exit-scrim"><div className="shop-exit" role="alertdialog" aria-labelledby="exit-title"><h3 id="exit-title">Sair da prévia?</h3><p>Você está experimentando outro visual. Seu visual equipado continua salvo.</p><button className="save-outfit" autoFocus onClick={()=>setConfirmExit(false)}>Continuar experimentando</button><button className="discard-outfit" onClick={()=>openOverlay(null)}>Sair sem salvar</button></div></div>}
  </section>;
}
