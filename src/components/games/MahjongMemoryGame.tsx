import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, HelpCircle, Sparkles } from 'lucide-react';
import type { GameDifficultyProfile, GameRoundResult } from '../../types';
import {
  chooseFreshItems,
  journeyItems,
  profileForStage,
  shuffle,
  type JourneyItem,
  type LocalizedText,
} from '../../services/journeyEngine';
import { audioManager } from '../../services/audioManager';

interface MahjongMemoryGameProps {
  stage: number;
  language: keyof LocalizedText;
  recentVariantIds: string[];
  onRoundComplete: (result: GameRoundResult) => void;
  onUseHint?: () => void;
}

interface TileInstance {
  instanceId: string;
  item: JourneyItem;
  cleared: boolean;
  flipped: boolean;
}

export const MahjongMemoryGame: React.FC<MahjongMemoryGameProps> = ({
  stage,
  language,
  recentVariantIds,
  onRoundComplete,
  onUseHint,
}) => {
  const profile: GameDifficultyProfile = profileForStage('mahjong_memory', stage);
  const mode = profile.mode || 'visible-match';
  const previewDuration = profile.previewDurationMs || 0;
  const shuffleCount = profile.shuffleCount || 0;

  const [phase, setPhase] = useState<'preview' | 'swapping' | 'playing'>('preview');
  const [tiles, setTiles] = useState<TileInstance[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedPairIds, setHintedPairIds] = useState<string[]>([]);
  const [swappingIndices, setSwappingIndices] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(Math.ceil(previewDuration / 1000));

  const roundStartedRef = useRef(Date.now());
  const previewTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Initialize Board
  useEffect(() => {
    const pairCount = profile.pairCount || 3;
    const selectedItems = chooseFreshItems(pairCount, recentVariantIds, journeyItems);

    const generatedTiles: TileInstance[] = [];
    selectedItems.forEach((item, idx) => {
      generatedTiles.push({
        instanceId: `${item.id}-a-${idx}`,
        item,
        cleared: false,
        flipped: mode === 'visible-match',
      });
      generatedTiles.push({
        instanceId: `${item.id}-b-${idx}`,
        item,
        cleared: false,
        flipped: mode === 'visible-match',
      });
    });

    const randomized = shuffle(generatedTiles);
    setTiles(randomized);
    setSelectedIndices([]);
    setMistakes(0);
    setHintsUsed(0);
    setHintedPairIds([]);
    setSwappingIndices([]);

    if (mode === 'visible-match') {
      setPhase('playing');
      roundStartedRef.current = Date.now();
    } else {
      setPhase('preview');
      setTimeRemaining(Math.ceil(previewDuration / 1000));

      // Show preview
      setTiles(randomized.map((t) => ({ ...t, flipped: true })));

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);

      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      previewTimerRef.current = window.setTimeout(() => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Hide tiles
        setTiles((current) => current.map((t) => ({ ...t, flipped: false })));

        if (shuffleCount > 0) {
          executeTileSwaps(randomized, shuffleCount);
        } else {
          setPhase('playing');
          roundStartedRef.current = Date.now();
        }
      }, previewDuration);
    }

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [stage, recentVariantIds]);

  // Execute visible gentle tile swaps
  const executeTileSwaps = (board: TileInstance[], totalSwaps: number) => {
    setPhase('swapping');
    let currentBoard = [...board].map((t) => ({ ...t, flipped: false }));

    const performSwap = (swapNum: number) => {
      if (swapNum >= totalSwaps) {
        setSwappingIndices([]);
        setPhase('playing');
        roundStartedRef.current = Date.now();
        return;
      }

      const idx1 = Math.floor(Math.random() * currentBoard.length);
      let idx2 = Math.floor(Math.random() * currentBoard.length);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * currentBoard.length);
      }

      setSwappingIndices([idx1, idx2]);
      audioManager.play('tap');

      setTimeout(() => {
        const nextBoard = [...currentBoard];
        const temp = nextBoard[idx1];
        nextBoard[idx1] = nextBoard[idx2];
        nextBoard[idx2] = temp;
        currentBoard = nextBoard;
        setTiles(nextBoard);

        setTimeout(() => {
          performSwap(swapNum + 1);
        }, 600);
      }, 700);
    };

    setTimeout(() => performSwap(0), 400);
  };

  const handleTileClick = (index: number) => {
    if (phase !== 'playing') return;
    const tile = tiles[index];
    if (tile.cleared || selectedIndices.includes(index) || selectedIndices.length >= 2) return;

    audioManager.play('tile-pick');

    if (mode !== 'visible-match') {
      setTiles((prev) =>
        prev.map((t, idx) => (idx === index ? { ...t, flipped: true } : t))
      );
    }

    const nextSelected = [...selectedIndices, index];
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      const [firstIdx, secondIdx] = nextSelected;
      const firstTile = tiles[firstIdx];
      const secondTile = tiles[secondIdx];

      if (firstTile.item.id === secondTile.item.id) {
        // MATCH!
        audioManager.play('pair-match');
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...t, cleared: true } : t
            )
          );
          setSelectedIndices([]);

          // Check if board complete
          const remainingUncleared = tiles.filter(
            (t, idx) => !t.cleared && idx !== firstIdx && idx !== secondIdx
          );

          if (remainingUncleared.length === 0) {
            audioManager.play('round-complete');
            setTimeout(() => {
              const responseMs = Math.max(300, Date.now() - roundStartedRef.current);
              onRoundComplete({
                round: 1,
                correct: true,
                responseMs,
                mistakes,
                hintsUsed,
                contentVariantId: `mahjong:${stage}:${tiles.map((t) => t.item.id).join(',')}`,
                mode,
                tileCount: tiles.length,
                pairCount: tiles.length / 2,
                previewDurationMs: previewDuration,
                shuffleCount,
              });
            }, 500);
          }
        }, 350);
      } else {
        // Mismatch
        setMistakes((prev) => prev + 1);
        audioManager.play('gentle-nudge');
        setTimeout(() => {
          if (mode !== 'visible-match') {
            setTiles((prev) =>
              prev.map((t, idx) =>
                idx === firstIdx || idx === secondIdx ? { ...t, flipped: false } : t
              )
            );
          }
          setSelectedIndices([]);
        }, 900);
      }
    }
  };

  const handleHint = () => {
    if (phase !== 'playing') return;
    setHintsUsed((prev) => prev + 1);
    onUseHint?.();
    audioManager.play('hint');

    // Find first uncleared pair
    const uncleared = tiles.filter((t) => !t.cleared);
    if (!uncleared.length) return;
    const targetItemId = uncleared[0].item.id;

    setHintedPairIds([targetItemId]);

    if (mode !== 'visible-match') {
      setTiles((prev) =>
        prev.map((t) => (t.item.id === targetItemId && !t.cleared ? { ...t, flipped: true } : t))
      );
      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) =>
            t.item.id === targetItemId && !t.cleared && !selectedIndices.includes(tiles.indexOf(t))
              ? { ...t, flipped: false }
              : t
          )
        );
        setHintedPairIds([]);
      }, 2000);
    } else {
      setTimeout(() => setHintedPairIds([]), 2500);
    }
  };

  const gridColsClass =
    tiles.length <= 8
      ? 'grid-cols-2 sm:grid-cols-4'
      : tiles.length <= 12
      ? 'grid-cols-3 sm:grid-cols-4'
      : tiles.length <= 16
      ? 'grid-cols-4 sm:grid-cols-4 md:grid-cols-4'
      : 'grid-cols-4 sm:grid-cols-5';

  const clearedPairsCount = tiles.filter((t) => t.cleared).length / 2;
  const totalPairsCount = tiles.length / 2;

  return (
    <div className="space-y-4">
      {/* Top status bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-900 font-black text-sm">
            🀄
          </span>
          <div>
            <span className="block text-base font-black text-stone-900">
              {mode === 'visible-match'
                ? 'Visible Tile Matching'
                : mode === 'hidden-match'
                ? 'Memory Tile Recall'
                : 'Shuffled Tile Memory'}
            </span>
            <span className="block text-xs font-bold text-teal-800">
              {clearedPairsCount} of {totalPairsCount} pairs matched
            </span>
          </div>
        </div>

        {phase === 'playing' && (
          <button
            type="button"
            onClick={handleHint}
            className="flex min-h-11 items-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 font-black text-amber-900 shadow-sm hover:bg-amber-100 transition"
          >
            <HelpCircle className="h-4 w-4" /> Hint
          </button>
        )}
      </div>

      {/* Preview Countdown Banner */}
      {phase === 'preview' && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center animate-fadeIn shadow-sm">
          <div className="flex items-center justify-center gap-2 text-amber-900 font-black text-lg">
            <Eye className="h-5 w-5" /> Remember the tile positions ({timeRemaining}s)
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-600 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeRemaining / Math.ceil(previewDuration / 1000)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Swapping Notice */}
      {phase === 'swapping' && (
        <div className="rounded-2xl border-2 border-teal-300 bg-teal-50 p-4 text-center animate-fadeIn shadow-sm">
          <div className="flex items-center justify-center gap-2 text-teal-900 font-black text-lg">
            <Sparkles className="h-5 w-5 animate-spin" /> Watch the tiles swap carefully!
          </div>
        </div>
      )}

      {/* Tile Grid */}
      <div className={`grid gap-3 ${gridColsClass}`}>
        {tiles.map((tile, idx) => {
          const isSelected = selectedIndices.includes(idx);
          const isHinted = hintedPairIds.includes(tile.item.id);
          const isSwapping = swappingIndices.includes(idx);
          const isFaceUp = tile.flipped || mode === 'visible-match';

          if (tile.cleared) {
            return (
              <div
                key={tile.instanceId}
                className="aspect-[3/4] min-h-[96px] rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/40 p-2 flex flex-col items-center justify-center opacity-40"
              >
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            );
          }

          return (
            <button
              key={tile.instanceId}
              type="button"
              disabled={phase !== 'playing'}
              onClick={() => handleTileClick(idx)}
              className={`relative aspect-[3/4] min-h-[96px] rounded-2xl border-b-4 border-2 p-2.5 text-center transition-all duration-200 flex flex-col items-center justify-between select-none ${
                isSwapping
                  ? 'border-amber-400 bg-amber-100 scale-105 shadow-xl ring-4 ring-amber-300'
                  : isSelected
                  ? 'border-teal-700 bg-teal-50 -translate-y-1 shadow-lg ring-4 ring-teal-300'
                  : isHinted
                  ? 'border-amber-500 bg-amber-50 -translate-y-1 shadow-lg ring-4 ring-amber-300 animate-pulse'
                  : isFaceUp
                  ? 'border-stone-300 bg-gradient-to-b from-stone-50 to-white hover:border-teal-500 hover:-translate-y-0.5 shadow-md active:translate-y-0'
                  : 'border-teal-900 bg-gradient-to-br from-teal-800 to-emerald-950 text-white hover:brightness-110 shadow-md active:translate-y-0'
              }`}
              aria-label={isFaceUp ? tile.item.label[language] : 'Hidden Mahjong tile'}
            >
              {isFaceUp ? (
                <>
                  <div className="flex w-full items-center justify-between text-[10px] font-black text-stone-400">
                    <span>🀄</span>
                    <span className="uppercase">{tile.item.category || 'NER'}</span>
                  </div>

                  <span className="text-4xl sm:text-5xl my-auto drop-shadow-sm">
                    {tile.item.emoji}
                  </span>

                  <span className="block w-full truncate text-[11px] font-black text-stone-800 leading-tight">
                    {tile.item.label[language]}
                  </span>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <span className="text-2xl font-black opacity-80">স্মৃ</span>
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-teal-200">
                    Tile
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
