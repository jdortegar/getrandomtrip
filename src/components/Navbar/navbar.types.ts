export type NavbarVariant = 'auto' | 'solid';

export interface User {
  name?: string;
  avatar?: string;
  role?: string;
}

export interface NavbarProps {
  variant?: NavbarVariant;
}
