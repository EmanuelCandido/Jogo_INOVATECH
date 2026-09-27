import { useEffect, useRef, useState } from 'react';
import { Coin } from './Coin';

export function Balance({ coins, className='', income=0 }: { coins: number; className?: string; income?: number }) {
  const previous=useRef(coins);
  const [change,setChange]=useState<{amount:number;sequence:number}|null>(null);
  useEffect(()=>{
    const amount=coins-previous.current;
    previous.current=coins;
    if(!amount)return;
    setChange(value=>({amount,sequence:(value?.sequence??0)+1}));
  },[coins]);
  useEffect(()=>{
    if(!change)return;
    const timer=window.setTimeout(()=>setChange(null),1400);
    return ()=>window.clearTimeout(timer);
  },[change]);
  return <div className={`balance ${className}`} role="status" aria-label={`${coins.toLocaleString('pt-BR')} Moedas da Cidade${income?`, rendendo ${income} por minuto`:''}`}>
    <Coin/>
    <b key={coins} className="balance-value" aria-hidden="true">{coins.toLocaleString('pt-BR')}</b>
    {income>0&&<span className="balance-income" title="Renda dos problemas resolvidos" aria-hidden="true">+{income}/min</span>}
    {change&&<span key={change.sequence} className={`balance-change${change.amount<0?' is-spending':''}`} aria-hidden="true">{change.amount>0?'+':''}{change.amount.toLocaleString('pt-BR')}</span>}
  </div>;
}
