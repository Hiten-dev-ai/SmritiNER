import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CornerUpLeft,
  Flower2,
  HelpCircle,
  MoreHorizontal,
  Pause,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
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
  type MahjongStageSource,
  type MahjongTableFelt,
  type MahjongTestingState,
  type MahjongThemeId,
  type MahjongViewPreferences,
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

const TEST_MODE_SESSION_KEY = 'smriti_mahjong_test_mode';
const TEST_SAVE_SESSION_KEY = 'smriti_mahjong_test_save';

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

  // -----------------------------------------------------------------
  // 1. TESTING MODE STATE (sessionStorage only, never touches DB)
  // -----------------------------------------------------------------
  const [testingState, setTestingState] = useState<MahjongTestingState>(() => {
    try {
      const stored = sessionStorage.getItem(TEST_MODE_SESSION_KEY);
      return {
        enabled: stored === 'true',
        effectiveUnlockedStage: stored === 'true' ? 12 : 1,
      };
    } catch {
      return { enabled: false, effectiveUnlockedStage: 1 };
    }
  });

  const realUnlockedStage = gameProgress['mahjong_memory']?.unlockedStage || 1;
  const effectiveUnlockedStage = testingState.enabled ? 12 : realUnlockedStage;

  const toggleTestingMode = (enable: boolean) => {
    try {
      sessionStorage.setItem(TEST_MODE_SESSION_KEY, enable ? 'true' : 'false');
    } catch {
      // storage fallback
    }
    setTestingState({
      enabled: enable,
      effectiveUnlockedStage: enable ? 12 : realUnlockedStage,
    });
    if (enable) {
      setViewPrefs((prev) => ({ ...prev, showLayerLabels: true }));
      setToastMessage('Testing Mode: All 12 layouts unlocked for this session.');
    } else {
      setToastMessage('Testing Mode disabled: Standard progression restored.');
    }
  };

  // -----------------------------------------------------------------
  // 2. VIEW PREFERENCES & THEMES
  // -----------------------------------------------------------------
  const [stage, setStage] = useState<number>(savedGame?.stage || initialStage);
  const [themeId, setThemeId] = useState<MahjongThemeId>(savedGame?.themeId || 'ner-heritage');
  // Default table is Tea Garden Green for optimal ivory tile contrast
  const [tableFelt, setTableFelt] = useState<MahjongTableFelt>(
    savedGame?.tableFelt || 'tea-garden'
  );

  const [viewPrefs, setViewPrefs] = useState<MahjongViewPreferences>({
    viewMode: stage >= 7 ? 'comfort' : 'fit',
    showFreeHighlights: true,
    showLayerLabels: testingState.enabled,
    showBoardMap: false,
    largePrint: false,
  });

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

  // Dialogs & Sheets
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showMoreSheet, setShowMoreSheet] = useState<boolean>(false);
  const [showStageModal, setShowStageModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showNoMovesModal, setShowNoMovesModal] = useState<boolean>(false);
  const [showShuffleConfirmModal, setShowShuffleConfirmModal] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interaction Feedback
  const [blockedHighlights, setBlockedHighlights] = useState<{
    targetId: string;
    covererIds: string[];
    leftIds: string[];
    rightIds: string[];
  } | null>(null);
  const [hintedPair, setHintedPair] = useState<[string, string] | null>(null);
  const [matchingAnimation, setMatchingAnimation] = useState<[string, string] | null>(null);

  // -----------------------------------------------------------------
  // 3. DOMINANT VIEWPORT CAMERA & DYNAMIC FIT ENGINE
  // -----------------------------------------------------------------
  const tileFaceWidth = 62;
  const tileFaceHeight = 80;
  const halfX = tileFaceWidth / 2; // 31px
  const halfY = tileFaceHeight / 2; // 40px
  const layerShift = 8; // 8px right, 8px up
  const depthRight = 7;
  const depthBottom = 8;

  // Complete board physical bounds
  const boardTotalWidth =
    (layout.cameraBounds.maxX + 1) * halfX + layout.maxLayers * layerShift + depthRight + 40;
  const boardTotalHeight =
    (layout.cameraBounds.maxY + 1) * halfY + layout.maxLayers * layerShift + depthBottom + 40;

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 900,
    height: 650,
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    moved: false,
  });

  // Calculate dynamic fit scale so small layouts expand to occupy 70–80% of playable canvas
  const fitScale = useMemo(() => {
    const availW = Math.max(300, viewportSize.width - 32);
    const availH = Math.max(300, viewportSize.height - (64 + 76));
    const rawScale = Math.min(availW / boardTotalWidth, availH / boardTotalHeight);

    // If small layout (e.g. 24–48 tiles), scale up so it occupies 70–80% of canvas
    if (layout.tileCount <= 48) {
      return Math.min(1.4, Math.max(0.9, rawScale * 1.25));
    }
    // Moderate layouts (60–96 tiles)
    if (layout.tileCount <= 96) {
      return Math.min(1.2, Math.max(0.65, rawScale * 1.1));
    }
    // Dense layouts (108–144 tiles)
    return Math.min(1.1, Math.max(0.45, rawScale));
  }, [viewportSize, boardTotalWidth, boardTotalHeight, layout.tileCount]);

  const fitBoardToView = (mode: 'fit' | 'comfort' = viewPrefs.viewMode) => {
    if (mode === 'fit') {
      setZoom(fitScale);
      setPan({ x: 0, y: 0 });
    } else {
      // Comfort zoom keeps tiles >= 56px wide
      const comfortTarget = Math.max(1.0, fitScale * 1.35);
      setZoom(comfortTarget);
      setPan({ x: 0, y: 0 });
    }
  };

  // ResizeObserver on table container
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewportSize({ width, height });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Recalculate on stage / fitScale change
  useEffect(() => {
    fitBoardToView(viewPrefs.viewMode);
  }, [stage, fitScale, viewPrefs.viewMode]);

  useEffect(() => {
    setGameActive(true);
    return () => setGameActive(false);
  }, [setGameActive]);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
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
    const t = setTimeout(() => setHintedPair(null), 3500);
    return () => clearTimeout(t);
  }, [hintedPair]);

  // Compute active tiles and matches
  const activeTiles = useMemo(() => tiles.filter((t) => t.active), [tiles]);
  const availableMatches = useMemo(() => getAvailableMatches(tiles), [tiles]);

  // Dead-end detection
  useEffect(() => {
    if (activeTiles.length > 0 && availableMatches.length === 0 && !matchingAnimation) {
      const timer = setTimeout(() => {
        setShowNoMovesModal(true);
        audioManager.play('gentle-nudge');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTiles.length, availableMatches.length, matchingAnimation]);

  // Auto-save logic (isolated when testing)
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

    if (testingState.enabled) {
      try {
        sessionStorage.setItem(TEST_SAVE_SESSION_KEY, JSON.stringify(saveState));
      } catch {
        // session storage fallback
      }
      return;
    }

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
    testingState.enabled,
    onSaveGame,
  ]);

  // -----------------------------------------------------------------
  // 4. INTERACTION HANDLERS
  // -----------------------------------------------------------------
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

      let msg = '';
      if (covered && (leftB || rightB)) {
        msg = 'Clear the top tile and open one side.';
      } else if (covered) {
        msg = 'This tile has another tile above it.';
      } else {
        msg = 'Open the left or right side first.';
      }
      setToastMessage(msg);
      if (speechSupported) {
        readAloud(msg);
      }
      return;
    }

    // Play tile pick click (richer pitch for upper layers)
    if (tile.z > 1) {
      audioManager.play('tap');
    } else {
      audioManager.play('tile-pick');
    }

    if (!selectedTileId) {
      setSelectedTileId(tile.instanceId);
      return;
    }

    if (selectedTileId === tile.instanceId) {
      setSelectedTileId(undefined);
      return;
    }

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

    if (testingState.enabled) {
      try {
        sessionStorage.removeItem(TEST_SAVE_SESSION_KEY);
      } catch {
        // session storage cleanup
      }
      return;
    }

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
      stageSource: (testingState.enabled ? 'test' : 'recommended') as MahjongStageSource,
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

  // Hint with camera centering
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

    if (viewPrefs.viewMode === 'comfort') {
      const midX = ((match[0].x + match[1].x) / 2) * halfX;
      const midY = ((match[0].y + match[1].y) / 2) * halfY;
      const targetPanX = -midX + viewportSize.width / 4;
      const targetPanY = -midY + viewportSize.height / 4;
      setPan({ x: targetPanX, y: targetPanY });
    }
  };

  const triggerShuffle = () => {
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
    setShowShuffleConfirmModal(false);
    setToastMessage('Tiles rearranged! Fresh matches are now available.');
  };

  const handleShuffleRequest = () => {
    if (availableMatches.length > 0) {
      setShowShuffleConfirmModal(true);
    } else {
      triggerShuffle();
    }
  };

  const handleRestartDeal = () => {
    setTiles(generateSolvableDeal(layout, dealSeed));
    setSelectedTileId(undefined);
    setMoveHistory([]);
    setPairsCleared(0);
    setShowNoMovesModal(false);
    setShowShuffleConfirmModal(false);
    setIsPaused(false);
    setShowMoreSheet(false);
    audioManager.play('tap');
  };

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
    setShowShuffleConfirmModal(false);
    setShowStageModal(false);
    setShowMoreSheet(false);
    setIsPaused(false);
    setIsCompleted(false);
    audioManager.play('tap');
  };

  // -----------------------------------------------------------------
  // 5. THEME & FELT STYLING
  // -----------------------------------------------------------------
  const tableFeltClass =
    tableFelt === 'tea-garden'
      ? 'bg-[#143d2b] text-emerald-50'
      : tableFelt === 'brahmaputra-dusk'
      ? 'bg-[#182335] text-slate-100'
      : tableFelt === 'high-contrast'
      ? 'bg-[#090d16] text-white'
      : 'bg-[#cfb99b] text-stone-950';

  // -----------------------------------------------------------------
  // 6. POINTER DRAGGING & PANNING
  // -----------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.mahjong-tile-btn')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }

    const maxPanX = boardTotalWidth * zoom * 0.8;
    const maxPanY = boardTotalHeight * zoom * 0.8;
    const nextX = Math.max(-maxPanX, Math.min(maxPanX, dragStartRef.current.panX + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, dragStartRef.current.panY + dy));

    setPan({ x: nextX, y: nextY });
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mahjong-tile-btn')) return;
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex h-[100dvh] flex-col select-none overflow-hidden font-sans ${tableFeltClass}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. SINGLE CLEAN 64PX HEADER                                   */}
      {/* ------------------------------------------------------------- */}
      <header className="shrink-0 flex h-16 items-center justify-between border-b border-black/20 bg-gradient-to-b from-[#1b4332]/95 to-[#0e2a1e]/95 px-3 sm:px-5 text-white shadow-md backdrop-blur-md z-40">
        {/* Left: Back & Layout Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition"
            aria-label="Back to Menu"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight truncate">
              Smriti Mahjong
            </span>
            <span className="text-emerald-300 font-bold hidden xs:inline">·</span>
            <button
              onClick={() => setShowStageModal(true)}
              className="text-xs sm:text-sm font-bold text-amber-200 hover:text-amber-100 truncate hover:underline flex items-center gap-1"
            >
              <span>
                Stage {stage}: {layout.name[selectedLanguage] || layout.name.English}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {testingState.enabled && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow-sm animate-pulse">
              <Sparkles className="h-3 w-3" /> TEST · ALL STAGES
            </span>
          )}
        </div>

        {/* Center: Desktop Inline Status */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/15 bg-black/25 text-xs font-black tracking-wide text-emerald-100 shadow-inner">
          <span>{activeTiles.length} tiles</span>
          <span className="text-emerald-400">·</span>
          <span className={availableMatches.length > 0 ? 'text-amber-300' : 'text-rose-300'}>
            {availableMatches.length} pair{availableMatches.length !== 1 ? 's' : ''} available
          </span>
          <span className="text-emerald-400">·</span>
          <span>{pairsCleared} cleared</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {speechSupported && (
            <button
              onClick={() =>
                readAloud(
                  `Mahjong Solitaire, Stage ${stage}, ${layout.name.English}. ${activeTiles.length} tiles left, ${availableMatches.length} pairs available.`
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition"
              aria-label="Read status aloud"
            >
              <Volume2 className="h-5 w-5 text-emerald-100" />
            </button>
          )}

          <button
            onClick={() => setIsPaused(true)}
            className="flex min-h-11 items-center justify-center gap-1.5 px-3 rounded-xl border border-white/20 bg-white/10 text-xs sm:text-sm font-bold hover:bg-white/20 transition"
          >
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>

          <button
            onClick={() => setShowMoreSheet(true)}
            className="flex min-h-11 items-center justify-center gap-1.5 px-3 rounded-xl border border-white/20 bg-white/10 text-xs sm:text-sm font-bold hover:bg-white/20 transition"
            aria-label="More Settings"
          >
            <SlidersHorizontal className="h-4 w-4 text-amber-200" />
            <span className="hidden sm:inline">More</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. DOMINANT TABLE CANVAS (3D Extrusion & Dynamic Fit Scale)   */}
      {/* ------------------------------------------------------------- */}
      <main
        ref={viewportRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center p-2 sm:p-4"
      >
        {/* Board Canvas with Transformation */}
        <div
          className="relative transition-transform duration-100 origin-center"
          style={{
            width: `${boardTotalWidth}px`,
            height: `${boardTotalHeight}px`,
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

            // Blocked diagnostic feedback
            const isTargetBlocked = blockedHighlights?.targetId === tile.instanceId;
            const isCoverer = blockedHighlights?.covererIds.includes(tile.instanceId);
            const isSideBlocker =
              blockedHighlights?.leftIds.includes(tile.instanceId) ||
              blockedHighlights?.rightIds.includes(tile.instanceId);

            // 3D Layer Elevation: +8px right, -8px up per layer z
            const elevationX = tile.z * layerShift;
            const elevationY = -tile.z * layerShift;
            const pixelX = tile.x * halfX + elevationX + 20;
            const pixelY = tile.y * halfY + elevationY + 20;

            // Collision-safe z-index formula: higher layer always renders above lower layer!
            // Clicking a blocked lower tile NEVER elevates its z-index above its covering tile.
            const naturalZIndex =
              tile.z * 1000 + Math.floor(tile.y) * 20 + Math.floor(tile.x);
            const zIndex =
              isSelected && isFree
                ? 9000
                : isMatching
                ? 9500
                : isCoverer
                ? naturalZIndex + 50
                : naturalZIndex;

            // Layer contact shadow
            const shadowIntensity =
              tile.z === 0
                ? 'shadow-[2px_4px_6px_rgba(0,0,0,0.3)]'
                : tile.z === 1
                ? 'shadow-[4px_7px_10px_rgba(0,0,0,0.38)]'
                : tile.z === 2
                ? 'shadow-[6px_10px_14px_rgba(0,0,0,0.45)]'
                : 'shadow-[8px_14px_20px_rgba(0,0,0,0.55)]';

            return (
              <button
                key={tile.instanceId}
                type="button"
                data-instance-id={tile.instanceId}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTileClick(tile);
                }}
                className={`mahjong-tile-btn absolute rounded-[8px] transition-all duration-150 cursor-pointer ${
                  isSelected && isFree
                    ? '-translate-y-1.5 scale-[1.04] ring-4 ring-amber-400 ring-offset-2 z-[9000]'
                    : isHinted
                    ? 'ring-4 ring-emerald-400 animate-pulse'
                    : isMatching
                    ? 'scale-110 opacity-70'
                    : isCoverer
                    ? 'ring-4 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                    : isSideBlocker
                    ? 'ring-4 ring-amber-500'
                    : isTargetBlocked
                    ? 'animate-shake'
                    : isFree && viewPrefs.showFreeHighlights
                    ? 'hover:brightness-105'
                    : ''
                }`}
                style={{
                  left: `${pixelX}px`,
                  top: `${pixelY}px`,
                  width: `${tileFaceWidth}px`,
                  height: `${tileFaceHeight}px`,
                  zIndex,
                }}
                aria-label={`${identity.nerName[selectedLanguage] || identity.nerName.English}, ${
                  isFree ? 'playable tile' : 'blocked'
                }, Layer ${tile.z + 1}`}
              >
                {/* --------------------------------------------------- */}
                {/* 3D TILE STRUCTURE: Front Face + Extruded Depth Slabs */}
                {/* --------------------------------------------------- */}
                <div
                  className={`relative w-full h-full rounded-[8px] border border-stone-300 ${shadowIntensity} flex flex-col items-center justify-center p-1 overflow-hidden transition-colors ${
                    isFree
                      ? 'bg-[#fffdfa] text-stone-900 border-b-2 border-emerald-600/50'
                      : 'bg-[#f1f5f9] text-stone-800 shadow-inner'
                  }`}
                >
                  {/* Isometric Right Depth Slab (7px) */}
                  <span
                    className="absolute -right-[7px] top-[4px] bottom-[4px] w-[7px] rounded-r-[4px] pointer-events-none"
                    style={{
                      backgroundColor: isFree ? '#cbd5e1' : '#94a3b8',
                      boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.2)',
                    }}
                  />

                  {/* Isometric Bottom Depth Slab (8px) */}
                  <span
                    className="absolute -bottom-[8px] left-[4px] right-[4px] h-[8px] rounded-b-[4px] pointer-events-none"
                    style={{
                      backgroundColor: isFree ? '#94a3b8' : '#64748b',
                      boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3)',
                    }}
                  />

                  {/* Optional Layer Label (L1–L6) */}
                  {viewPrefs.showLayerLabels && (
                    <span
                      className={`absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[9px] font-black leading-tight ${
                        tile.z === 0
                          ? 'bg-stone-200 text-stone-700'
                          : tile.z === 1
                          ? 'bg-blue-100 text-blue-900'
                          : tile.z === 2
                          ? 'bg-amber-100 text-amber-900'
                          : tile.z === 3
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      L{tile.z + 1}
                    </span>
                  )}

                  {/* Covering Tile Anchored Tag */}
                  {isCoverer && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md whitespace-nowrap z-50">
                      Above
                    </span>
                  )}

                  {/* Tile SVG Artwork */}
                  <TileArtwork
                    identity={identity}
                    theme={themeId}
                    largePrint={viewPrefs.largePrint}
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Diagnostic Feedback Toast Card */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-[min(90vw,480px)] w-full rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm sm:text-base font-black text-amber-950 shadow-2xl animate-fadeIn flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="h-5 w-5 shrink-0 text-amber-700" />
              <span className="leading-snug">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-amber-200 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Optional Mini-Map (Only when enabled in More) */}
        {viewPrefs.showBoardMap && (
          <div className="hidden md:block absolute top-4 right-4 z-30 rounded-2xl border border-white/20 bg-stone-900/80 p-2.5 backdrop-blur-md text-white shadow-xl">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                Board Map
              </p>
              <button
                onClick={() => setViewPrefs((p) => ({ ...p, showBoardMap: false }))}
                className="h-4 w-4 text-stone-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div
              className="relative w-32 h-24 bg-stone-800/90 rounded-lg border border-stone-700 overflow-hidden cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / rect.width;
                const clickY = (e.clientY - rect.top) / rect.height;
                const targetPanX = -(clickX - 0.5) * boardTotalWidth * zoom;
                const targetPanY = -(clickY - 0.5) * boardTotalHeight * zoom;
                setPan({ x: targetPanX, y: targetPanY });
              }}
            >
              {tiles.map((t) => {
                if (!t.active) return null;
                const px = (t.x / (layout.cameraBounds.maxX || 24)) * 100;
                const py = (t.y / (layout.cameraBounds.maxY || 16)) * 100;
                const isFree = isTileFree(t, activeTiles);

                return (
                  <div
                    key={t.instanceId}
                    className={`absolute w-2 h-2.5 rounded-[1px] ${
                      isFree
                        ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                        : t.z === 0
                        ? 'bg-stone-600'
                        : t.z === 1
                        ? 'bg-blue-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ left: `${px}%`, top: `${py}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. FLOATING ACTION DOCK (Desktop Pill / Mobile Safe-Area Bar)   */}
      {/* ------------------------------------------------------------- */}
      <footer className="shrink-0 p-3 sm:pb-5 flex justify-center z-30">
        {/* Desktop Floating Pill Dock */}
        <div className="hidden sm:flex items-center gap-3 rounded-full border border-black/15 bg-white/95 px-6 py-2.5 shadow-2xl backdrop-blur-md text-stone-800">
          <button
            onClick={handleUndo}
            disabled={!moveHistory.length}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm hover:bg-stone-100 disabled:opacity-30 transition"
          >
            <CornerUpLeft className="h-4 w-4" />
            <span>Undo</span>
          </button>

          <div className="h-5 w-[1px] bg-stone-300" />

          <button
            onClick={handleHint}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm text-teal-900 hover:bg-teal-50 transition"
          >
            <Search className="h-4 w-4 text-teal-700" />
            <span>Hint</span>
          </button>

          <div className="h-5 w-[1px] bg-stone-300" />

          <button
            onClick={handleShuffleRequest}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm transition ${
              availableMatches.length === 0
                ? 'bg-teal-800 text-white shadow-md animate-pulse'
                : 'text-stone-800 hover:bg-stone-100'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Shuffle</span>
          </button>

          <div className="h-5 w-[1px] bg-stone-300" />

          <button
            onClick={() => setShowMoreSheet(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm text-stone-700 hover:bg-stone-100 transition"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>More</span>
          </button>
        </div>

        {/* Mobile Full-Width Action Dock */}
        <div className="sm:hidden w-full rounded-2xl border border-black/15 bg-white/95 p-2 shadow-2xl backdrop-blur-md">
          {/* Mobile inline status line */}
          <div className="flex items-center justify-around border-b border-stone-200 pb-1.5 mb-1.5 text-xs font-black text-stone-700">
            <span>{activeTiles.length} tiles</span>
            <span>·</span>
            <span className={availableMatches.length > 0 ? 'text-teal-800' : 'text-amber-800'}>
              {availableMatches.length} pair{availableMatches.length !== 1 ? 's' : ''} available
            </span>
            <span>·</span>
            <span>{pairsCleared} cleared</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={handleUndo}
              disabled={!moveHistory.length}
              className="flex min-h-14 flex-col items-center justify-center rounded-xl bg-stone-50 font-black text-stone-800 disabled:opacity-30"
            >
              <CornerUpLeft className="h-5 w-5" />
              <span className="text-[11px] mt-0.5">Undo</span>
            </button>

            <button
              onClick={handleHint}
              className="flex min-h-14 flex-col items-center justify-center rounded-xl bg-teal-50 font-black text-teal-900"
            >
              <Search className="h-5 w-5 text-teal-700" />
              <span className="text-[11px] mt-0.5">Hint</span>
            </button>

            <button
              onClick={handleShuffleRequest}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl font-black ${
                availableMatches.length === 0
                  ? 'bg-teal-800 text-white shadow-md'
                  : 'bg-stone-50 text-stone-800'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-[11px] mt-0.5">Shuffle</span>
            </button>

            <button
              onClick={() => setShowMoreSheet(true)}
              className="flex min-h-14 flex-col items-center justify-center rounded-xl bg-stone-100 font-black text-stone-800"
            >
              <SlidersHorizontal className="h-5 w-5 text-amber-800" />
              <span className="text-[11px] mt-0.5">More</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 4. UNIFIED "MORE" OPTIONS SHEET / DIALOG                      */}
      {/* ------------------------------------------------------------- */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-5 w-5 text-teal-800" />
                <h3 className="text-xl font-black text-stone-900">Mahjong Options</h3>
              </div>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="h-10 w-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Sections */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm font-bold text-stone-800">
              {/* SECTION: Stage & Layout */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
                  Board Layout
                </p>
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    setShowStageModal(true);
                  }}
                  className="w-full min-h-14 p-3.5 rounded-2xl border-2 border-teal-200 bg-teal-50/70 hover:bg-teal-100 flex items-center justify-between text-teal-950 transition"
                >
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-teal-800">
                      Choose Stage (1–12)
                    </span>
                    <span className="block text-base font-black">
                      Stage {stage}: {layout.name[selectedLanguage] || layout.name.English}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-teal-700" />
                </button>
              </div>

              {/* SECTION: View & Camera Controls */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
                  View & Zoom
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setViewPrefs((p) => ({ ...p, viewMode: 'fit' }));
                      fitBoardToView('fit');
                    }}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      viewPrefs.viewMode === 'fit'
                        ? 'border-teal-700 bg-teal-50 text-teal-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>Fit Overview</span>
                    {viewPrefs.viewMode === 'fit' && <Check className="h-4 w-4 text-teal-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setViewPrefs((p) => ({ ...p, viewMode: 'comfort' }));
                      fitBoardToView('comfort');
                    }}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      viewPrefs.viewMode === 'comfort'
                        ? 'border-teal-700 bg-teal-50 text-teal-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>Comfort Zoom</span>
                    {viewPrefs.viewMode === 'comfort' && (
                      <Check className="h-4 w-4 text-teal-700" />
                    )}
                  </button>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <button
                    onClick={() =>
                      setViewPrefs((p) => ({
                        ...p,
                        showFreeHighlights: !p.showFreeHighlights,
                      }))
                    }
                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between"
                  >
                    <span>Highlight Playable Tiles</span>
                    {viewPrefs.showFreeHighlights && <Check className="h-4 w-4 text-emerald-700" />}
                  </button>
                  <button
                    onClick={() =>
                      setViewPrefs((p) => ({ ...p, showLayerLabels: !p.showLayerLabels }))
                    }
                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between"
                  >
                    <span>Show Layer Numbers (L1–L6)</span>
                    {viewPrefs.showLayerLabels && <Check className="h-4 w-4 text-emerald-700" />}
                  </button>
                  <button
                    onClick={() => setViewPrefs((p) => ({ ...p, largePrint: !p.largePrint }))}
                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between"
                  >
                    <span>Large Print Numerals</span>
                    {viewPrefs.largePrint && <Check className="h-4 w-4 text-emerald-700" />}
                  </button>
                </div>
              </div>

              {/* SECTION: Themes */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
                  Table Felt & Artwork
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTableFelt('tea-garden')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      tableFelt === 'tea-garden'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>Tea Garden Green</span>
                    {tableFelt === 'tea-garden' && (
                      <Check className="h-4 w-4 text-emerald-700" />
                    )}
                  </button>
                  <button
                    onClick={() => setTableFelt('sand')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      tableFelt === 'sand'
                        ? 'border-amber-700 bg-amber-50 text-amber-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>Classic Sand</span>
                    {tableFelt === 'sand' && <Check className="h-4 w-4 text-amber-700" />}
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setThemeId('ner-heritage')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      themeId === 'ner-heritage'
                        ? 'border-teal-700 bg-teal-50 text-teal-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>NER Heritage Tiles</span>
                    {themeId === 'ner-heritage' && <Check className="h-4 w-4 text-teal-700" />}
                  </button>
                  <button
                    onClick={() => setThemeId('classic-ivory')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                      themeId === 'classic-ivory'
                        ? 'border-teal-700 bg-teal-50 text-teal-950'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span>Classic Ivory Tiles</span>
                    {themeId === 'classic-ivory' && <Check className="h-4 w-4 text-teal-700" />}
                  </button>
                </div>
              </div>

              {/* SECTION: Testing Mode Switch */}
              <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 flex items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-amber-900">
                    Testing Mode (Unlock All 12 Stages)
                  </span>
                  <span className="block text-[11px] font-semibold text-amber-700">
                    Session only · Zero progress side-effects
                  </span>
                </div>
                <button
                  onClick={() => toggleTestingMode(!testingState.enabled)}
                  className={`h-7 w-12 rounded-full transition-colors relative flex items-center px-0.5 ${
                    testingState.enabled ? 'bg-amber-600' : 'bg-stone-300'
                  }`}
                  aria-label="Toggle Mahjong Testing Mode"
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                      testingState.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SECTION: Actions */}
              <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    setShowTutorial(true);
                  }}
                  className="min-h-12 w-full rounded-2xl border border-stone-300 bg-stone-50 font-bold text-stone-800 flex items-center justify-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" /> How to Play Tutorial
                </button>
                <button
                  onClick={handleRestartDeal}
                  className="min-h-12 w-full rounded-2xl border border-stone-300 bg-stone-50 font-bold text-stone-800 flex items-center justify-center gap-2"
                >
                  Restart This Board
                </button>
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    onBack();
                  }}
                  className="min-h-12 w-full rounded-2xl border-2 border-rose-200 bg-rose-50 font-bold text-rose-800 hover:bg-rose-100 flex items-center justify-center gap-2"
                >
                  Save & Exit to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STAGE SELECTOR MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h2 className="text-2xl font-black text-stone-900">Choose Mahjong Layout</h2>
                <p className="text-xs sm:text-sm font-semibold text-stone-500 mt-0.5">
                  12 curated layered formations (24 to 144 tiles)
                </p>
              </div>
              <button
                onClick={() => setShowStageModal(false)}
                className="h-10 w-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mahjongLayouts.map((l) => {
                const isUnlocked = l.stage <= effectiveUnlockedStage;
                const isCurrent = l.stage === stage;
                const isTestUnlocked = testingState.enabled && l.stage > realUnlockedStage;

                return (
                  <button
                    key={l.id}
                    disabled={!isUnlocked}
                    onClick={() => handleNewDeal(l.stage)}
                    className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                      isCurrent
                        ? 'border-teal-700 bg-teal-50/70 shadow-md ring-2 ring-teal-600/30'
                        : isUnlocked
                        ? 'border-stone-200 bg-white hover:border-teal-400 hover:shadow-md'
                        : 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-800 uppercase tracking-wider">
                          Stage {l.stage}
                        </span>
                        {isCurrent ? (
                          <span className="rounded-full bg-teal-700 text-white text-[10px] font-black px-2 py-0.5">
                            Current
                          </span>
                        ) : isTestUnlocked ? (
                          <span className="rounded-full bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5">
                            Test Unlocked
                          </span>
                        ) : !isUnlocked ? (
                          <span className="text-xs">🔒</span>
                        ) : null}
                      </div>

                      <h3 className="text-lg font-black text-stone-900 mt-1">
                        {l.name[selectedLanguage] || l.name.English}
                      </h3>
                      <p className="text-xs font-semibold text-stone-500 mt-0.5">
                        {l.tileCount} tiles · {l.maxLayers} layers
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-teal-800">
                      <span>{l.subtitle[selectedLanguage] || l.subtitle.English}</span>
                      <span className="font-black text-sm">Play →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SHUFFLE CONFIRMATION MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      {showShuffleConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h3 className="text-xl font-black text-stone-900">Matches Are Still Available</h3>
            <p className="mt-2 text-sm font-semibold text-stone-600">
              There are {availableMatches.length} matching pairs available on the board. Do you wish
              to rearrange the tiles anyway?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={triggerShuffle}
                className="min-h-12 rounded-2xl bg-teal-800 font-black text-white"
              >
                Yes, Shuffle Tiles
              </button>
              <button
                onClick={() => setShowShuffleConfirmModal(false)}
                className="min-h-12 rounded-2xl border border-stone-200 font-bold text-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. DEAD-END NO MOVES MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {showNoMovesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-3">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">No Free Pairs Right Now</h2>
            <p className="mt-2 text-sm font-semibold text-stone-600">
              Your choices have closed this branch. You can rearrange the remaining tiles or step back.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={triggerShuffle}
                className="min-h-14 w-full rounded-2xl bg-teal-800 font-black text-white shadow-md hover:bg-teal-900 transition flex items-center justify-center gap-2 text-base"
              >
                <RefreshCw className="h-5 w-5" /> Shuffle Remaining Tiles
              </button>
              <button
                disabled={!moveHistory.length}
                onClick={handleUndo}
                className="min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-stone-50 font-black text-stone-800 hover:bg-stone-100 disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                <CornerUpLeft className="h-4 w-4" /> Undo Last Pair
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

      {/* ------------------------------------------------------------- */}
      {/* 8. PAUSE SHEET                                                */}
      {/* ------------------------------------------------------------- */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
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
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. HOW TO PLAY TUTORIAL                                       */}
      {/* ------------------------------------------------------------- */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-stone-900 mb-2">How to Play Mahjong Solitaire</h2>
            <div className="space-y-3 text-sm font-semibold text-stone-700 mt-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  1
                </span>
                <p>
                  <strong>Match Free Pairs:</strong> Tap any two matching playable tiles to remove
                  them from the board.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  2
                </span>
                <p>
                  <strong>Uncovered Rule:</strong> A tile must not be covered by another tile on a
                  higher layer.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-black text-xs">
                  3
                </span>
                <p>
                  <strong>Open Lateral Side:</strong> A tile must have either its left or right side
                  completely clear of neighbor tiles.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-200 flex items-start gap-3 text-pink-950">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white font-black text-xs">
                  4
                </span>
                <p>
                  <strong>Wild Flowers & Seasons:</strong> Any Flower matches any Flower. Any Season
                  matches any Season.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTutorial(false)}
              className="mt-6 min-h-12 w-full rounded-2xl bg-teal-800 font-black text-white shadow-md hover:bg-teal-900 transition"
            >
              Start Playing
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 10. BOARD CLEARED CELEBRATION MODAL                           */}
      {/* ------------------------------------------------------------- */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl mb-4">
              <Flower2 className="h-12 w-12 text-teal-950" />
            </div>
            <h2 className="text-3xl font-black text-teal-950">Board Cleared!</h2>
            <p className="mt-2 text-base font-semibold text-stone-600">
              {testingState.enabled
                ? 'Test board cleared. This test was not added to patient progress.'
                : `Wonderful focus! You matched every tile in ${
                    layout.name[selectedLanguage] || layout.name.English
                  }.`}
            </p>

            {!testingState.enabled && (
              <p className="mt-1 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4" /> 1 fresh flower added to your Memory Garden!
              </p>
            )}

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
