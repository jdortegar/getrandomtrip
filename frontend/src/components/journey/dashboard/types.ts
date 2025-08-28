'use client'

export type TripStatus = 'upcoming' | 'past' | 'canceled'

export interface Trip {
  id: string
  title: string
  subtitle?: string
  startISO: string
  endISO: string
  city?: string
  country?: string
  status: TripStatus
  coverUrl?: string
}

export interface PaymentItem {
  id: string
  dateISO: string
  description: string
  amountUsd: number
  status: 'Completed' | 'Pending' | 'Failed'
}
