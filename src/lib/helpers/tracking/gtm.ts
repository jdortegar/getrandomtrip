'use client';

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type GTMEvents =
  | { event: 'page_view'; page_path: string }
  | {
      event: 'purchase';
      transaction_id: string;
      value: number;
      currency?: string;
      items?: PurchaseItem[];
    }
  | { event: 'sign_up'; method: string }
  | { event: 'click_button'; label: string }
  | { event: 'set_user'; user_id: string }
  | { event: 'set_user_properties'; user_type: string };

declare global {
  interface Window {
    dataLayer?: GTMEvents[];
  }
}

const pushToDataLayer = <T extends GTMEvents>(data: T): void => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};

export function trackPageview(page_path: string): void {
  pushToDataLayer({ event: 'page_view', page_path });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  currency?: string;
  items?: PurchaseItem[];
}): void {
  pushToDataLayer({ event: 'purchase', ...params });
}

export function trackSignUp(method: string): void {
  pushToDataLayer({ event: 'sign_up', method });
}

export function trackButtonClick(label: string): void {
  pushToDataLayer({ event: 'click_button', label });
}

export function setUser(user_id: string): void {
  pushToDataLayer({ event: 'set_user', user_id });
}

export function setUserProperties(user_type: string): void {
  pushToDataLayer({ event: 'set_user_properties', user_type });
}

export function trackCustomEvent<T extends GTMEvents>(data: T): void {
  pushToDataLayer(data);
}
