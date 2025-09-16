'use client';
import { useEffect, useState } from 'react';
export default function VariantSwitch(){
  const [v,setV] = useState<'A'|'B'>('A');
  useEffect(()=>{
    setV((localStorage.getItem('rt-var-global') as any) || 'A');
  },[]);
  const toggle=()=>{
    const nv = v==='A'?'B':'A';
    setV(nv);
    localStorage.setItem('rt-var-global', nv);
    const u=new URL(window.location.href);
    u.searchParams.set('var', nv);
    window.location.href=u.toString();
  };
  return <button onClick={toggle} className="fixed bottom-4 right-4 px-3 py-2 rounded-xl bg-black/70 text-white text-sm">Var {v}</button>;
}
