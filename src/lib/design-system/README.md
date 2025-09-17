# GetRandomTrip Design System

A comprehensive design system built with Shadcn/UI, Tailwind CSS, and modern React patterns following DRY, SOLID principles and best practices.

## 🎯 Overview

This design system provides a consistent, accessible, and scalable foundation for building user interfaces. It includes:

- **Design Tokens** - Colors, typography, spacing, shadows, and animations
- **Component Library** - Reusable UI components with variants and states
- **Layout System** - Grid, container, and layout utilities
- **Theme System** - Light/dark mode support with system preference detection
- **Responsive Hooks** - Breakpoint detection and responsive utilities

## 📁 Structure

```
src/
├── lib/
│   ├── design-tokens.ts          # Design tokens and constants
│   ├── utils.ts                  # Utility functions (cn, conditional, etc.)
│   ├── design-system.ts          # Main exports
│   └── theme/
│       └── ThemeProvider.tsx     # Theme system
├── components/
│   ├── ui/                       # Core UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── layout/                   # Layout components
│       └── Layout.tsx
├── hooks/
│   └── useBreakpoint.ts         # Responsive utilities
└── styles/
    └── design-system.css        # CSS variables and styles
```

## 🚀 Quick Start

### Import Components

```typescript
// Import everything from the design system
import { Button, Card, Container, useTheme, cn } from '@/lib/design-system';

// Or import specific components
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Layout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
```

### Setup Theme Provider

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/lib/design-system';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="system" storageKey="getrandomtrip-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 🎨 Design Tokens

### Colors

The design system includes a comprehensive color palette with semantic naming:

```typescript
// Primary colors
primary - 50; // Lightest
primary - 500; // Default
primary - 900; // Darkest

// Semantic colors
success - 500; // Green for success states
warning - 500; // Orange for warnings
error - 500; // Red for errors
info - 500; // Blue for information
```

### Typography

```typescript
// Font families
font-sans    // Inter, system-ui, sans-serif
font-serif   // Georgia, serif
font-mono    // JetBrains Mono, monospace

// Font sizes
text-xs      // 12px
text-sm      // 14px
text-base    // 16px
text-lg      // 18px
text-xl      // 20px
text-2xl     // 24px
// ... up to text-9xl
```

### Spacing

```typescript
// Consistent spacing scale
space - 1; // 4px
space - 2; // 8px
space - 4; // 16px
space - 6; // 24px
space - 8; // 32px
// ... up to space-96
```

## 🧩 Components

### Button

```typescript
import { Button } from '@/components/ui/Button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary" size="lg">Primary Button</Button>
<Button variant="secondary" size="sm">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>

// With loading state
<Button loading>Loading...</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>
```

**Variants:**

- `primary` - Main brand color
- `secondary` - Secondary color
- `outline` - Outlined style
- `ghost` - Transparent background
- `destructive` - Error/danger actions
- `success` - Success actions
- `warning` - Warning actions
- `link` - Link style

**Sizes:**

- `sm` - Small (32px height)
- `md` - Medium (40px height)
- `lg` - Large (48px height)
- `xl` - Extra large (56px height)
- `icon` - Square icon button (40px)

### Input

```typescript
import { Input, Textarea, Select } from '@/components/ui/Input';

// Basic input
<Input label="Email" placeholder="Enter your email" />

// With validation states
<Input
  label="Password"
  type="password"
  error="Password is required"
  required
/>

// Textarea
<Textarea
  label="Message"
  placeholder="Enter your message"
  rows={4}
/>

// Select
<Select
  label="Country"
  placeholder="Select a country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>
```

### Card

```typescript
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Card Variants:**

- `default` - Standard card with border
- `elevated` - Card with shadow
- `outlined` - Card with thick border
- `filled` - Card with background color
- `ghost` - Transparent card

## 🏗️ Layout System

### Container

```typescript
import { Container } from '@/components/layout/Layout';

<Container size="lg" centered>
  <p>Content with max-width and centering</p>
</Container>
```

**Sizes:**

- `sm` - max-width: 2xl (672px)
- `md` - max-width: 4xl (896px)
- `lg` - max-width: 6xl (1152px)
- `xl` - max-width: 7xl (1280px)
- `full` - max-width: 100%

### Grid

```typescript
import { Grid, GridItem } from '@/components/layout/Layout';

<Grid cols={3} gap="md">
  <GridItem span={2}>Content 1</GridItem>
  <GridItem span={1}>Content 2</GridItem>
</Grid>
```

**Responsive Grid:**

```typescript
<Grid
  cols={1}
  responsive={{
    md: 2,
    lg: 3
  }}
>
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>
```

### Stack

```typescript
import { Stack } from '@/components/layout/Layout';

<Stack direction="column" gap="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>
```

**Stack Props:**

- `direction` - `row` | `column` | `row-reverse` | `column-reverse`
- `align` - `start` | `center` | `end` | `stretch`
- `justify` - `start` | `center` | `end` | `between` | `around` | `evenly`
- `gap` - `none` | `xs` | `sm` | `md` | `lg` | `xl`

## 🌓 Theme System

### Theme Provider

```typescript
import { ThemeProvider, useTheme, ThemeToggle } from '@/lib/design-system';

// In your app
<ThemeProvider defaultTheme="system" storageKey="my-app-theme">
  <App />
</ThemeProvider>

// In components
function MyComponent() {
  const { isDark, toggleColorScheme } = useTheme();

  return (
    <div>
      <p>Current theme: {isDark ? 'dark' : 'light'}</p>
      <ThemeToggle />
    </div>
  );
}
```

### Theme Toggle

```typescript
import { ThemeToggle } from '@/lib/design-system';

<ThemeToggle showLabel size="md" />
```

## 📱 Responsive Hooks

### useBreakpoint

```typescript
import { useBreakpoint, useIsMobile, useIsDesktop } from '@/hooks/useBreakpoint';

function ResponsiveComponent() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  return (
    <div>
      <p>Current breakpoint: {breakpoint}</p>
      {isMobile && <p>Mobile view</p>}
      {isDesktop && <p>Desktop view</p>}
    </div>
  );
}
```

### useResponsiveValue

```typescript
import { useResponsiveValue } from '@/hooks/useBreakpoint';

function ResponsiveText() {
  const fontSize = useResponsiveValue({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  });

  return <p className={fontSize}>Responsive text</p>;
}
```

## 🛠️ Utilities

### cn (className utility)

```typescript
import { cn } from '@/lib/utils';

// Merge classes
cn('px-2 py-1', 'px-4'); // Returns 'py-1 px-4'

// Conditional classes
cn('base-class', condition && 'conditional-class');

// With objects
cn('base-class', {
  'active-class': isActive,
  'disabled-class': isDisabled,
});
```

### Conditional

```typescript
import { conditional } from '@/lib/utils';

conditional(true, 'text-green-500', 'text-red-500'); // Returns 'text-green-500'
```

### Variant

```typescript
import { variant } from '@/lib/utils';

const buttonClasses = variant({
  size: {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
  },
});

buttonClasses({ size: 'md', variant: 'primary' }); // Returns combined classes
```

## 🎨 Customization

### CSS Variables

The design system uses CSS variables for easy customization:

```css
:root {
  --primary: 199 89% 48%;
  --primary-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... more variables */
}
```

### Extending Components

```typescript
import { Button, buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Extend with custom variants
const customButtonVariants = cva(buttonVariants, {
  variants: {
    // Add your custom variants
  }
});

// Or create wrapper components
function CustomButton({ className, ...props }) {
  return (
    <Button
      className={cn('custom-styles', className)}
      {...props}
    />
  );
}
```

## ♿ Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation** - Full keyboard support
- **Screen Readers** - Proper ARIA labels and roles
- **Focus Management** - Visible focus indicators
- **Color Contrast** - WCAG AA compliant colors
- **Semantic HTML** - Proper HTML structure

## 🧪 Testing

```typescript
// Example test for Button component
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

test('applies correct variant classes', () => {
  render(<Button variant="primary">Primary</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
});
```

## 📚 Best Practices

1. **Consistent Spacing** - Use the design system spacing scale
2. **Semantic Colors** - Use semantic color names (success, error, warning)
3. **Responsive Design** - Use responsive utilities and hooks
4. **Accessibility First** - Always consider accessibility when building components
5. **Performance** - Use the `cn` utility for efficient class merging
6. **Type Safety** - Leverage TypeScript for better developer experience

## 🔄 Migration Guide

### From Custom Components

1. Replace custom button components with `Button`
2. Update className utilities to use `cn`
3. Replace custom layout with `Container`, `Grid`, `Stack`
4. Update theme handling to use `ThemeProvider`

### From Other Design Systems

1. Update import paths to use the new structure
2. Replace component props with new API
3. Update CSS classes to use new design tokens
4. Test accessibility and responsive behavior

## 🤝 Contributing

1. Follow the established patterns and conventions
2. Add proper TypeScript types
3. Include accessibility features
4. Write tests for new components
5. Update documentation

## 📄 License

This design system is part of the GetRandomTrip project.
