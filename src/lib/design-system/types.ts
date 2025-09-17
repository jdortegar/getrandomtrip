/**
 * Design System Types
 * Comprehensive type definitions for the design system
 */

import { type VariantProps } from 'class-variance-authority';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ComponentRef<T = HTMLElement> {
  ref?: React.Ref<T>;
}

// ============================================================================
// THEME TYPES
// ============================================================================

export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  colorScheme: ColorScheme;
  accentColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'mono';
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  toggleColorScheme: () => void;
}

// ============================================================================
// RESPONSIVE TYPES
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface MediaQuery {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// ============================================================================
// BUTTON TYPES
// ============================================================================

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingSpinner?: React.ReactNode;
}

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export type InputVariant = 'default' | 'error' | 'success' | 'warning';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  options: SelectOption[];
  placeholder?: string;
}

// ============================================================================
// CARD TYPES
// ============================================================================

export type CardVariant =
  | 'default'
  | 'elevated'
  | 'outlined'
  | 'filled'
  | 'ghost';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  asChild?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
}

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  centered?: boolean;
  padding?: boolean;
}

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export type GridGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  gap?: GridGap;
  responsive?: {
    sm?: GridCols;
    md?: GridCols;
    lg?: GridCols;
    xl?: GridCols;
  };
}

export type GridItemSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: GridItemSpan;
  start?: GridItemSpan;
  end?: GridItemSpan;
  responsive?: {
    sm?: { span?: number; start?: number; end?: number };
    md?: { span?: number; start?: number; end?: number };
    lg?: { span?: number; start?: number; end?: number };
    xl?: { span?: number; start?: number; end?: number };
  };
}

export type StackDirection =
  | 'row'
  | 'column'
  | 'row-reverse'
  | 'column-reverse';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export type StackJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'between'
  | 'around'
  | 'evenly';

export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  gap?: StackGap;
  wrap?: boolean;
}

export type DividerOrientation = 'horizontal' | 'vertical';

export type DividerVariant = 'solid' | 'dashed' | 'dotted';

export type DividerThickness = 'thin' | 'medium' | 'thick';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  thickness?: DividerThickness;
}

export type SectionSize = 'sm' | 'md' | 'lg' | 'xl';

export type SectionBackground = 'default' | 'muted' | 'accent' | 'transparent';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: SectionSize;
  background?: SectionBackground;
  fullWidth?: boolean;
}

// ============================================================================
// THEME TOGGLE TYPES
// ============================================================================

export type ThemeToggleSize = 'sm' | 'md' | 'lg';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: ThemeToggleSize;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

export type VariantConfig<T extends Record<string, Record<string, string>>> = T;

export interface ResponsiveConfig {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export type StateConfig<T extends Record<string, boolean>> = {
  [K in keyof T]?: string;
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type { VariantProps } from 'class-variance-authority';
