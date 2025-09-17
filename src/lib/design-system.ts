/**
 * Design System Index
 * Central export point for all design system components and utilities
 */

// ============================================================================
// DESIGN TOKENS
// ============================================================================
export * from './design-tokens';

// ============================================================================
// UTILITIES
// ============================================================================
export { cn } from './utils';

// ============================================================================
// THEME SYSTEM
// ============================================================================
export { ThemeProvider, useTheme, ThemeToggle } from './theme/ThemeProvider';
export type {
  ColorScheme,
  ThemeConfig,
  ThemeContextValue,
} from './theme/ThemeProvider';

// ============================================================================
// HOOKS
// ============================================================================
export {
  useBreakpoint,
  useBreakpointAbove,
  useBreakpointBelow,
  useBreakpointBetween,
  useResponsiveValue,
  useWindowSize,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from '../hooks/useBreakpoint';
export type { Breakpoint } from '../hooks/useBreakpoint';

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================
export {
  Container,
  Grid,
  GridItem,
  Stack,
  Divider,
  Section,
} from '../components/layout/DesignSystemLayout';

// ============================================================================
// UI COMPONENTS
// ============================================================================
export { Button, ButtonGroup, buttonVariants } from '../components/ui/Button';

export { Input, Textarea, Select, inputVariants } from '../components/ui/Input';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
} from '../components/ui/Card';

// ============================================================================
// TYPES
// ============================================================================
export type { VariantProps } from 'class-variance-authority';
export * from './design-system/types';
