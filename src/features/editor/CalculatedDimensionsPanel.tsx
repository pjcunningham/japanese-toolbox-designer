import React from 'react';
import { formatDimension } from '../../domain/units';
import type { CalculatedDimensionsPanelProps } from './types';

export const CalculatedDimensionsPanel: React.FC<CalculatedDimensionsPanelProps> = ({
  geometryResult,
  unitSystem,
  hasInputErrors,
}) => {
  const isGeometryValid = geometryResult.ok;
  const isAvailable = !hasInputErrors && isGeometryValid;

  return (
    <div className={`calculated-panel ${!isAvailable ? 'is-stale' : ''}`}>
      <div className="calculated-header-row">
        <h2 className="calculated-main-title">Calculated design</h2>
        <div
          className={`design-status-badge ${
            hasInputErrors ? 'status-warning' : isGeometryValid ? 'status-valid' : 'status-invalid'
          }`}
          role="status"
          aria-live="polite"
        >
          {hasInputErrors ? (
            <>
              <span className="status-icon" aria-hidden="true">
                ⚠
              </span>
              <span>Input needs attention</span>
            </>
          ) : isGeometryValid ? (
            <>
              <span className="status-icon" aria-hidden="true">
                ✓
              </span>
              <span>Design is geometrically valid</span>
            </>
          ) : (
            <>
              <span className="status-icon" aria-hidden="true">
                ⚠
              </span>
              <span>Design needs attention</span>
            </>
          )}
        </div>
      </div>

      {!isAvailable ? (
        <div className="calculated-unavailable-message">
          <p>
            {hasInputErrors
              ? 'Calculated dimensions are not current while input errors exist.'
              : 'Calculated dimensions will appear when the design is valid.'}
          </p>
        </div>
      ) : (
        <div className="calculated-groups-grid">
          {/* Internal Box */}
          <section className="calc-group" aria-labelledby="calc-box-title">
            <h3 id="calc-box-title" className="calc-group-title">
              Internal dimensions
            </h3>
            <dl className="calc-list">
              <div className="calc-item">
                <dt>Internal length</dt>
                <dd>{formatDimension(geometryResult.geometry.box.internal.length, unitSystem)}</dd>
              </div>
              <div className="calc-item">
                <dt>Internal width</dt>
                <dd>{formatDimension(geometryResult.geometry.box.internal.width, unitSystem)}</dd>
              </div>
              <div className="calc-item">
                <dt>Internal height</dt>
                <dd>{formatDimension(geometryResult.geometry.box.internal.height, unitSystem)}</dd>
              </div>
              <div className="calc-item">
                <dt>Overall height including top battens</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.box.outside.overallHeightWithTopBattens,
                    unitSystem,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Lid Dimensions */}
          <section className="calc-group" aria-labelledby="calc-lid-title">
            <h3 id="calc-lid-title" className="calc-group-title">
              Lid dimensions
            </h3>
            <dl className="calc-list">
              <div className="calc-item">
                <dt>Lid panel length</dt>
                <dd>
                  {formatDimension(geometryResult.geometry.lid.panel.dimensions.length, unitSystem)}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Lid panel width</dt>
                <dd>
                  {formatDimension(geometryResult.geometry.lid.panel.dimensions.width, unitSystem)}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Lid panel thickness</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lid.panel.dimensions.thickness,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Locked overlap per end</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lid.longitudinalFit.lockedOverlapPerEnd,
                    unitSystem,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Lid Movement */}
          <section className="calc-group" aria-labelledby="calc-movement-title">
            <h3 id="calc-movement-title" className="calc-group-title">
              Lid overlap &amp; travel
            </h3>
            <dl className="calc-list">
              <div className="calc-item">
                <dt>Travel to release edge</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lid.longitudinalFit.travelToReleaseEdge,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Available lid travel</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lid.longitudinalFit.availableTravel,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item highlight-item">
                <dt>
                  <span>Release travel margin</span>
                  <small className="calc-item-helper">
                    Extra movement remaining after the stop end has fully cleared.
                  </small>
                </dt>
                <dd className="highlight-value">
                  {formatDimension(
                    geometryResult.geometry.lid.longitudinalFit.releaseTravelMargin,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Side-wall bearing per side</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lid.lateralFit.battenBearingPerSide,
                    unitSystem,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Locking Wedge */}
          <section className="calc-group" aria-labelledby="calc-wedge-title">
            <h3 id="calc-wedge-title" className="calc-group-title">
              Locking wedge
            </h3>
            <p className="calc-group-note">
              The wedge is tapered across the toolbox and bevelled vertically so it is captured
              rather than relying on gravity.
            </p>
            <dl className="calc-list">
              <div className="calc-item">
                <dt>Wedge narrow width</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.wedge.bottomNarrowWidth,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Wedge wide width</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.wedge.bottomWideWidth,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Locking lid batten minimum width</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.lockingLidBatten.minimumWidth,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Locking lid batten maximum width</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.lockingLidBatten.maximumWidth,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Wedge working length</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.wedge.workingLength,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Recommended wedge blank length</dt>
                <dd>
                  {formatDimension(
                    geometryResult.geometry.lockingMechanism.wedge.recommendedBlankLength,
                    unitSystem,
                  )}
                </dd>
              </div>
              <div className="calc-item">
                <dt>Wedge taper angle</dt>
                <dd>{geometryResult.geometry.lockingMechanism.wedge.taperAngle}&deg;</dd>
              </div>
              <div className="calc-item">
                <dt>Wedge bevel angle</dt>
                <dd>{geometryResult.geometry.lockingMechanism.wedge.bevelAngle}&deg;</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};
