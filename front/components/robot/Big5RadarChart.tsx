import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';

type Big5Data = {
  neuroticism: number; // Top
  extraversion: number; // Top Right
  openness: number; // Bottom Right
  agreeableness: number; // Bottom Left
  conscientiousness: number; // Top Left
};

const LABELS = ['神经质', '外向性', '开放性', '宜人性', '尽责性'];

export default function Big5RadarChart({ data }: { data: Big5Data }) {
  const viewBoxWidth = 380; 
  const viewBoxHeight = 240; 
  const cx = viewBoxWidth / 2;
  const cy = viewBoxHeight / 2 + 10; 
  const radius = viewBoxHeight * 0.35; 
  
  // 分别映射到 0 -> 4 的轴
  const axisValues = [
    data.neuroticism,
    data.extraversion,
    data.openness,
    data.agreeableness,
    data.conscientiousness
  ];

  // 计算顶点坐标
  const getPoint = (percent: number, idx: number, maxRadius: number = radius) => {
    // 五角星每个角的偏移量 (确保角尖朝上: -90 degrees)
    const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2; 
    const r = maxRadius * (percent / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // 生成网格坐标点集
  const getGridPoints = (percentLevel: number) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const p = getPoint(percentLevel, i);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  // 数据层坐标
  const dataPoints = axisValues.map((val, i) => {
    const p = getPoint(val, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        {/* 背景环线 (3层) */}
        {[33, 66, 100].map(level => (
          <Polygon 
            key={level}
            points={getGridPoints(level)}
            fill="none"
            stroke="rgba(0, 229, 255, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* 骨架射线 */}
        {Array.from({ length: 5 }).map((_, i) => {
          const endPoint = getPoint(100, i);
          return (
            <Line 
              key={i}
              x1={cx} y1={cy}
              x2={endPoint.x} y2={endPoint.y}
              stroke="rgba(0, 229, 255, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* 实际属性多边形层 */}
        <Polygon 
          points={dataPoints}
          fill="rgba(0, 229, 255, 0.35)"
          stroke="#00e5ff"
          strokeWidth="2"
        />

        {/* 数据圆点装饰 */}
        {axisValues.map((val, i) => {
          const p = getPoint(val, i);
          return (
            <Circle 
              key={`dot-${i}`}
              cx={p.x} cy={p.y} r="3" 
              fill="#011e41" 
              stroke="#00e5ff" strokeWidth="2"
            />
          );
        })}

        {/* 外围文字标签 */}
        {LABELS.map((label, i) => {
          // 在 100% 轨道的更外缘（130%）放置文字
          const pText = getPoint(135, i);
          // 处理文字对齐（根据其在坐标系里的象限位置）
          const alignment = pText.x < cx - 10 ? 'end' : (pText.x > cx + 10 ? 'start' : 'middle');
          // 为了不让顶部文字过于靠上
          const yOffset = pText.y < cy ? 0 : 10;
          return (
            <SvgText
              key={label}
              x={pText.x}
              y={pText.y + yOffset}
              fill="#94a3b8"
              fontSize="12"
              fontWeight="bold"
              textAnchor={alignment}
            >
              {label} ({axisValues[i]}%)
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    width: '100%',
    backgroundColor: 'transparent',
  }
});
