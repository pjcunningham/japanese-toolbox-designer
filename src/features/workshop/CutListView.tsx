import React from 'react';
import type { CutList } from '../../manufacturing';
import type { ToolboxDesign, UnitSystem } from '../../domain/design';
import { formatDimension } from '../../domain/units';
import { getWoodDefinition } from '../../materials';

export interface CutListViewProps {
  cutList: CutList;
  unitSystem: UnitSystem;
  design: ToolboxDesign;
}

export const CutListView: React.FC<CutListViewProps> = ({ cutList, unitSystem, design }) => {
  const woodDef = getWoodDefinition(design.wood.id);
  const woodName = woodDef ? woodDef.name : design.wood.id;
  const unitLabel = unitSystem === 'metric' ? 'Metric' : 'Imperial';

  return (
    <div className="workshop-cutlist-view" data-testid="workshop-cutlist-view">
      <div className="workshop-view-header">
        <div className="workshop-metadata-badge">
          <span className="metadata-item design-name">{design.name}</span>
          <span className="metadata-separator">·</span>
          <span className="metadata-item wood-name">{woodName}</span>
          <span className="metadata-separator">·</span>
          <span className="metadata-item unit-system">{unitLabel}</span>
        </div>

        <div className="cutlist-summary-pills">
          <span className="summary-pill line-items-pill">
            <strong>{cutList.summary.lineItemCount}</strong> line items
          </span>
          <span className="summary-pill stock-blanks-pill">
            <strong>{cutList.summary.stockBlankCount}</strong> stock blanks
          </span>
          <span className="summary-pill finished-parts-pill">
            <strong>{cutList.summary.finishedPartCount}</strong> finished parts
          </span>
        </div>
      </div>

      <div className="workshop-cutlist-table-container">
        <table className="workshop-table cutlist-table" aria-label="Workshop Cut List">
          <caption className="sr-only">
            Stock cutting list showing rectangular blanks required for toolbox construction
          </caption>
          <thead>
            <tr>
              <th scope="col" className="col-part">
                Part
              </th>
              <th scope="col" className="col-qty">
                Qty
              </th>
              <th scope="col" className="col-dim">
                Length
              </th>
              <th scope="col" className="col-dim">
                Width
              </th>
              <th scope="col" className="col-dim">
                Thickness
              </th>
              <th scope="col" className="col-notes">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {cutList.items.map((item) => (
              <tr key={item.id} data-testid={`cutlist-row-${item.id}`} className={`row-${item.id}`}>
                <td className="cell-part font-medium">{item.name}</td>
                <td className="cell-qty text-center">{item.quantity}</td>
                <td className="cell-dim">{formatDimension(item.dimensions.length, unitSystem)}</td>
                <td className="cell-dim">{formatDimension(item.dimensions.width, unitSystem)}</td>
                <td className="cell-dim">
                  {formatDimension(item.dimensions.thickness, unitSystem)}
                </td>
                <td className="cell-notes">
                  <ul className="item-notes-list">
                    {item.notes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="workshop-cutlist-explanation">
        <p>
          <strong>Stock blank rule:</strong> This cut list specifies the initial rectangular blanks
          to prepare before cutting joinery dados, tapers, or bevels. The locking batten and wedge
          are machined from a single combined blank left overlength for final fitting.
        </p>
      </div>
    </div>
  );
};
