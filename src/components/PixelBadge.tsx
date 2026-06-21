import { palette } from '../data/pixelMaps';
import type { PixelGrid } from '../data/pixelMaps';

interface Props {
  pattern: PixelGrid;
  pixelSize?: number;
  className?: string;
}

export function PixelBadge({ pattern, pixelSize = 4, className = '' }: Props) {
  const width = pattern[0].length * pixelSize;
  const height = pattern.length * pixelSize;

  return (
    <svg
      className={`pixel-badge ${className}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
    >
      {pattern.map((row, y) =>
        row.map((colorKey, x) => {
          const fill = palette[colorKey as keyof typeof palette];
          if (fill === 'transparent') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={fill}
            />
          );
        }),
      )}
    </svg>
  );
}
