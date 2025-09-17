# Design System Migration Guide

This guide helps you migrate existing components and styles to use the new design system.

## 🎯 Migration Overview

The design system provides a consistent, accessible, and maintainable foundation for all UI components. This migration will help you:

- Replace custom components with standardized ones
- Update styling to use design tokens
- Improve accessibility and consistency
- Reduce code duplication

## 📋 Migration Checklist

### Phase 1: Setup and Dependencies

- [ ] Install required dependencies
- [ ] Update Tailwind configuration
- [ ] Import design system styles
- [ ] Set up ThemeProvider

### Phase 2: Core Components

- [ ] Replace custom buttons with `Button` component
- [ ] Replace custom inputs with `Input` component
- [ ] Replace custom cards with `Card` component
- [ ] Update layout components

### Phase 3: Styling and Tokens

- [ ] Replace custom colors with design tokens
- [ ] Update spacing to use consistent scale
- [ ] Replace custom typography with design system fonts
- [ ] Update shadows and borders

### Phase 4: Advanced Features

- [ ] Implement theme switching
- [ ] Add responsive utilities
- [ ] Update animations and transitions
- [ ] Test accessibility

## 🔄 Component Migrations

### Button Migration

**Before:**

```tsx
<button
  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
  onClick={handleClick}
>
  Click me
</button>
```

**After:**

```tsx
import { Button } from '@/lib/design-system';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>;
```

**Migration Steps:**

1. Import `Button` from design system
2. Replace custom classes with `variant` prop
3. Remove manual styling
4. Add any missing props (loading, disabled, etc.)

### Input Migration

**Before:**

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">Email</label>
  <input
    type="email"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Enter your email"
  />
</div>
```

**After:**

```tsx
import { Input } from '@/lib/design-system';

<Input label="Email" type="email" placeholder="Enter your email" />;
```

**Migration Steps:**

1. Import `Input` from design system
2. Move label text to `label` prop
3. Remove custom styling classes
4. Add validation states if needed

### Card Migration

**Before:**

```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

**After:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/lib/design-system';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>;
```

**Migration Steps:**

1. Import card components from design system
2. Replace div structure with semantic card components
3. Remove custom styling classes
4. Add variants if needed (elevated, outlined, etc.)

## 🎨 Styling Migrations

### Color Migration

**Before:**

```tsx
<div className="bg-blue-500 text-white">
  <p className="text-red-500">Error message</p>
</div>
```

**After:**

```tsx
<div className="bg-primary-500 text-white">
  <p className="text-error-500">Error message</p>
</div>
```

**Color Mapping:**

- `bg-blue-500` → `bg-primary-500`
- `text-red-500` → `text-error-500`
- `text-green-500` → `text-success-500`
- `text-yellow-500` → `text-warning-500`
- `text-gray-500` → `text-secondary-500`

### Spacing Migration

**Before:**

```tsx
<div className="p-4 m-2 space-y-3">
  <div className="mb-4">Content</div>
</div>
```

**After:**

```tsx
<div className="p-4 m-2 space-y-3">
  <div className="mb-4">Content</div>
</div>
```

**Spacing Scale:**

- Use consistent spacing scale: `space-1` (4px) to `space-96` (384px)
- Prefer design system spacing over arbitrary values
- Use responsive spacing when needed: `p-4 md:p-6`

### Typography Migration

**Before:**

```tsx
<h1 className="text-3xl font-bold text-gray-900">Title</h1>
<p className="text-base text-gray-600 leading-relaxed">Body text</p>
```

**After:**

```tsx
<h1 className="text-3xl font-bold text-foreground">Title</h1>
<p className="text-base text-muted-foreground leading-relaxed">Body text</p>
```

**Typography Updates:**

- Use semantic color classes: `text-foreground`, `text-muted-foreground`
- Leverage design system font sizes and weights
- Use consistent line heights

## 🏗️ Layout Migrations

### Container Migration

**Before:**

```tsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">Content</div>
```

**After:**

```tsx
import { Container } from '@/lib/design-system';

<Container size="lg">Content</Container>;
```

### Grid Migration

**Before:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**After:**

```tsx
import { Grid, GridItem } from '@/lib/design-system';

<Grid cols={1} gap="md" responsive={{ md: 2, lg: 3 }}>
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>;
```

### Stack Migration

**Before:**

```tsx
<div className="flex flex-col space-y-4 items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**After:**

```tsx
import { Stack } from '@/lib/design-system';

<Stack direction="column" gap="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>;
```

## 🌓 Theme Migration

### Adding Theme Support

**Before:**

```tsx
// No theme support
<div className="bg-white text-black">Content</div>
```

**After:**

```tsx
import { ThemeProvider } from '@/lib/design-system';

// In your app root
<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>

// In components
<div className="bg-background text-foreground">
  Content
</div>
```

### Theme Toggle Integration

```tsx
import { ThemeToggle } from '@/lib/design-system';

<header>
  <nav>
    {/* Your navigation */}
    <ThemeToggle showLabel />
  </nav>
</header>;
```

## 📱 Responsive Migration

### Using Responsive Hooks

**Before:**

```tsx
// Manual responsive logic
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

**After:**

```tsx
import { useIsMobile } from '@/lib/design-system';

function MyComponent() {
  const isMobile = useIsMobile();

  return <div>{isMobile ? <MobileView /> : <DesktopView />}</div>;
}
```

### Responsive Utilities

```tsx
import { useResponsiveValue } from '@/lib/design-system';

function ResponsiveComponent() {
  const padding = useResponsiveValue({
    base: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  });

  return <div className={padding}>Content</div>;
}
```

## 🧪 Testing Migration

### Updating Tests

**Before:**

```tsx
test('renders button', () => {
  render(<button className="custom-button">Click me</button>);
  expect(screen.getByRole('button')).toHaveClass('custom-button');
});
```

**After:**

```tsx
import { Button } from '@/lib/design-system';

test('renders button', () => {
  render(<Button variant="primary">Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
  expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
});
```

## 🚨 Common Issues and Solutions

### Issue: Custom styles not working

**Problem:** Custom Tailwind classes not applying after migration.

**Solution:** Ensure design system CSS is imported and Tailwind config is updated.

```tsx
// In your app/globals.css
@import '../styles/design-system.css';
```

### Issue: Theme not switching

**Problem:** Dark/light mode not working.

**Solution:** Ensure ThemeProvider is set up correctly and using semantic color classes.

```tsx
// Use semantic colors
<div className="bg-background text-foreground">// Not: bg-white text-black</div>
```

### Issue: Components not responsive

**Problem:** Components not adapting to screen sizes.

**Solution:** Use responsive utilities and hooks from the design system.

```tsx
import { useBreakpoint, Grid } from '@/lib/design-system';

// Use responsive props
<Grid cols={1} responsive={{ md: 2, lg: 3 }}>
```

### Issue: Accessibility issues

**Problem:** Components not accessible after migration.

**Solution:** Use design system components which include built-in accessibility features.

```tsx
// Design system components include proper ARIA attributes
<Input label="Email" required />
<Button aria-label="Submit form">Submit</Button>
```

## 📊 Migration Progress Tracking

### Phase 1: Foundation (Week 1)

- [ ] Set up design system
- [ ] Update Tailwind config
- [ ] Import styles
- [ ] Set up ThemeProvider

### Phase 2: Core Components (Week 2-3)

- [ ] Migrate buttons (estimated: 20 components)
- [ ] Migrate inputs (estimated: 15 components)
- [ ] Migrate cards (estimated: 10 components)
- [ ] Update forms

### Phase 3: Layout and Styling (Week 4)

- [ ] Migrate containers and grids
- [ ] Update spacing and typography
- [ ] Implement responsive design
- [ ] Update color scheme

### Phase 4: Advanced Features (Week 5)

- [ ] Add theme switching
- [ ] Implement animations
- [ ] Update tests
- [ ] Performance optimization

## 🎉 Post-Migration Benefits

After completing the migration, you'll have:

- **Consistency**: All components follow the same design patterns
- **Accessibility**: Built-in accessibility features
- **Maintainability**: Centralized design tokens and components
- **Performance**: Optimized CSS and component structure
- **Developer Experience**: Better TypeScript support and documentation
- **Responsive Design**: Consistent responsive behavior across components
- **Theme Support**: Easy light/dark mode switching

## 📚 Additional Resources

- [Design System Documentation](./README.md)
- [Component Examples](./examples.tsx)
- [Type Definitions](./types.ts)
- [Test Examples](./__tests__/design-system.test.tsx)

## 🤝 Getting Help

If you encounter issues during migration:

1. Check the component documentation
2. Review the examples
3. Test with the design system playground
4. Consult the type definitions
5. Run the test suite for reference implementations
