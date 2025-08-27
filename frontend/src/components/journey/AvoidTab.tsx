'use client';
import AvoidGrid from './avoid/AvoidGrid';
import StepperNav from './StepperNav';
import SelectedFiltersChips from '../SelectedFiltersChips';

export default function AvoidTab(){
  return (
    <div className="space-y-6">
      <SelectedFiltersChips />
      <AvoidGrid />
      <StepperNav />
    </div>
  );
}

