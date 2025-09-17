/**
 * Design System Examples
 * Comprehensive examples showcasing all components and their variants
 */

import React from 'react';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import {
  Container,
  Grid,
  GridItem,
  Stack,
  Section,
} from '@/components/layout/DesignSystemLayout';
import { ThemeToggle, useTheme } from '@/lib/theme/ThemeProvider';
import { useBreakpoint, useBreakpointBelow, useBreakpointAbove } from '@/hooks/useBreakpoint';

// ============================================================================
// BUTTON EXAMPLES
// ============================================================================

export function ButtonExamples() {
  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Button Examples</h2>

        {/* Button Variants */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
            <Button size="icon">🎯</Button>
          </div>
        </div>

        {/* Button States */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">States</h3>
          <div className="flex flex-wrap gap-4">
            <Button>Normal</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button leftIcon="🚀">With Left Icon</Button>
            <Button rightIcon="→">With Right Icon</Button>
          </div>
        </div>

        {/* Button Group */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Button Group</h3>
          <ButtonGroup orientation="horizontal" spacing="sm">
            <Button variant="outline">Previous</Button>
            <Button>Next</Button>
          </ButtonGroup>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// INPUT EXAMPLES
// ============================================================================

export function InputExamples() {
  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Input Examples</h2>

        {/* Basic Inputs */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Basic Inputs</h3>
          <Grid cols={2} gap="md">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              helperText="We'll never share your email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </Grid>
        </div>

        {/* Input States */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Input States</h3>
          <Grid cols={3} gap="md">
            <Input
              label="Success Input"
              value="Valid input"
              success="Looks good!"
            />
            <Input
              label="Error Input"
              value="Invalid input"
              error="This field is required"
            />
            <Input
              label="Warning Input"
              value="Warning input"
              warning="Please double check this"
            />
          </Grid>
        </div>

        {/* Input with Icons */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Input with Icons</h3>
          <Grid cols={2} gap="md">
            <Input label="Search" placeholder="Search..." leftIcon="🔍" />
            <Input label="Loading" placeholder="Loading..." loading />
          </Grid>
        </div>

        {/* Textarea */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Textarea</h3>
          <Textarea
            label="Message"
            placeholder="Enter your message"
            rows={4}
            helperText="Maximum 500 characters"
          />
        </div>

        {/* Select */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Select</h3>
          <Select
            label="Country"
            placeholder="Select a country"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'mx', label: 'Mexico' },
              { value: 'uk', label: 'United Kingdom' },
            ]}
          />
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// CARD EXAMPLES
// ============================================================================

export function CardExamples() {
  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Card Examples</h2>

        {/* Card Variants */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Card Variants</h3>
          <Grid cols={3} gap="md">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with border</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is a default card with standard styling.</p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has an elevated appearance with shadow.</p>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>Card with thick border</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has a prominent border.</p>
              </CardContent>
            </Card>
          </Grid>
        </div>

        {/* Interactive Card */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Interactive Card</h3>
          <Card variant="elevated" interactive className="max-w-md">
            <CardHeader>
              <CardTitle>Clickable Card</CardTitle>
              <CardDescription>This card is interactive</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Click anywhere on this card to interact with it.</p>
            </CardContent>
            <CardFooter>
              <Button>Learn More</Button>
            </CardFooter>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// LAYOUT EXAMPLES
// ============================================================================

export function LayoutExamples() {
  const breakpoint = useBreakpoint();

  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Layout Examples</h2>

        {/* Container Sizes */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Container Sizes</h3>
          <div className="space-y-4">
            <Container size="sm" className="bg-primary-100 p-4 rounded">
              <p>Small container (max-width: 2xl)</p>
            </Container>
            <Container size="md" className="bg-primary-200 p-4 rounded">
              <p>Medium container (max-width: 4xl)</p>
            </Container>
            <Container size="lg" className="bg-primary-300 p-4 rounded">
              <p>Large container (max-width: 6xl)</p>
            </Container>
          </div>
        </div>

        {/* Grid System */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Grid System</h3>
          <Grid cols={4} gap="md">
            <GridItem span={2} className="bg-secondary-200 p-4 rounded">
              <p>Span 2</p>
            </GridItem>
            <GridItem span={1} className="bg-secondary-300 p-4 rounded">
              <p>Span 1</p>
            </GridItem>
            <GridItem span={1} className="bg-secondary-400 p-4 rounded">
              <p>Span 1</p>
            </GridItem>
          </Grid>
        </div>

        {/* Responsive Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Responsive Grid</h3>
          <Grid
            cols={1}
            gap="md"
            responsive={{
              sm: 2,
              md: 3,
              lg: 4,
            }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <GridItem key={i} className="bg-accent-200 p-4 rounded">
                <p>Item {i + 1}</p>
              </GridItem>
            ))}
          </Grid>
        </div>

        {/* Stack Examples */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Stack Examples</h3>
          <div className="flex gap-8">
            <Stack direction="column" gap="sm" className="bg-muted p-4 rounded">
              <div className="bg-primary-200 p-2 rounded">Item 1</div>
              <div className="bg-primary-300 p-2 rounded">Item 2</div>
              <div className="bg-primary-400 p-2 rounded">Item 3</div>
            </Stack>

            <Stack
              direction="row"
              gap="sm"
              align="center"
              className="bg-muted p-4 rounded"
            >
              <div className="bg-success-200 p-2 rounded">Item 1</div>
              <div className="bg-success-300 p-2 rounded">Item 2</div>
              <div className="bg-success-400 p-2 rounded">Item 3</div>
            </Stack>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// THEME EXAMPLES
// ============================================================================

export function ThemeExamples() {
  const { isDark, colorScheme, toggleColorScheme } = useTheme();

  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Theme Examples</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Theme Controls</h3>
          <div className="flex items-center gap-4">
            <ThemeToggle showLabel />
            <p>Current theme: {colorScheme}</p>
            <p>Is dark: {isDark ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Color Palette</h3>
          <Grid cols={5} gap="sm">
            <div className="bg-primary-500 p-4 rounded text-white text-center">
              Primary
            </div>
            <div className="bg-secondary-500 p-4 rounded text-white text-center">
              Secondary
            </div>
            <div className="bg-success-500 p-4 rounded text-white text-center">
              Success
            </div>
            <div className="bg-warning-500 p-4 rounded text-white text-center">
              Warning
            </div>
            <div className="bg-error-500 p-4 rounded text-white text-center">
              Error
            </div>
          </Grid>
        </div>

        {/* Typography Scale */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Typography Scale</h3>
          <div className="space-y-2">
            <h1 className="text-4xl">Heading 1 - 4xl</h1>
            <h2 className="text-3xl">Heading 2 - 3xl</h2>
            <h3 className="text-2xl">Heading 3 - 2xl</h3>
            <h4 className="text-xl">Heading 4 - xl</h4>
            <h5 className="text-lg">Heading 5 - lg</h5>
            <h6 className="text-base">Heading 6 - base</h6>
            <p className="text-sm">Body text - sm</p>
            <p className="text-xs">Small text - xs</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// RESPONSIVE EXAMPLES
// ============================================================================

export function ResponsiveExamples() {
  const breakpoint = useBreakpoint();
  const isMobile = useBreakpointBelow('md');
  const isDesktop = useBreakpointAbove('lg');

  return (
    <Section>
      <Container>
        <h2 className="text-3xl font-bold mb-8">Responsive Examples</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Breakpoint Information</h3>
          <div className="bg-muted p-4 rounded">
            <p>
              <strong>Current breakpoint:</strong> {breakpoint}
            </p>
            <p>
              <strong>Is mobile:</strong> {isMobile ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Is desktop:</strong> {isDesktop ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Responsive Grid</h3>
          <Grid
            cols={1}
            gap="md"
            responsive={{
              sm: 2,
              md: 3,
              lg: 4,
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <GridItem key={i} className="bg-primary-100 p-4 rounded">
                <p>Responsive item {i + 1}</p>
                <p className="text-sm text-muted-foreground">
                  Adapts to screen size
                </p>
              </GridItem>
            ))}
          </Grid>
        </div>

        {/* Responsive Typography */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Responsive Typography</h3>
          <div className="space-y-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl">
              Responsive Heading
            </h1>
            <p className="text-sm md:text-base lg:text-lg">
              This text scales with the screen size for optimal readability.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================================
// COMPLETE EXAMPLE PAGE
// ============================================================================

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <Container>
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">Design System Showcase</h1>
            <ThemeToggle showLabel />
          </div>
        </Container>
      </header>

      <main>
        <ButtonExamples />
        <InputExamples />
        <CardExamples />
        <LayoutExamples />
        <ThemeExamples />
        <ResponsiveExamples />
      </main>

      <footer className="border-t mt-16">
        <Container>
          <div className="py-8 text-center text-muted-foreground">
            <p>
              GetRandomTrip Design System - Built with Shadcn/UI & Tailwind CSS
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
