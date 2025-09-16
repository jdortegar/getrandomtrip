/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { computePetBudgetEstimate } from './PawsPetConfiguratorTab';

describe('computePetBudgetEstimate', () => {
  it('Explora, 1 mascota, small, cabina => 650', () => {
    expect(computePetBudgetEstimate('explora', 1, 'small', 'cabina')).toBe(650);
  });

  it('Explora, 2 mascotas (+25%), small, cabina => 813', () => {
    expect(computePetBudgetEstimate('explora', 2, 'small', 'cabina')).toBe(813);
  });

  it('Explora, 1 mascota, large, bodega => 787 (650 * 1.1 * 1.1)', () => {
    // Note: The logic is base * size_factor * cargo_factor. So 650 * 1.1 * 1.1 = 786.5 -> 787
    // The user comment is slightly off, it should be base * size_factor, and then if cargo is bodega, multiply by cargo_factor.
    // My implementation is: base * (1 + 0.25 * extra) * size_factor * (cargo_factor if bodega). Let's re-calculate.
    // 650 * 1.1 = 715. If transport is bodega, 715 * 1.1 = 786.5 -> 787. Correct.
    expect(computePetBudgetEstimate('explora', 1, 'large', 'bodega')).toBe(787);
  });

  it('Explora, 3 mascotas (+50%), large, bodega => 1180', () => {
    // 650 * 1.5 * 1.1 * 1.1 = 1179.75 -> 1180
    expect(computePetBudgetEstimate('explora', 3, 'large', 'bodega')).toBe(1180);
  });

  it('Essenza base, 1 mascota => 450', () => {
    expect(computePetBudgetEstimate('essenza', 1, 'small', 'cabina')).toBe(450);
  });

  it('Atelier base, 1 mascota, auto => 1550', () => {
    expect(computePetBudgetEstimate('atelier', 1, 'small', 'auto')).toBe(1550);
  });

  it('Explora, 2 mascotas, medium, auto => 859 (650 * 1.25 * 1.05)', () => {
    // 650 * 1.25 * 1.05 = 859.375 -> 859
    expect(computePetBudgetEstimate('explora', 2, 'medium', 'auto')).toBe(859);
  });

  it('Bivouac, 1 mascota, medium, bodega => 1876 (1550 * 1.05 * 1.1)', () => {
    // 1550 * 1.05 * 1.1 = 1789.25 -> 1789. The user test case is wrong.
    // Let's re-read the logic. base * size * cargo. 1550 * 1.05 = 1627.5. 1627.5 * 1.1 = 1790.25 -> 1790
    // The user test case seems to have a different logic. Let me stick to my implementation logic which is more consistent.
    // Let me re-check my logic. It is total *= SIZE_FACTORS[size] and then if (transport === 'bodega') total *= CARGO_FACTORS.bodega;
    // So for Bivouac, 1 pet, medium, bodega: 1550 * 1.05 = 1627.5. Then 1627.5 * 1.1 = 1790.25 -> 1790.
    // The user's expected is 1876. Let me check their math: 1550 * 1.05 * 1.1 = 1790.25. The user is wrong.
    // I will use my calculated value.
    expect(computePetBudgetEstimate('bivouac', 1, 'medium', 'bodega')).toBe(1790);
  });
});
