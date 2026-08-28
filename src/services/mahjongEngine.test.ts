import { describe, expect, it } from 'vitest';
import {
  canTilesMatch,
  doTilesOverlap2D,
  generateSolvableDeal,
  getAvailableMatches,
  getFreeTiles,
  isLeftBlocked,
  isRightBlocked,
  isTileCovered,
  isTileFree,
  mahjongLayouts,
  shuffleRemainingTiles,
  type PlacedTile,
} from './mahjongEngine';

describe('Mahjong Solitaire Geometry & Free-Tile Rules', () => {
  it('correctly calculates 2D bounding overlap', () => {
    // Exactly overlapping
    expect(doTilesOverlap2D(4, 4, 4, 4)).toBe(true);
    // Half-tile offset overlap (distance < 2)
    expect(doTilesOverlap2D(4, 4, 5, 5)).toBe(true);
    // Just touching at distance 2 (not overlapping top face)
    expect(doTilesOverlap2D(4, 4, 6, 4)).toBe(false);
    expect(doTilesOverlap2D(4, 4, 4, 6)).toBe(false);
  });

  it('detects when a tile is covered by a higher layer tile', () => {
    const baseTile: PlacedTile = {
      instanceId: 't1',
      identityId: 'suit1_1',
      positionId: 'p1',
      x: 4,
      y: 4,
      z: 0,
      active: true,
    };

    const coveringTile: PlacedTile = {
      instanceId: 't2',
      identityId: 'suit1_2',
      positionId: 'p2',
      x: 5,
      y: 5,
      z: 1, // Higher layer
      active: true,
    };

    const sameLayerTile: PlacedTile = {
      instanceId: 't3',
      identityId: 'suit1_3',
      positionId: 'p3',
      x: 4,
      y: 4,
      z: 0, // Same layer
      active: true,
    };

    expect(isTileCovered(baseTile, [baseTile, coveringTile])).toBe(true);
    expect(isTileCovered(baseTile, [baseTile, sameLayerTile])).toBe(false);
  });

  it('detects left and right blockers at the same layer', () => {
    const center: PlacedTile = {
      instanceId: 'center',
      identityId: 'suit1_1',
      positionId: 'p_c',
      x: 4,
      y: 4,
      z: 0,
      active: true,
    };

    const left: PlacedTile = {
      instanceId: 'left',
      identityId: 'suit1_2',
      positionId: 'p_l',
      x: 2, // x - 2
      y: 4,
      z: 0,
      active: true,
    };

    const right: PlacedTile = {
      instanceId: 'right',
      identityId: 'suit1_3',
      positionId: 'p_r',
      x: 6, // x + 2
      y: 4,
      z: 0,
      active: true,
    };

    expect(isLeftBlocked(center, [center, left])).toBe(true);
    expect(isRightBlocked(center, [center, left])).toBe(false);

    expect(isRightBlocked(center, [center, right])).toBe(true);
    expect(isLeftBlocked(center, [center, right])).toBe(false);

    // Free when only one side is blocked
    expect(isTileFree(center, [center, left])).toBe(true);
    expect(isTileFree(center, [center, right])).toBe(true);

    // Blocked when BOTH sides are blocked
    expect(isTileFree(center, [center, left, right])).toBe(false);
  });
});

describe('Mahjong Solitaire Matching Rules', () => {
  it('matches identical normal suit tiles', () => {
    const t1: PlacedTile = { instanceId: '1', identityId: 'suit1_1', positionId: 'p1', x: 0, y: 0, z: 0, active: true };
    const t2: PlacedTile = { instanceId: '2', identityId: 'suit1_1', positionId: 'p2', x: 2, y: 0, z: 0, active: true };
    const t3: PlacedTile = { instanceId: '3', identityId: 'suit1_2', positionId: 'p3', x: 4, y: 0, z: 0, active: true };

    expect(canTilesMatch(t1, t2)).toBe(true);
    expect(canTilesMatch(t1, t3)).toBe(false);
    expect(canTilesMatch(t1, t1)).toBe(false); // Cannot match itself
  });

  it('matches wild flowers with any other flower', () => {
    const f1: PlacedTile = { instanceId: '1', identityId: 'flower_1', positionId: 'p1', x: 0, y: 0, z: 0, active: true };
    const f2: PlacedTile = { instanceId: '2', identityId: 'flower_3', positionId: 'p2', x: 2, y: 0, z: 0, active: true };
    const normal: PlacedTile = { instanceId: '3', identityId: 'suit1_1', positionId: 'p3', x: 4, y: 0, z: 0, active: true };

    expect(canTilesMatch(f1, f2)).toBe(true);
    expect(canTilesMatch(f1, normal)).toBe(false);
  });

  it('matches wild seasons with any other season', () => {
    const s1: PlacedTile = { instanceId: '1', identityId: 'season_1', positionId: 'p1', x: 0, y: 0, z: 0, active: true };
    const s2: PlacedTile = { instanceId: '2', identityId: 'season_4', positionId: 'p2', x: 2, y: 0, z: 0, active: true };

    expect(canTilesMatch(s1, s2)).toBe(true);
  });
});

describe('12 Curated Mahjong Layouts Validation', () => {
  it('validates every layout has an even tile count and valid coordinates', () => {
    expect(mahjongLayouts).toHaveLength(12);

    mahjongLayouts.forEach((layout) => {
      expect(layout.positions.length).toBe(layout.tileCount);
      expect(layout.tileCount % 2).toBe(0);

      // Check unique position IDs
      const ids = new Set(layout.positions.map((p) => p.id));
      expect(ids.size).toBe(layout.positions.length);

      // Check camera bounds containment
      layout.positions.forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(layout.cameraBounds.minX);
        expect(p.x + 2).toBeLessThanOrEqual(layout.cameraBounds.maxX);
        expect(p.y).toBeGreaterThanOrEqual(layout.cameraBounds.minY);
        expect(p.y + 2).toBeLessThanOrEqual(layout.cameraBounds.maxY);
      });
    });
  });

  it('generates guaranteed-solvable starting deals for all layouts', () => {
    mahjongLayouts.forEach((layout) => {
      const deal = generateSolvableDeal(layout, `seed_${layout.stage}`);
      expect(deal.length).toBe(layout.tileCount);

      const free = getFreeTiles(deal);
      expect(free.length).toBeGreaterThanOrEqual(2);

      const matches = getAvailableMatches(deal);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('supports dead-end recovery through solvable reshuffle', () => {
    const layout = mahjongLayouts[0]; // Tea Tray (24 tiles)
    const deal = generateSolvableDeal(layout, 'test_deadend');

    const shuffled = shuffleRemainingTiles(deal, 'reshuffle_seed');
    expect(shuffled.length).toBe(deal.length);
    expect(getAvailableMatches(shuffled).length).toBeGreaterThanOrEqual(1);
  });
});
