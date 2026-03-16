'use client';

import Realistic from 'react-canvas-confetti/dist/presets/realistic';

interface ConfettiProps {
  delay?: number;
  duration?: number;
  speed?: number;
}

function Confetti({
  delay,
  duration = 250,
  speed = 3,
}: ConfettiProps) {
  return (
    <Realistic autorun={{ delay, duration, speed }} />
  );
}

export default Confetti;
