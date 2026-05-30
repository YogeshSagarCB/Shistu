import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  habitName: string;
}

export const Sparkline = ({ data, width, height, color, habitName }: SparklineProps) => {
  if (!data || data.length === 0) return null;
  
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const mid = (min + max) / 2;
  const range = max - min === 0 ? 1 : max - min;
  
  const padding = 6;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  const xStep = chartWidth / (data.length - 1);
  const points = data.map((val, i) => {
    const x = padding + i * xStep;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, paddingRight: 10 }}>
      {/* Dynamic Y-Axis Labels */}
      <View style={{ width: 30, justifyContent: 'space-between', height: height, paddingVertical: padding }}>
        <Text style={{ fontSize: 9, color: '#888', textAlign: 'right' }} numberOfLines={1}>{Math.round(max)}</Text>
        <Text style={{ fontSize: 9, color: '#888', textAlign: 'right' }} numberOfLines={1}>{Math.round(mid)}</Text>
        <Text style={{ fontSize: 9, color: '#888', textAlign: 'right' }} numberOfLines={1}>{Math.round(min)}</Text>
      </View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1="0" y1={padding} x2={width} y2={padding} stroke="#444" strokeDasharray="2 2" />
        <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#444" strokeDasharray="2 2" />
        <Line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="#444" strokeDasharray="2 2" />
        <Path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};
