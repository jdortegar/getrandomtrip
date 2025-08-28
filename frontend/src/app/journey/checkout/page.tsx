'use client'
import TopNav from '@/components/chrome/TopNav'
import ChatFab from '@/components/chrome/ChatFab'
import BgCarousel from '@/components/ui/BgCarousel'
import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, Wallet, Apple } from 'lucide-react'

type Method = 'mercadopago'|'paypal'|'applepay'|'stripe'

export default function CheckoutGateway() {
  const [method, setMethod] = useState<Method>('mercadopago')

  return (
    <>
      <BgCarousel />
      <TopNav />
      <ChatFab />
      <div className="container mx-auto px-4 pb-16 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <h1 className="text-xl font-semibold">Elegí tu método de pago</h1>

            <div className="grid sm:grid-cols-2 gap-4">
              {[{
                id:'mercadopago', label:'Mercado Pago', icon:<Wallet size={18}/> },
                { id:'paypal',      label:'PayPal',       icon:<img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="" className="h-4" /> },
                { id:'applepay',    label:'Apple Pay',    icon:<Apple size={18}/> },
                { id:'stripe',      label:'Tarjeta (Stripe)', icon:<CreditCard size={18}/> },
              ].map(({id,label,icon})=>(<button
                  key={id}
                  onClick={()=>setMethod(id as Method)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left shadow-sm backdrop-blur ring-1 ${
                    method===id ? 'bg-white ring-violet-400' : 'bg-white/85 ring-neutral-200 hover:bg-white'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  {icon}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-white/90 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h3 className="text-base font-semibold mb-2">Formulario (dummy)</h3>
              <p className="text-sm text-neutral-600">
                Aquí irá el formulario real del proveedor seleccionado. Por ahora es un bosquejo sin conexión.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Nombre del titular" />
                <input className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Email de contacto" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Nº tarjeta / ID cuenta" />
                <input className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Vencimiento" />
                <input className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="CVV" />
              </div>
              <div className="mt-5 flex gap-2">
                <Link href="/journey/summary" className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm hover:bg-neutral-50">← Volver</Link>
                <Link href="/journey/confirmation" className="rounded-xl bg-violet-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-violet-500">Pagar ahora (dummy)</Link>
              </div>
              <p className="mt-2 text-xs text-neutral-500">* Apple Pay sólo disponible en navegadores compatibles.</p>
            </div>
          </div>

          <aside className="xl:sticky xl:top-28 h-max">
            <div className="rounded-2xl bg-white/95 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h3 className="text-base font-semibold mb-3">Detalle del pago</h3>
              <p className="text-sm text-neutral-600">Resumen y total del pedido se muestran aquí (reusar tu SummaryCard si preferís).</p>
            </div>
          </aside>
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/&gt;
  )
}
