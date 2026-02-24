import { redirect } from 'next/navigation';

export default function PackagesRoot() {
  // Hub por defecto
  redirect('/packages/by-type/group'); // tu hub general de tipos
}