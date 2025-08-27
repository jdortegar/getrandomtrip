'use client';
import { useEffect } from 'react';
import { useJourneyStore } from '@/store/journeyStore';
import { parseBasePrice } from '@/lib/levels';

export default function InitClient({ searchParams, displayPrice }:{ searchParams:Record<string,string>, displayPrice:string }) {
  const setPartial = useJourneyStore(s=>s.setPartial);
  useEffect(()=>{
    const from  = (searchParams.from  || '') as 'tripper'|'';
    const type  = (searchParams.type  || 'couple') as any;
    const level = (searchParams.level || 'modo-explora') as any;
    setPartial({ from, type, level, displayPrice, basePriceUsd: parseBasePrice(displayPrice) });
  }, [searchParams, displayPrice, setPartial]);
  return null;
}