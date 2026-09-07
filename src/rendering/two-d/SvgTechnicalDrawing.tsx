import React, { useId } from 'react';
import type { TechnicalDrawingModel } from './drawingModel';
import type { UnitSystem } from '../../domain/design';
import { formatDimension } from '../../domain/units';
import type { UseSvgViewportResult } from './useSvgViewport';

export interface SvgTechnicalDrawingProps {
  model: TechnicalDrawingModel;
  unitSystem: UnitSystem;
  viewport: UseSvgViewportResult;
  className?: string;
}

export const SvgTechnicalDrawing: React.FC<SvgTechnicalDrawingProps> = ({
  model,
  unitSystem,
  viewport,
  className = '',
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const markerStartId = `dim-arrow-start-${uniqueId}`;
  const markerEndId = `dim-arrow-end-${uniqueId}`;
  const titleId = `drawing-title-${uniqueId}`;
  const descId = `drawing-desc-${uniqueId}`;

  const {
    viewBoxString,
    svgRef,
    isPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = viewport;

  return (
    <svg
      ref={svgRef}
      className={`technical-drawing-svg ${isPanning ? 'is-panning' : ''} ${className}`}
      viewBox={viewBoxString}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      data-view={model.view}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'none' }}
    >
      <title id={titleId}>{model.title}</title>
      <desc id={descId}>{model.description}</desc>

      <defs>
        {/* Dimension Arrowhead Markers */}
        <marker
          id={markerStartId}
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 8 2 L 2 5 L 8 8 z" className="dimension-arrow" />
        </marker>
        <marker
          id={markerEndId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 2 2 L 8 5 L 2 8 z" className="dimension-arrow" />
        </marker>
      </defs>

      {/* Layer 1: Rectangles (Body, Lid panel, Battens) */}
      <g className="drawing-layer layer-rectangles">
        {model.rectangles.map((rect) => {
          const svgX = rect.x;
          const svgY = -(rect.y + rect.height);
          return (
            <rect
              key={rect.id}
              id={rect.id}
              data-part={rect.part}
              className={`drawing-primitive drawing-rect part-${rect.part} ${
                rect.hidden ? 'is-hidden-edge' : ''
              }`}
              x={svgX}
              y={svgY}
              width={rect.width}
              height={rect.height}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      {/* Layer 2: Polygons (Tapered locking lid batten, wedge, bevel faces) */}
      <g className="drawing-layer layer-polygons">
        {model.polygons.map((poly) => {
          const pointsStr = poly.points.map((p) => `${p.x},${-p.y}`).join(' ');
          return (
            <polygon
              key={poly.id}
              id={poly.id}
              data-part={poly.part}
              className={`drawing-primitive drawing-polygon part-${poly.part} ${
                poly.hidden ? 'is-hidden-edge' : ''
              }`}
              points={pointsStr}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      {/* Layer 3: Feature & Hidden Lines */}
      <g className="drawing-layer layer-lines">
        {model.lines.map((line) => (
          <line
            key={line.id}
            id={line.id}
            data-part={line.part}
            className={`drawing-primitive drawing-line kind-${line.kind} ${
              line.part ? `part-${line.part}` : ''
            }`}
            x1={line.start.x}
            y1={-line.start.y}
            x2={line.end.x}
            y2={-line.end.y}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {/* Layer 4: Dimensions */}
      <g className="drawing-layer layer-dimensions">
        {model.dimensions.map((dim) => {
          const formattedVal = formatDimension(dim.valueMillimetres, unitSystem, {
            includeUnit: true,
          });
          const displayText = dim.label ? `${dim.label}: ${formattedVal}` : formattedVal;

          if (dim.axis === 'x') {
            const x1 = Math.min(dim.start.x, dim.end.x);
            const x2 = Math.max(dim.start.x, dim.end.x);
            const yBase = dim.start.y;
            const yDim = yBase + dim.offset;
            const svgYBase = -yBase;
            const svgYDim = -yDim;
            const overshoot = dim.offset > 0 ? -4 : 4;

            return (
              <g key={dim.id} className="dimension-group" data-dimension={dim.id}>
                {/* Extension Lines */}
                <line
                  className="dimension-extension-line"
                  x1={x1}
                  y1={svgYBase}
                  x2={x1}
                  y2={svgYDim + overshoot}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  className="dimension-extension-line"
                  x1={x2}
                  y1={svgYBase}
                  x2={x2}
                  y2={svgYDim + overshoot}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Dimension Line with Arrows */}
                <line
                  className="dimension-line"
                  x1={x1}
                  y1={svgYDim}
                  x2={x2}
                  y2={svgYDim}
                  markerStart={`url(#${markerStartId})`}
                  markerEnd={`url(#${markerEndId})`}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Text Label */}
                <text
                  className="dimension-text"
                  x={(x1 + x2) / 2}
                  y={svgYDim + (dim.offset > 0 ? -6 : 14)}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {displayText}
                </text>
              </g>
            );
          } else {
            // axis === 'y'
            const y1 = Math.min(dim.start.y, dim.end.y);
            const y2 = Math.max(dim.start.y, dim.end.y);
            const xBase = dim.start.x;
            const xDim = xBase + dim.offset;
            const svgY1 = -y1;
            const svgY2 = -y2;
            const overshoot = dim.offset > 0 ? 4 : -4;

            return (
              <g key={dim.id} className="dimension-group" data-dimension={dim.id}>
                {/* Extension Lines */}
                <line
                  className="dimension-extension-line"
                  x1={xBase}
                  y1={svgY1}
                  x2={xDim + overshoot}
                  y2={svgY1}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  className="dimension-extension-line"
                  x1={xBase}
                  y1={svgY2}
                  x2={xDim + overshoot}
                  y2={svgY2}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Dimension Line with Arrows */}
                <line
                  className="dimension-line"
                  x1={xDim}
                  y1={svgY1}
                  x2={xDim}
                  y2={svgY2}
                  markerStart={`url(#${markerEndId})`}
                  markerEnd={`url(#${markerStartId})`}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Text Label */}
                <text
                  className="dimension-text"
                  x={xDim + (dim.offset > 0 ? 8 : -8)}
                  y={(svgY1 + svgY2) / 2}
                  textAnchor={dim.offset > 0 ? 'start' : 'end'}
                  dominantBaseline="central"
                >
                  {displayText}
                </text>
              </g>
            );
          }
        })}
      </g>

      {/* Layer 5: Annotations */}
      <g className="drawing-layer layer-annotations">
        {model.annotations.map((ann) => (
          <text
            key={ann.id}
            id={ann.id}
            className="drawing-annotation"
            x={ann.position.x}
            y={-ann.position.y}
            textAnchor={ann.align === 'left' ? 'start' : ann.align === 'right' ? 'end' : 'middle'}
            dominantBaseline="central"
          >
            {ann.text}
          </text>
        ))}
      </g>
    </svg>
  );
};
