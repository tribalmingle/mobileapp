import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface AfricanTribalPatternProps {
  color?: string;
  opacity?: number;
}

export const AfricanTribalPattern: React.FC<AfricanTribalPatternProps> = ({
  color = 'rgba(157, 78, 221, 0.4)',
  opacity = 0.7,
}) => {
  const strokeColor1 = color;
  const strokeColor2 = color.replace(/[\d.]+\)$/,'0.35)');
  const strokeColor3 = color.replace(/[\d.]+\)$/,'0.3)');

  return (
    <Svg width={width} height={height} style={[styles.patternBackground, { opacity }]}>
      {[...Array(8)].map((_, row) =>
        [...Array(4)].map((_, col) => (
          <React.Fragment key={`${row}-${col}`}>
            <Path
              d={`M ${col * 100 + 50} ${row * 120 + 40} L ${col * 100 + 70} ${row * 120 + 60} L ${col * 100 + 50} ${row * 120 + 80} L ${col * 100 + 30} ${row * 120 + 60} Z`}
              fill="none"
              stroke={strokeColor1}
              strokeWidth={2.5}
            />
            <Path
              d={`M ${col * 100 + 20} ${row * 120 + 100} L ${col * 100 + 30} ${row * 120 + 90} L ${col * 100 + 40} ${row * 120 + 100} L ${col * 100 + 50} ${row * 120 + 90} L ${col * 100 + 60} ${row * 120 + 100}`}
              fill="none"
              stroke={strokeColor2}
              strokeWidth={2}
            />
            <Circle
              cx={col * 100 + 50}
              cy={row * 120 + 20}
              r={8}
              fill="none"
              stroke={strokeColor3}
              strokeWidth={2}
            />
          </React.Fragment>
        )),
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export const PatternColors = {
  purple: 'rgba(157, 78, 221, 0.4)',
  darkPurple: 'rgba(49, 46, 129, 0.4)',
  blue: 'rgba(30, 58, 138, 0.4)',
  pink: 'rgba(255, 107, 157, 0.4)',
};
