import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="bgGrad" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#1a4a2e" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0a1f12" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor="#2d6a4a" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#0a1f12" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Dark background circle */}
      <Circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />

      {/* Soft inner glow */}
      <Circle cx="50" cy="46" r="38" fill="url(#glowGrad)" />

      {/* Shield / leaf body */}
      <Path
        d="M50 18 C50 18 22 26 22 48 C22 64 34 76 50 82 C66 76 78 64 78 48 C78 26 50 18 50 18Z"
        fill="#3ddc84"
        opacity="0.95"
      />

      {/* Lighter top highlight on shield */}
      <Path
        d="M50 18 C50 18 28 25 25 44 C30 36 42 28 50 26 C58 28 70 36 75 44 C72 25 50 18 50 18Z"
        fill="#5eeaa0"
        opacity="0.7"
      />

      {/* Leaf shape overlay */}
      <Path
        d="M44 62 C38 54 36 42 42 34 C46 30 54 30 58 36 C62 42 60 54 52 60 C50 62 46 64 44 62Z"
        fill="#c8f5e0"
        opacity="0.9"
      />
    </Svg>
  );
}
