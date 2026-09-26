import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { accessories, accessoryById, accessoryCategories, defaultOutfit, type AccessorySlot, type Outfit } from '../../game/wardrobe';
import { useGame } from '../../stores/gameStore';
import { Coin } from '../hud/Coin';
import { Balance } from '../hud/Balance';
import { HudControl, HudIcon } from '../hud/HudControl';
import { useDialog } from '../menus/useDialog';
import { CharacterAvatar } from './CharacterAvatar';
import { WearablePreview } from './WearableLayers';

export function Shop() {
  const { progress, openOverlay, buy, equip }=useGame();
  const [draft,setDraft]=useState<Outfit>(()=>({...progress.wardrobe.equipped}));
  const [category,setCategory]=useState<AccessorySlot>('cape');
  const [message,setMessage]=useState('');
  const [confirmExit,setConfirmExit]=useState(false);
  const backButton=useRef<HTMLButtonElement>(null);
  const wasConfirming=useRef(false);
  useEffect(()=>{
    if(wasConfirming.current&&!confirmExit)backButton.current?.focus({preventScroll:true});
    wasConfirming.current=confirmExit;
  },[confirmExit]);
  const dirty=accessoryCategories.some(({id})=>draft[id]!==progress.wardrobe.equipped[id]);
  const close=()=>{if(confirmExit)setConfirmExit(false);else if(dirty)setConfirmExit(true);else openOverlay(null);};
  const panel=useDialog(close);
  const selectedId=draft[category];
  const selected=selectedId?accessoryById[selectedId]:null;
  const owned=!selected||progress.wardrobe.owned.includes(selected.id);
  const unowned=accessoryCategories.map(({id})=>draft[id]).filter((id):id is string=>!!id&&!progress.wardrobe.owned.includes(id));
  const items=accessories.filter(item=>item.slot===category);
  const categoryName=accessoryCategories.find(item=>item.id===category)!.label;
  const purchaseAction=!owned&&selected&&<button className="buy-accessory" disabled={progress.coins<selected.price} onClick={()=>{if(buy(selected.id))setMessage(`${selected.name} agora é seu! Salve para usar na cidade.`);}}>{progress.coins<selected.price?`Faltam ${selected.price-progress.coins} moedas`:<><Coin/> Comprar por {selected.price}</>}</button>;
  function changeCategory(next:AccessorySlot){setCategory(next);setMessage('');}
  return <section ref={panel} className="shop-screen" role="dialog" aria-modal="true" aria-labelledby="shop-heading" tabIndex={-1}>
    <div className="shop-layout" inert={confirmExit}>
      <header className="shop-topbar"><div className="shop-navigation"><HudControl ref={backButton} icon="back" className="shop-back" onClick={close} label="Voltar ao mapa"/><div><span className="panel-eyebrow">SEU ESTILO</span><h2 id="shop-heading">Loja do Impactus</h2></div></div><Balance coins={progress.coins} className="shop-balance"/></header>
      <div className="shop-showcase"><div className="avatar-glow"/><div className="avatar-shadow"/><div className="shop-avatar"><CharacterAvatar outfit={draft} label="Prévia do visual do Impactus"/></div><span className="avatar-name"><i/>Impactus</span>{dirty&&<span className="preview-tag">Experimentando</span>}</div>
      <div className="shop-catalogue"><div className="shop-catalogue-header">
        <header className="shop-introduction"><h3>{categoryName}</h3><p>Escolha um acessório para o Impactus</p></header>
        <div className="accessory-tabs" role="tablist" aria-label="Categorias de acessórios" style={{'--tab-index':accessoryCategories.findIndex(item=>item.id===category)} as CSSProperties} onKeyDown={event=>{
          const index=accessoryCategories.findIndex(item=>item.id===category);
          const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;
          if(next<0)return;event.preventDefault();changeCategory(accessoryCategories[next].id);event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
        }}>{accessoryCategories.map(item=><button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={category===item.id} aria-controls="accessory-collection" tabIndex={category===item.id?0:-1} onClick={()=>changeCategory(item.id)}>{item.label}</button>)}</div>
        </div><div className="shop-catalogue-scroll">
        <div id="accessory-collection" role="tabpanel" aria-labelledby={`tab-${category}`}>
          <div className="collection-heading"><b>{selected?.name??(category==='jacket'?'Sem jaqueta':'Sem chapéu')}</b><span>{items.length} opções</span></div>
          <div className="accessory-grid">{items.map(item=>{
            const isOwned=progress.wardrobe.owned.includes(item.id);
            return <button className={`accessory-card${draft[category]===item.id?' selected':''}`} key={item.id} aria-pressed={draft[category]===item.id} aria-label={`${item.name}, ${isOwned?'já adquirido':`${item.price} moedas`}`} data-accessory={item.id} onClick={()=>{setDraft({...draft,[category]:item.id});setMessage('');}}>
              <span className="accessory-preview"><WearablePreview item={item}/>{!isOwned&&<span className="accessory-lock"><HudIcon name="lock"/></span>}{draft[category]===item.id&&<span className="accessory-selected"><HudIcon name="check"/></span>}</span><strong>{item.name}</strong><span className="accessory-price">{isOwned?<><HudIcon name="check"/> Seu acessório</>:<><Coin/>{item.price} moedas</>}</span>
            </button>;
          })}</div>
          <div className="outfit-tools">{category!=='cape'&&<button aria-pressed={!selected} onClick={()=>{setDraft({...draft,[category]:null});setMessage('');}}>{category==='jacket'?'Retirar jaqueta':'Retirar chapéu'}</button>}<button onClick={()=>{setDraft(defaultOutfit());setMessage('Visual original na prévia. Salve para confirmar.');}}>Visual original</button></div>
        </div>
        <div className="accessory-detail"><p>{selected?.description??'A armadura original também faz parte do seu estilo.'}</p></div>
        <p className="shop-note">Combine uma capa, uma jaqueta e um chapéu. As compras usam as moedas da cidade.</p>
      </div><footer className={`shop-save${purchaseAction?' has-purchase':''}`}><div className="shop-message" role="status">{message|| (unowned.length?`Compre ${unowned.length===1?'o acessório selecionado':'os acessórios selecionados'} para salvar.`:'')}</div>{purchaseAction}<button className="save-outfit" disabled={unowned.length>0} onClick={()=>{if(equip(draft))setMessage('Visual salvo! O Impactus já pode usar essa combinação na cidade.');}}><HudIcon name={!dirty&&message.startsWith('Visual salvo')?'check':'sparkles'}/>{!dirty&&message.startsWith('Visual salvo')?'VISUAL SALVO':'SALVAR VISUAL'}</button></footer></div>
    </div>
    {confirmExit&&<div className="shop-exit-scrim"><div className="shop-exit" role="alertdialog" aria-labelledby="exit-title"><h3 id="exit-title">Sair da prévia?</h3><p>As compras continuam suas. O visual que você está experimentando ainda não foi salvo.</p><button className="save-outfit" autoFocus onClick={()=>setConfirmExit(false)}>Continuar experimentando</button><button className="discard-outfit" onClick={()=>openOverlay(null)}>Sair sem salvar</button></div></div>}
  </section>;
}
