import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Compass,
  CornerUpLeft,
  Flower2,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import {
  canTilesMatch,
  generateSolvableDeal,
  getAvailableMatches,
  getCoveringTiles,
  getIdentity,
  getLayoutForStage,
  getLeftBlockers,
  getRightBlockers,
  isLeftBlocked,
  isRightBlocked,
  isTileCovered,
  isTileFree,
  mahjongLayouts,
  shuffleRemainingTiles,
  type MahjongMove,
  type MahjongSavedGame,
  type MahjongTableFelt,
  type MahjongThemeId,
  type PlacedTile,
} from '../../services/mahjongEngine';
import { TileArtwork } from '../../services/mahjongTilesSvg';
import type { GameRoundResult, JourneyGameSession } from '../../types';

interface MahjongSolitaireGameProps {
  initialStage?: number;
  onBack: () => void;
  onComplete: (session: JourneyGameSession) => Promise<void>;
  savedGame?: MahjongSavedGame | null;
  onSaveGame?: (save: MahjongSavedGame) => Promise<void>;
  onClearSave?: () => Promise<void>;
}

type MenuKey = 'game' | 'move' | 'view' | 'theme' | 'help' | null;

export const MahjongSolitaireGame: React.FC<MahjongSolitaireGameProps> = ({
  initialStage = 1,
  onBack,
  onComplete,
  savedGame,
  onSaveGame,
  onClearSave,
}) => {
  const {
    currentPatient,
    selectedLanguage,
    setGameActive,
    readAloud,
    speechSupported,
    gameProgress,
  } = useApp();

  // State
  const [stage, setStage] = useState<number>(savedGame?.stage || initialStage);
  const [themeId, setThemeId] = useState<MahjongThemeId>(savedGame?.themeId || 'ner-heritage');
  const [tableFelt, setTableFelt] = useState<MahjongTableFelt>(savedGame?.tableFelt || 'sand');
  const [showFreeHighlights, setShowFreeHighlights] = useState<boolean>(true);
  const [largePrint, setLargePrint] = useState<boolean>(false);

  const layout = useMemo(() => getLayoutForStage(stage), [stage]);
  const [dealSeed, setDealSeed] = useState<string>(savedGame?.dealSeed || `${Date.now()}`);

  const [tiles, setTiles] = useState<PlacedTile[]>(() => {
    if (savedGame && savedGame.stage === stage && savedGame.tiles.length) {
      return savedGame.tiles;
    }
    return generateSolvableDeal(layout, dealSeed);
  });

  const [selectedTileId, setSelectedTileId] = useState<string | undefined>(undefined);
  const [moveHistory, setMoveHistory] = useState<MahjongMove[]>(savedGame?.moveHistory || []);
  const [pairsCleared, setPairsCleared] = useState<number>(savedGame?.pairsCleared || 0);

  // Metrics
  const [hintCount, setHintCount] = useState<number>(savedGame?.hintCount || 0);
  const [mismatchCount, setMismatchCount] = useState<number>(savedGame?.mismatchCount || 0);
  const [blockedTapCount, setBlockedTapCount] = useState<number>(savedGame?.blockedTapCount || 0);
  const [shuffleCount, setShuffleCount] = useState<number>(savedGame?.shuffleCount || 0);
  const [startedAt] = useState<string>(savedGame?.startedAt || new Date().toISOString());

  // UI state
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showStageModal, setShowStageModal] = useState<boolean>(false);
  const [showNoMovesModal, setShowNoMovesModal] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [blockedHighlights, setBlockedHighlights] = useState<{
    targetId: string;
    covererIds: string[];
    leftIds: string[];
    rightIds: string[];
  } | null>(null);
  const [hintedPair, setHintedPair] = useState<[string, string] | null>(null);
  const [matchingAnimation, setMatchingAnimation] = useState<[string, string] | null>(null);

  // Camera & Viewport
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGameActive(true);
    return () => setGameActive(false);
  }, [setGameActive]);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Blocked outline timer
  useEffect(() => {
    if (!blockedHighlights) return;
    const t = setTimeout(() => setBlockedHighlights(null), 2500);
    return () => clearTimeout(t);
  }, [blockedHighlights]);

  // Hint clear timer
  useEffect(() => {
    if (!hintedPair) return;
    const t = setTimeout(() => setHintedPair(null), 4000);
    return () => clearTimeout(t);
  }, [hintedPair]);

  // Compute active tiles and matches
  const activeTiles = useMemo(() => tiles.filter((t) => t.active), [tiles]);
  const availableMatches = useMemo(() => getAvailableMatches(tiles), [tiles]);

  // Check for dead ends
  useEffect(() => {
    if (activeTiles.length > 0 && availableMatches.length === 0 && !matchingAnimation) {
      const timer = setTimeout(() => {
        setShowNoMovesModal(true);
        audioManager.play('gentle-nudge');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTiles.length, availableMatches.length, matchingAnimation]);

  // Auto-save debounced
  useEffect(() => {
    if (!currentPatient || isCompleted || activeTiles.length === 0) return;
    const saveState: MahjongSavedGame = {
      patientId: currentPatient.id,
      stage,
      layoutId: layout.id,
      dealSeed,
      themeId,
      tableFelt,
      tiles,
      moveHistory,
      hintCount,
      mismatchCount,
      blockedTapCount,
      shuffleCount,
      pairsCleared,
      activeDurationMs: Math.max(1000, Date.now() - new Date(startedAt).getTime()),
      startedAt,
      lastSavedAt: new Date().toISOString(),
      revision: Date.now(),
    };

    try {
      localStorage.setItem(`smriti-mahjong-save-${currentPatient.id}`, JSON.stringify(saveState));
    } catch {
      // local storage quota fallback
    }

    if (onSaveGame) {
      const timer = setTimeout(() => {
        void onSaveGame(saveState).catch(() => undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    currentPatient,
    stage,
    layout.id,
    dealSeed,
    themeId,
    tableFelt,
    tiles,
    moveHistory,
    hintCount,
    mismatchCount,
    blockedTapCount,
    shuffleCount,
    pairsCleared,
    startedAt,
    isCompleted,
    activeTiles.length,
    onSaveGame,
  ]);

  // Handle tile click
  const handleTileClick = (tile: PlacedTile) => {
    if (!tile.active || matchingAnimation) return;

    // Check if free
    if (!isTileFree(tile, activeTiles)) {
      setBlockedTapCount((prev) => prev + 1);
      audioManager.play('gentle-nudge');

      const covered = isTileCovered(tile, activeTiles);
      const leftB = isLeftBlocked(tile, activeTiles);
      const rightB = isRightBlocked(tile, activeTiles);

      const coverers = getCoveringTiles(tile, activeTiles).map((t) => t.instanceId);
      const leftBlockers = getLeftBlockers(tile, activeTiles).map((t) => t.instanceId);
      const rightBlockers = getRightBlockers(tile, activeTiles).map((t) => t.instanceId);

      setBlockedHighlights({
        targetId: tile.instanceId,
        covererIds: coverers,
        leftIds: leftBlockers,
        rightIds: rightBlockers,
      });

      if (covered) {
        setToastMessage('This tile is covered from above. Clear the top layer first.');
      } else if (leftB && rightB) {
        setToastMessage('This tile is blocked on both sides. Free at least one side.');
      }
      return;
    }

    // Play tile pick click
    audioManager.play('tile-pick');

    // If no tile currently selected
    if (!selectedTileId) {
      setSelectedTileId(tile.instanceId);
      return;
    }

    // If clicking same tile, unselect
    if (selectedTileId === tile.instanceId) {
      setSelectedTileId(undefined);
      return;
    }

    // Second tile selected - check match
    const firstTile = tiles.find((t) => t.instanceId === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(tile.instanceId);
      return;
    }

    if (canTilesMatch(firstTile, tile)) {
      // MATCH SUCCESS
      setMatchingAnimation([firstTile.instanceId, tile.instanceId]);
      audioManager.play('pair-match');

      setTimeout(() => {
        // Record move
        const move: MahjongMove = {
          type: 'match',
          removedPair: [firstTile, tile],
          timestamp: new Date().toISOString(),
        };

        const nextTiles = tiles.map((t) => {
          if (t.instanceId === firstTile.instanceId || t.instanceId === tile.instanceId) {
            return { ...t, active: false };
          }
          return t;
        });

        setTiles(nextTiles);
        setMoveHistory((prev) => [...prev, move]);
        setPairsCleared((prev) => prev + 1);
        setSelectedTileId(undefined);
        setMatchingAnimation(null);

        // Check board completion
        const remaining = nextTiles.filter((t) => t.active);
        if (remaining.length === 0) {
          handleBoardComplete(nextTiles);
        }
      }, 250);
    } else {
      // MISMATCH
      setMismatchCount((prev) => prev + 1);
      audioManager.play('gentle-nudge');
      setToastMessage('These tiles do not match. Try another free pair.');
      setSelectedTileId(undefined);
    }
  };

  // Completion handler
  const handleBoardComplete = (_finalTiles: PlacedTile[]) => {
    setIsCompleted(true);
    audioManager.play('journey-complete');

    if (onClearSave && currentPatient) {
      void onClearSave();
      localStorage.removeItem(`smriti-mahjong-save-${currentPatient.id}`);
    }

    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
    );

    const roundResults: GameRoundResult[] = [
      {
        round: 1,
        correct: true,
        responseMs: durationSeconds * 1000,
        mistakes: mismatchCount,
        hintsUsed: hintCount,
        contentVariantId: `mahjong-stage-${stage}-${layout.id}`,
      },
    ];

    const session: JourneyGameSession = {
      patientId: currentPatient?.id || 'patient',
      gameType: 'mahjong_memory',
      domain: 'visual-memory',
      stage,
      accuracy: Math.max(70, Math.round(100 - mismatchCount * 3)),
      durationSeconds,
      memoryLoad: layout.maxLayers + 2,
      mistakes: mismatchCount,
      hintsUsed: hintCount,
      medianResponseMs: Math.round((durationSeconds * 1000) / (layout.tileCount / 2)),
      responseVariabilityMs: 200,
      completionStatus: 'completed',
      contentVariantIds: [`mahjong-${layout.id}-${dealSeed}`],
      roundResults,
      startedAt,
      completedAt: new Date().toISOString(),
      clientEventId: crypto.randomUUID(),
      stageSource: 'recommended',
    };

    void onComplete(session);
  };

  // Undo last move
  const handleUndo = () => {
    if (!moveHistory.length || matchingAnimation) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    audioManager.play('tile-reveal');

    if (lastMove.type === 'match' && lastMove.removedPair) {
      const [t1, t2] = lastMove.removedPair;
      setTiles((prev) =>
        prev.map((t) => {
          if (t.instanceId === t1.instanceId || t.instanceId === t2.instanceId) {
            return { ...t, active: true };
          }
          return t;
        })
      );
      setPairsCleared((prev) => Math.max(0, prev - 1));
    } else if (lastMove.type === 'shuffle' && lastMove.previousTilesState) {
      setTiles(lastMove.previousTilesState);
    }

    setMoveHistory((prev) => prev.slice(0, -1));
    setSelectedTileId(undefined);
    setShowNoMovesModal(false);
  };

  // Hint
  const handleHint = () => {
    if (!availableMatches.length) {
      setToastMessage('No free matches available right now. Tap Shuffle to rearrange.');
      return;
    }
    setHintCount((prev) => prev + 1);
    audioManager.play('hint');

    const match = availableMatches[0];
    setHintedPair([match[0].instanceId, match[1].instanceId]);
    const id1 = getIdentity(match[0].identityId);
    setToastMessage(`Hint: Match available: ${id1.nerName[selectedLanguage] || id1.nerName.English}`);
  };

  // Shuffle remaining active tiles
  const handleShuffle = () => {
    setShuffleCount((prev) => prev + 1);
    audioManager.play('tap');

    const move: MahjongMove = {
      type: 'shuffle',
      previousTilesState: [...tiles],
      timestamp: new Date().toISOString(),
    };

    const shuffled = shuffleRemainingTiles(tiles, `${Date.now()}`);
    setTiles(shuffled);
    setMoveHistory((prev) => [...prev, move]);
    setSelectedTileId(undefined);
    setShowNoMovesModal(false);
    setToastMessage('Tiles rearranged! Free matches are now available.');
  };

  // Restart deal
  const handleRestartDeal = () => {
    setTiles(generateSolvableDeal(layout, dealSeed));
    setSelectedTileId(undefined);
    setMoveHistory([]);
    setPairsCleared(0);
    setShowNoMovesModal(false);
    setIsPaused(false);
    audioManager.play('tap');
  };

  // New Deal
  const handleNewDeal = (newStage: number = stage) => {
    const newSeed = `${Date.now()}`;
    const newLayout = getLayoutForStage(newStage);
    setStage(newStage);
    setDealSeed(newSeed);
    setTiles(generateSolvableDeal(newLayout, newSeed));
    setSelectedTileId(undefined);
    setMoveHistory([]);
    setPairsCleared(0);
    setHintCount(0);
    setMismatchCount(0);
    setBlockedTapCount(0);
    setShuffleCount(0);
    setShowNoMovesModal(false);
    setShowStageModal(false);
    setIsPaused(false);
    setIsCompleted(false);
    audioManager.play('tap');
  };

  // Table felt styling
  const tableFeltClass =
    tableFelt === 'tea-garden'
      ? 'bg-[#1b4332] text-white'
      : tableFelt === 'brahmaputra-dusk'
      ? 'bg-[#1e293b] text-white'
      : tableFelt === 'high-contrast'
      ? 'bg-[#0f172a] text-white'
      : 'bg-[#d8c3a5] text-stone-900'; // Classic Sand felt

  // Tile dimensions
  const tileWidth = 56;
  const tileHeight = 72;
  const halfX = tileWidth / 2;
  const halfY = tileHeight / 2;

  // Board layout bounds
  const boardPixelWidth = (layout.cameraBounds.maxX + 2) * halfX + layout.maxLayers * 6;
  const boardPixelHeight = (layout.cameraBounds.maxY + 2) * halfY + layout.maxLayers * 6;

  // Camera panning handlers
  const onPointerDown = (e: React.PointerEvent) => {
    // Only pan if clicking table background
    if ((e.target as HTMLElement).closest('.mahjong-tile-btn')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex h-[100dvh] flex-col select-none overflow-hidden font-sans ${tableFeltClass}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. VINTAGE TITLE BAR (48px)                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="shrink-0 flex h-12 items-center justify-between border-b border-stone-800/20 bg-gradient-to-b from-[#2d6a4f]/90 to-[#1b4332]/90 px-3 text-white shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-lg shadow-sm text-emerald-950 font-black">
            🀄
          </span>
          <div className="min-w-0 flex items-center gap-2 text-sm font-black">
            <span className="truncate">Smriti Mahjong</span>
            <span className="text-emerald-300">·</span>
            <span className="text-emerald-200 truncate font-semibold">
              Stage {stage}: {layout.name[selectedLanguage] || layout.name.English}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {speechSupported && (
            <button
              onClick={() =>
                readAloud(
                  `Mahjong Solitaire, Stage ${stage}, ${layout.name.English}. ${activeTiles.length} tiles left, ${availableMatches.length} matches available.`
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition"
              aria-label="Read status aloud"
            >
              <Volume2 className="h-4 w-4 text-emerald-100" />
            </button>
          )}
          <button
            onClick={() => setIsPaused(true)}
            className="h-9 px-3 rounded-lg border border-white/20 bg-white/10 text-xs font-bold hover:bg-white/20 transition"
          >
            Pause
          </button>
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-rose-900/80 transition"
            aria-label="Exit Game"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. CLASSIC DROP-DOWN MENU BAR (Desktop 40px)                  */}
      {/* ------------------------------------------------------------- */}
      <nav className="shrink-0 hidden sm:flex h-10 items-center gap-1 border-b border-stone-800/10 bg-white/95 px-3 text-xs font-black text-stone-800 shadow-sm relative z-40">
        {/* Game Menu */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'game' ? null : 'game')}
            className={`px-3 py-1.5 rounded-md hover:bg-stone-200 transition ${
              activeMenu === 'game' ? 'bg-stone-200' : ''
            }`}
          >
            Game
          </button>
          {activeMenu === 'game' && (
            <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-stone-300 bg-white p-1.5 shadow-xl text-xs font-bold text-stone-900">
              <button
                onClick={() => {
                  handleNewDeal();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                New Deal
              </button>
              <button
                onClick={() => {
                  handleRestartDeal();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Restart This Deal
              </button>
              <button
                onClick={() => {
                  setShowStageModal(true);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Choose Stage (1–12)
              </button>
              <hr className="my-1 border-stone-200" />
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onBack();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50"
              >
                Save & Exit
              </button>
            </div>
          )}
        </div>

        {/* Move Menu */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'move' ? null : 'move')}
            className={`px-3 py-1.5 rounded-md hover:bg-stone-200 transition ${
              activeMenu === 'move' ? 'bg-stone-200' : ''
            }`}
          >
            Move
          </button>
          {activeMenu === 'move' && (
            <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-stone-300 bg-white p-1.5 shadow-xl text-xs font-bold text-stone-900">
              <button
                disabled={!moveHistory.length}
                onClick={() => {
                  handleUndo();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 disabled:opacity-40"
              >
                Undo (U)
              </button>
              <button
                onClick={() => {
                  handleHint();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Hint (H)
              </button>
              <button
                onClick={() => {
                  handleShuffle();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Shuffle Remaining
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            className={`px-3 py-1.5 rounded-md hover:bg-stone-200 transition ${
              activeMenu === 'view' ? 'bg-stone-200' : ''
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-stone-300 bg-white p-1.5 shadow-xl text-xs font-bold text-stone-900">
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Fit Board</span>
                <Maximize2 className="h-3.5 w-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  setShowFreeHighlights((v) => !v);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Highlight Free Tiles</span>
                {showFreeHighlights && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
              <button
                onClick={() => {
                  setLargePrint((v) => !v);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Large Print Numbers</span>
                {largePrint && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Menu */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'theme' ? null : 'theme')}
            className={`px-3 py-1.5 rounded-md hover:bg-stone-200 transition ${
              activeMenu === 'theme' ? 'bg-stone-200' : ''
            }`}
          >
            Theme
          </button>
          {activeMenu === 'theme' && (
            <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-stone-300 bg-white p-1.5 shadow-xl text-xs font-bold text-stone-900">
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
                Tile Artwork
              </p>
              <button
                onClick={() => {
                  setThemeId('ner-heritage');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>NER Heritage Tiles</span>
                {themeId === 'ner-heritage' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
              <button
                onClick={() => {
                  setThemeId('classic-ivory');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Classic Ivory Tiles</span>
                {themeId === 'classic-ivory' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
              <hr className="my-1 border-stone-200" />
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
                Table Felt
              </p>
              <button
                onClick={() => {
                  setTableFelt('sand');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Sand Felt</span>
                {tableFelt === 'sand' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
              <button
                onClick={() => {
                  setTableFelt('tea-garden');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Tea Garden Green</span>
                {tableFelt === 'tea-garden' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
              <button
                onClick={() => {
                  setTableFelt('brahmaputra-dusk');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>Brahmaputra Dusk</span>
                {tableFelt === 'brahmaputra-dusk' && (
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                )}
              </button>
              <button
                onClick={() => {
                  setTableFelt('high-contrast');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center justify-between"
              >
                <span>High Contrast Charcoal</span>
                {tableFelt === 'high-contrast' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            className={`px-3 py-1.5 rounded-md hover:bg-stone-200 transition ${
              activeMenu === 'help' ? 'bg-stone-200' : ''
            }`}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-stone-300 bg-white p-1.5 shadow-xl text-xs font-bold text-stone-900">
              <button
                onClick={() => {
                  setShowTutorial(true);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                How to Play (Tutorial)
              </button>
              <button
                onClick={() => {
                  setToastMessage('A tile is free when uncovered and open on its left or right side.');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                What makes a tile free?
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN MAHJONG TABLE AREA (Viewport & 3D Layered Tiles)       */}
      {/* ------------------------------------------------------------- */}
      <main
        ref={viewportRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center p-4"
      >
        {/* Board Canvas with Transformation */}
        <div
          className="relative transition-transform duration-75 origin-center"
          style={{
            width: `${boardPixelWidth}px`,
            height: `${boardPixelHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {tiles.map((tile) => {
            if (!tile.active && !matchingAnimation?.includes(tile.instanceId)) return null;

            const identity = getIdentity(tile.identityId);
            const isFree = isTileFree(tile, activeTiles);
            const isSelected = selectedTileId === tile.instanceId;
            const isHinted = hintedPair?.includes(tile.instanceId);
            const isMatching = matchingAnimation?.includes(tile.instanceId);

            // Blocked outline feedback
            const isTargetBlocked = blockedHighlights?.targetId === tile.instanceId;
            const isCoverer = blockedHighlights?.covererIds.includes(tile.instanceId);
            const isSideBlocker =
              blockedHighlights?.leftIds.includes(tile.instanceId) ||
              blockedHighlights?.rightIds.includes(tile.instanceId);

            // 3D Layer Elevation (each higher z shifts 4px up, 4px right)
            const elevationX = tile.z * 4;
            const elevationY = -tile.z * 4;
            const pixelX = tile.x * halfX + elevationX;
            const pixelY = tile.y * halfY + elevationY;

            const zIndex = tile.z * 100 + Math.floor(tile.y) * 10 + Math.floor(tile.x);

            return (
              <button
                key={tile.instanceId}
                type="button"
                data-instance-id={tile.instanceId}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTileClick(tile);
                }}
                className={`mahjong-tile-btn absolute rounded-lg transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? '-translate-y-2 ring-4 ring-amber-400 ring-offset-2 shadow-2xl scale-105 z-[999]'
                    : isHinted
                    ? 'ring-4 ring-emerald-400 animate-pulse z-[990]'
                    : isMatching
                    ? 'scale-110 opacity-60 z-[999]'
                    : isCoverer
                    ? 'ring-4 ring-sky-500 z-[980]'
                    : isSideBlocker
                    ? 'ring-4 ring-amber-500 z-[980]'
                    : isTargetBlocked
                    ? 'animate-shake z-[980]'
                    : isFree && showFreeHighlights
                    ? 'hover:brightness-105'
                    : 'opacity-90 grayscale-[25%]'
                }`}
                style={{
                  left: `${pixelX}px`,
                  top: `${pixelY}px`,
                  width: `${tileWidth}px`,
                  height: `${tileHeight}px`,
                  zIndex: isSelected || isMatching ? 999 : zIndex,
                }}
                aria-label={`${identity.nerName[selectedLanguage] || identity.nerName.English}, ${
                  isFree ? 'free tile' : 'blocked'
                }, layer ${tile.z + 1}`}
              >
                {/* 3D Tile Bevel Structure */}
                <div className="relative w-full h-full rounded-lg bg-[#fffdfa] border border-[#cbd5e1] shadow-[3px_4px_6px_rgba(0,0,0,0.35),1px_2px_3px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center p-1 overflow-hidden">
                  {/* Subtle 3D Edge Bevel Highlights */}
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-white" />
                  <span className="absolute inset-y-0 left-0 w-[2px] bg-white" />
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#94a3b8]" />
                  <span className="absolute inset-y-0 right-0 w-[3px] bg-[#94a3b8]" />

                  {/* Tile SVG Artwork */}
                  <TileArtwork
                    identity={identity}
                    theme={themeId}
                    largePrint={largePrint}
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Floating Mini Map in corner */}
        <div className="hidden md:block absolute top-4 right-4 z-30 rounded-xl border border-white/20 bg-stone-900/75 p-2 backdrop-blur-md text-white shadow-lg">
          <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Board Overview</p>
          <div className="relative w-28 h-20 bg-stone-800/90 rounded border border-stone-700 overflow-hidden">
            {tiles.map((t) => {
              if (!t.active) return null;
              const px = (t.x / (layout.cameraBounds.maxX || 24)) * 100;
              const py = (t.y / (layout.cameraBounds.maxY || 16)) * 100;
              return (
                <div
                  key={t.instanceId}
                  className={`absolute w-1.5 h-2 rounded-[1px] ${
                    isTileFree(t, activeTiles) ? 'bg-emerald-400' : 'bg-stone-500'
                  }`}
                  style={{ left: `${px}%`, top: `${py}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Floating Educational Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-xs font-black text-amber-950 shadow-xl animate-fadeIn flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Mobile Camera Floating Controls */}
        <div className="sm:hidden absolute bottom-20 right-3 z-30 flex flex-col gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
            className="h-11 w-11 rounded-xl border border-stone-300 bg-white text-stone-800 shadow-md flex items-center justify-center"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="h-11 w-11 rounded-xl border border-stone-300 bg-white text-stone-800 shadow-md flex items-center justify-center"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="h-11 w-11 rounded-xl border border-stone-300 bg-white text-stone-800 shadow-md flex items-center justify-center"
            aria-label="Fit board"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. CLASSIC STATUS STRIP & QUICK ACTION BAR (Bottom)           */}
      {/* ------------------------------------------------------------- */}
      <footer className="shrink-0 border-t border-stone-800/10 bg-white/95 text-stone-900 pb-[env(safe-area-inset-bottom)] shadow-lg z-30">
        {/* Status Strip (Tiles Left, Matches Available, Pairs Cleared - NO Score/Timer!) */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2 text-xs font-bold text-stone-700">
          <div className="flex items-center gap-4">
            <span>
              <strong>{activeTiles.length}</strong> tiles left
            </span>
            <span>·</span>
            <span
              className={
                availableMatches.length > 0
                  ? 'text-emerald-800 font-black'
                  : 'text-amber-800 font-black'
              }
            >
              <strong>{availableMatches.length}</strong> matches available
            </span>
          </div>
          <div>
            <span>
              <strong>{pairsCleared}</strong> pairs cleared
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-around gap-2 px-3 py-2 max-w-xl mx-auto">
          <button
            onClick={handleUndo}
            disabled={!moveHistory.length}
            className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 font-black text-stone-800 hover:bg-stone-100 disabled:opacity-30 transition"
          >
            <CornerUpLeft className="h-4 w-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={handleHint}
            className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 font-black text-amber-900 hover:bg-amber-100 transition"
          >
            <Search className="h-4 w-4 text-amber-700" />
            <span>Hint</span>
          </button>
          <button
            onClick={handleShuffle}
            className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 font-black text-teal-900 hover:bg-teal-100 transition"
          >
            <RefreshCw className="h-4 w-4 text-teal-700" />
            <span>Shuffle</span>
          </button>
          <button
            onClick={() => setShowStageModal(true)}
            className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-100 font-black text-stone-800 hover:bg-stone-200 transition"
          >
            <Compass className="h-4 w-4" />
            <span>Stage</span>
          </button>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODALS & OVERLAYS                                          */}
      {/* ------------------------------------------------------------- */}

      {/* NO MOVES / DEAD END RECOVERY MODAL */}
      {showNoMovesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl animate-fadeIn">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-3">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">No Free Matches Right Now</h2>
            <p className="mt-2 text-sm font-semibold text-stone-600">
              Your choices have closed this path. You can gently rearrange the remaining tiles or
              step back.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleShuffle}
                className="min-h-12 w-full rounded-2xl bg-teal-800 font-black text-white shadow-md hover:bg-teal-900 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Shuffle Remaining Tiles
              </button>
              <button
                disabled={!moveHistory.length}
                onClick={handleUndo}
                className="min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-stone-50 font-black text-stone-800 hover:bg-stone-100 disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                <CornerUpLeft className="h-4 w-4" /> Undo Last Match
              </button>
              <button
                onClick={handleRestartDeal}
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Restart This Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-black text-stone-900 mb-4">Game Paused</h2>
            <div className="space-y-2.5">
              <button
                onClick={() => setIsPaused(false)}
                className="min-h-12 w-full rounded-2xl bg-teal-800 font-black text-white shadow-md hover:bg-teal-900 transition"
              >
                Resume Game
              </button>
              <button
                onClick={() => {
                  setShowTutorial(true);
                  setIsPaused(false);
                }}
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 font-bold text-stone-800 hover:bg-stone-100 transition"
              >
                How to Play
              </button>
              <button
                onClick={() => {
                  setShowStageModal(true);
                  setIsPaused(false);
                }}
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 font-bold text-stone-800 hover:bg-stone-100 transition"
              >
                Choose Stage (1–12)
              </button>
              <button
                onClick={handleRestartDeal}
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 font-bold text-stone-800 hover:bg-stone-100 transition"
              >
                Restart This Board
              </button>
              <button
                onClick={onBack}
                className="min-h-12 w-full rounded-2xl border-2 border-rose-200 bg-rose-50 font-bold text-rose-800 hover:bg-rose-100 transition"
              >
                Save & Exit to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE SELECTOR MODAL */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="text-2xl font-black text-stone-900">Choose Mahjong Layout</h2>
                <p className="text-xs font-bold text-stone-500">12 curated progressive stages</p>
              </div>
              <button
                onClick={() => setShowStageModal(false)}
                className="h-10 w-10 rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {mahjongLayouts.map((l) => {
                const unlocked = gameProgress['mahjong_memory']?.unlockedStage || 1;
                const isUnlocked = l.stage <= unlocked;
                const isCurrent = l.stage === stage;

                return (
                  <button
                    key={l.id}
                    disabled={!isUnlocked}
                    onClick={() => handleNewDeal(l.stage)}
                    className={`p-4 rounded-2xl border-2 text-left transition flex items-start justify-between ${
                      isCurrent
                        ? 'border-teal-700 bg-teal-50/70 shadow-md'
                        : isUnlocked
                        ? 'border-stone-200 bg-white hover:border-teal-400'
                        : 'border-stone-100 bg-stone-50 opacity-50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black text-teal-800">Stage {l.stage}</span>
                      <h3 className="text-base font-black text-stone-900 mt-0.5">
                        {l.name[selectedLanguage] || l.name.English}
                      </h3>
                      <p className="text-xs font-semibold text-stone-500 mt-1">
                        {l.tileCount} tiles · {l.maxLayers} layers
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="rounded-full bg-teal-700 text-white text-[10px] font-black px-2 py-0.5">
                        Current
                      </span>
                    ) : !isUnlocked ? (
                      <span className="text-xs">🔒</span>
                    ) : (
                      <span className="text-xs font-bold text-teal-700">Play →</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-black text-stone-900 mb-2">How to Play Mahjong Solitaire</h2>
            <div className="space-y-3 text-sm font-semibold text-stone-700 mt-4">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  1
                </span>
                <p>
                  <strong>Find Matching Pairs:</strong> Tap two matching free tiles to remove them
                  from the table.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  2
                </span>
                <p>
                  <strong>Uncovered:</strong> A tile must not be covered by another tile on a higher
                  layer.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  3
                </span>
                <p>
                  <strong>Open Side:</strong> A tile must have at least its left or right side
                  completely open.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 flex items-start gap-3 text-pink-950">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white font-black text-xs">
                  4
                </span>
                <p>
                  <strong>Wild Flowers & Seasons:</strong> Any Flower tile matches any Flower. Any
                  Season tile matches any Season.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTutorial(false)}
              className="mt-6 min-h-12 w-full rounded-2xl bg-teal-800 font-black text-white shadow-md hover:bg-teal-900 transition"
            >
              I Understand — Start Playing
            </button>
          </div>
        </div>
      )}

      {/* COMPLETION CELEBRATION MODAL */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl animate-fadeIn">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl mb-4">
              <Flower2 className="h-12 w-12 text-teal-950" />
            </div>
            <h2 className="text-3xl font-black text-teal-950">Board Cleared!</h2>
            <p className="mt-2 text-base font-semibold text-stone-600">
              Wonderful focus! You matched every free tile in{' '}
              <strong>{layout.name[selectedLanguage] || layout.name.English}</strong>.
            </p>
            <p className="mt-1 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 1 fresh flower added to your Memory Garden!
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {stage < 12 && (
                <button
                  onClick={() => handleNewDeal(stage + 1)}
                  className="min-h-14 w-full rounded-2xl bg-teal-800 font-black text-white text-lg shadow-lg hover:bg-teal-900 transition"
                >
                  Next Layout (Stage {stage + 1}) →
                </button>
              )}
              <button
                onClick={() => handleNewDeal(stage)}
                className="min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-stone-50 font-black text-stone-800 hover:bg-stone-100 transition"
              >
                Play This Layout Again
              </button>
              <button
                onClick={onBack}
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
