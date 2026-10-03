import React from 'react';
import Svg, { Rect, Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1E293B" />
          <Stop offset="1" stopColor="#0F172A" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx="26" fill="url(#bgGrad)" />
      <Circle
        cx="50"
        cy="50"
        r="32"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="140 60"
      />
      <Circle cx="50" cy="50" r="5" fill="#10B981" />
      <Line x1="50" y1="50" x2="50" y2="28" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <Line x1="50" y1="50" x2="68" y2="50" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" />
      <Path
        d="M72 26L78 32L84 26"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
