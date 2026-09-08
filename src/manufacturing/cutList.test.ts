import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign, setDesignUnitSystem } from '../domain';
import { calculateToolboxGeometry } from '../domain/geometry';
import { createCutList } from './cutList';

describe('createCutList', () => {
  it('generates all 8 cut-list rows with exact default V3 dimensions', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cutList = createCutList(result.geometry);

    expect(cutList.items).toHaveLength(8);

    const [
      sideItem,
      endItem,
      bottomItem,
      handleItem,
      endCapItem,
      lidPanelItem,
      straightBattenItem,
      lockingSetItem,
    ] = cutList.items;

    expect(sideItem).toBeDefined();
    expect(endItem).toBeDefined();
    expect(bottomItem).toBeDefined();
    expect(handleItem).toBeDefined();
    expect(endCapItem).toBeDefined();
    expect(lidPanelItem).toBeDefined();
    expect(straightBattenItem).toBeDefined();
    expect(lockingSetItem).toBeDefined();

    if (
      !sideItem ||
      !endItem ||
      !bottomItem ||
      !handleItem ||
      !endCapItem ||
      !lidPanelItem ||
      !straightBattenItem ||
      !lockingSetItem
    ) {
      return;
    }

    // 1. Long sides
    expect(sideItem.id).toBe('side');
    expect(sideItem.name).toBe('Long sides');
    expect(sideItem.quantity).toBe(2);
    expect(sideItem.dimensions).toEqual({ length: 600, width: 238, thickness: 18 });
    expect(sideItem.notes).toContain(
      'Cut housing dados for both inset end walls after preparing the blank.',
    );

    // 2. End walls
    expect(endItem.id).toBe('end-wall');
    expect(endItem.name).toBe('End walls');
    expect(endItem.quantity).toBe(2);
    expect(endItem.dimensions).toEqual({ length: 270, width: 238, thickness: 18 });
    expect(endItem.notes).toContain('Includes the housed portion entering both side-board dados.');

    // 3. Bottom
    expect(bottomItem.id).toBe('bottom');
    expect(bottomItem.name).toBe('Bottom');
    expect(bottomItem.quantity).toBe(1);
    expect(bottomItem.dimensions).toEqual({ length: 600, width: 300, thickness: 12 });
    expect(bottomItem.notes).toContain('Full-size bottom fitted beneath the carcass.');

    // 4. Grab handles
    expect(handleItem.id).toBe('handle');
    expect(handleItem.name).toBe('Grab handles');
    expect(handleItem.quantity).toBe(2);
    expect(handleItem.dimensions).toEqual({ length: 264, width: 72, thickness: 36 });
    expect(handleItem.notes).toContain('Fit between the long sides at the two inset end bays.');

    // 5. End caps
    expect(endCapItem.id).toBe('end-cap');
    expect(endCapItem.name).toBe('End caps');
    expect(endCapItem.quantity).toBe(2);
    expect(endCapItem.dimensions).toEqual({ length: 300, width: 84, thickness: 18 });
    expect(endCapItem.notes).toEqual([
      'Stop-end cap keeps a square inner edge.',
      'Locking-end cap receives the captured-wedge bevel.',
    ]);

    // 6. Lid panel
    expect(lidPanelItem.id).toBe('lid-panel');
    expect(lidPanelItem.name).toBe('Lid panel');
    expect(lidPanelItem.quantity).toBe(1);
    expect(lidPanelItem.dimensions).toEqual({ length: 458, width: 260, thickness: 12 });
    expect(lidPanelItem.notes).toContain(
      'Final longitudinal fit is governed by locked overlap and release travel.',
    );

    // 7. Straight lid batten
    expect(straightBattenItem.id).toBe('straight-lid-batten');
    expect(straightBattenItem.name).toBe('Straight lid batten');
    expect(straightBattenItem.quantity).toBe(1);
    expect(straightBattenItem.dimensions).toEqual({ length: 296, width: 42, thickness: 18 });
    expect(straightBattenItem.notes).toContain('Stop-end lid batten.');

    // 8. Locking batten + wedge blank
    expect(lockingSetItem.id).toBe('locking-set-blank');
    expect(lockingSetItem.name).toBe('Locking batten + wedge blank');
    expect(lockingSetItem.quantity).toBe(1);
    expect(lockingSetItem.dimensions).toEqual({ length: 332, width: 53, thickness: 18 });
    expect(lockingSetItem.notes).toContain(
      'This single blank is machined to produce both the tapered locking lid batten and the captured wedge. The wedge is deliberately left overlength for final fitting.',
    );
    expect(lockingSetItem.lockingSet).toBeDefined();
    expect(lockingSetItem.lockingSet?.workingLength).toBe(296);
    expect(lockingSetItem.lockingSet?.wedgeOverlength).toBe(36);
    expect(lockingSetItem.lockingSet?.taperAngleDegrees).toBe(2);
    expect(lockingSetItem.lockingSet?.bevelAngleDegrees).toBe(10);
    expect(lockingSetItem.lockingSet?.combinedWidth).toBe(53);
  });

  it('calculates correct cut-list summary metrics (8 items, 12 blanks, 13 finished parts)', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cutList = createCutList(result.geometry);

    expect(cutList.summary.lineItemCount).toBe(8);
    expect(cutList.summary.stockBlankCount).toBe(12);
    expect(cutList.summary.finishedPartCount).toBe(13);
  });

  it('maps dimensions directly from authoritative geometry', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cutList = createCutList(result.geometry);

    expect(cutList.items.find((i) => i.id === 'side')?.dimensions).toEqual(
      result.geometry.box.parts.side.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'end-wall')?.dimensions).toEqual(
      result.geometry.box.parts.end.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'bottom')?.dimensions).toEqual(
      result.geometry.box.parts.bottom.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'handle')?.dimensions).toEqual(
      result.geometry.box.parts.handle.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'end-cap')?.dimensions).toEqual(
      result.geometry.box.parts.fixedTopBatten.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'lid-panel')?.dimensions).toEqual(
      result.geometry.lid.panel.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'straight-lid-batten')?.dimensions).toEqual(
      result.geometry.lid.straightLidBatten.dimensions,
    );
    expect(cutList.items.find((i) => i.id === 'locking-set-blank')?.dimensions).toEqual(
      result.geometry.lockingMechanism.wedge.blankDimensions,
    );
  });

  it('preserves exact canonical dimensions without premature rounding', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cutList = createCutList(result.geometry);
    const lockingSetItem = cutList.items.find((i) => i.id === 'locking-set-blank');
    expect(lockingSetItem?.dimensions.width).toBe(53);
  });

  it('produces identical pure models regardless of unit system selection', () => {
    const metricDesign = createDefaultToolboxDesign();
    const imperialDesign = setDesignUnitSystem(createDefaultToolboxDesign(), 'imperial');

    const metricGeo = calculateToolboxGeometry(metricDesign);
    const imperialGeo = calculateToolboxGeometry(imperialDesign);

    expect(metricGeo.ok).toBe(true);
    expect(imperialGeo.ok).toBe(true);
    if (!metricGeo.ok || !imperialGeo.ok) return;

    const metricCutList = createCutList(metricGeo.geometry);
    const imperialCutList = createCutList(imperialGeo.geometry);

    expect(metricCutList).toEqual(imperialCutList);
  });

  it('produces identical cut lists regardless of wood species selection', () => {
    const designPine = createDefaultToolboxDesign();
    const designOak = { ...createDefaultToolboxDesign(), wood: { id: 'white-oak' } };
    const designAsh = { ...createDefaultToolboxDesign(), wood: { id: 'ash' } };

    const geoPine = calculateToolboxGeometry(designPine);
    const geoOak = calculateToolboxGeometry(designOak);
    const geoAsh = calculateToolboxGeometry(designAsh);

    expect(geoPine.ok && geoOak.ok && geoAsh.ok).toBe(true);
    if (!geoPine.ok || !geoOak.ok || !geoAsh.ok) return;

    const cutListPine = createCutList(geoPine.geometry);
    const cutListOak = createCutList(geoOak.geometry);
    const cutListAsh = createCutList(geoAsh.geometry);

    expect(cutListPine).toEqual(cutListOak);
    expect(cutListPine).toEqual(cutListAsh);
  });

  it('does not mutate input geometry or design', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const geometryBefore = JSON.parse(JSON.stringify(result.geometry));
    const cutList = createCutList(result.geometry);
    expect(cutList).toBeDefined();
    expect(result.geometry).toEqual(geometryBefore);
  });
});
