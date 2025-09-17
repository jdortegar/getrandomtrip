/**
 * Design System Tests
 * Comprehensive tests for all design system components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Button,
  Input,
  Card,
  Container,
  Grid,
  Stack,
} from '@/lib/design-system';

// ============================================================================
// BUTTON TESTS
// ============================================================================

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('applies correct variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  test('applies correct size classes', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-12');
  });

  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-wait');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders with left icon', () => {
    render(<Button leftIcon="🚀">With Icon</Button>);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  test('renders with right icon', () => {
    render(<Button rightIcon="→">With Icon</Button>);
    expect(screen.getByText('→')).toBeInTheDocument();
  });
});

// ============================================================================
// INPUT TESTS
// ============================================================================

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('shows error state', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('shows success state', () => {
    render(<Input success="Looks good!" />);
    expect(screen.getByText('Looks good!')).toBeInTheDocument();
  });

  test('shows warning state', () => {
    render(<Input warning="Please check this" />);
    expect(screen.getByText('Please check this')).toBeInTheDocument();
  });

  test('renders with helper text', () => {
    render(<Input helperText="We'll never share your email" />);
    expect(
      screen.getByText("We'll never share your email"),
    ).toBeInTheDocument();
  });

  test('renders with left icon', () => {
    render(<Input leftIcon="🔍" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  test('renders with right icon', () => {
    render(<Input rightIcon="✓" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<Input loading />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('handles input changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalled();
  });
});

// ============================================================================
// CARD TESTS
// ============================================================================

describe('Card Component', () => {
  test('renders card with content', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('applies correct variant classes', () => {
    render(<Card variant="elevated">Elevated card</Card>);
    const card = screen.getByText('Elevated card').closest('div');
    expect(card).toHaveClass('shadow-md');
  });

  test('renders card with header and content', () => {
    render(
      <Card>
        <div>Header</div>
        <div>Content</div>
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('renders interactive card', () => {
    const handleClick = jest.fn();
    render(
      <Card interactive onClick={handleClick}>
        Interactive card
      </Card>,
    );

    const card = screen.getByText('Interactive card').closest('div');
    expect(card).toHaveClass('cursor-pointer');

    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalled();
  });
});

// ============================================================================
// LAYOUT TESTS
// ============================================================================

describe('Container Component', () => {
  test('renders container with content', () => {
    render(
      <Container>
        <div>Container content</div>
      </Container>,
    );
    expect(screen.getByText('Container content')).toBeInTheDocument();
  });

  test('applies correct size classes', () => {
    render(<Container size="lg">Large container</Container>);
    const container = screen.getByText('Large container').closest('div');
    expect(container).toHaveClass('max-w-6xl');
  });

  test('applies centering when enabled', () => {
    render(<Container centered>Centered container</Container>);
    const container = screen.getByText('Centered container').closest('div');
    expect(container).toHaveClass('mx-auto');
  });
});

describe('Grid Component', () => {
  test('renders grid with correct columns', () => {
    render(
      <Grid cols={3}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>,
    );

    const grid = screen.getByText('Item 1').closest('div')?.parentElement;
    expect(grid).toHaveClass('grid-cols-3');
  });

  test('applies correct gap classes', () => {
    render(
      <Grid cols={2} gap="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>,
    );

    const grid = screen.getByText('Item 1').closest('div')?.parentElement;
    expect(grid).toHaveClass('gap-6');
  });
});

describe('Stack Component', () => {
  test('renders vertical stack by default', () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );

    const stack = screen.getByText('Item 1').closest('div')?.parentElement;
    expect(stack).toHaveClass('flex-col');
  });

  test('renders horizontal stack', () => {
    render(
      <Stack direction="row">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );

    const stack = screen.getByText('Item 1').closest('div')?.parentElement;
    expect(stack).toHaveClass('flex-row');
  });

  test('applies correct alignment', () => {
    render(
      <Stack align="center">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );

    const stack = screen.getByText('Item 1').closest('div')?.parentElement;
    expect(stack).toHaveClass('items-center');
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility', () => {
  test('button has proper ARIA attributes', () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });

  test('input has proper label association', () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
  });

  test('required input shows required indicator', () => {
    render(<Input label="Password" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('disabled button is not focusable', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Component Integration', () => {
  test('form with input and button works together', () => {
    const handleSubmit = jest.fn();

    render(
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" required />
        <Button type="submit">Submit</Button>
      </form>,
    );

    const input = screen.getByLabelText('Email');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    expect(handleSubmit).toHaveBeenCalled();
  });

  test('card with interactive elements', () => {
    const handleCardClick = jest.fn();
    const handleButtonClick = jest.fn();

    render(
      <Card interactive onClick={handleCardClick}>
        <div>Card content</div>
        <Button onClick={handleButtonClick}>Action</Button>
      </Card>,
    );

    const card = screen.getByText('Card content').closest('div');
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(handleButtonClick).toHaveBeenCalled();
    expect(handleCardClick).not.toHaveBeenCalled(); // Button click should not bubble
  });
});
