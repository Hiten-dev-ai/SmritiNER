import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import { Volume2, Sparkles, Heart, CheckCircle, Music } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import type { ReminiscencePhoto, GameSession } from '../../types';
import { useApp } from '../../context/AppContext';
import { GameShell } from './GameShell';

interface ReminiscenceAlbumGameProps {
  onBack: () => void;
}

const getCurrentTime = () => Date.now();

export const ReminiscenceAlbumGame: React.FC<ReminiscenceAlbumGameProps> = ({ onBack }) => {
  const { t } = useApp();
  const photos = useLiveQuery(() => db.reminiscenceItems.toArray()) || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAudioClue, setShowAudioClue] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();
  const startTimeRef = useRef<number>(0);

  const currentPhoto: ReminiscencePhoto | undefined = photos[currentIndex];

  const handleSelectAnswer = (ans: string) => {
    audioManager.playTap();
    if (!currentPhoto) return;
    if (startTimeRef.current === 0) startTimeRef.current = getCurrentTime();

    setSelectedAnswer(ans);
    const isCorrect = ans.trim().toLowerCase() === currentPhoto.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      audioManager.playSuccess();
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      audioManager.playTryAgain();
    }
  };

  const handleNextPhoto = async () => {
    audioManager.playTap();
    setSelectedAnswer(null);
    setShowAudioClue(false);

    if (currentIndex + 1 < photos.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const total = photos.length;
      const accuracy = total > 0 ? Math.round((correctAnswersCount / total) * 100) : 100;
      const elapsedSec = Math.max(1, Math.round((getCurrentTime() - startTimeRef.current) / 1000));

      setIsGameOver(true);

      const session: GameSession = {
        patientId: 'pat-ner-001',
        gameType: 'reminiscence_album',
        gameTitle: 'Reminiscence Photo & Sound Album',
        score: Math.max(60, accuracy),
        maxPossibleScore: 100,
        accuracy,
        durationSeconds: elapsedSec,
        difficultyLevel: 1,
        hesitationsCount: 0,
        hintsUsedCount: 0,
        avgReactionTimeMs: 1600,
        completedAt: new Date().toISOString(),
        synced: false,
      };

      await db.gameSessions.add(session);
      const history = await db.gameSessions.toArray();
      setDifficultyDecision(aiEngine.calculateDynamicDifficulty('reminiscence_album', history));
    }
  };

  const generateOptions = (photo: ReminiscencePhoto) => {
    const distractors = [
      'Uncle Hemanta from Jorhat',
      'Tezpur Heritage Park',
      'Guwahati Medical College',
      'Shillong Peak Viewpoint',
      'Granddaughter Pallavi',
    ].filter((d) => d !== photo.correctAnswer);

    const optionsList = [photo.correctAnswer, distractors[0], distractors[1]];
    return optionsList.sort((a, b) => a.length - b.length);
  };

  if (photos.length === 0) {
    return (
      <GameShell title={t.albumTitle} instruction={t.albumInstruction} onExit={onBack}>
      <div className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-md">
        <Heart className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-stone-900">{t.noPhotos}</h3>
        <p className="my-3 text-base text-stone-600">
          {t.noPhotosHelp}
        </p>
        <button
          onClick={onBack}
          className="tactile-btn px-6 py-2.5 bg-tea-600 text-white rounded-xl font-bold"
        >
          {t.returnToMenu}
        </button>
      </div></GameShell>
    );
  }

  const currentOptions = currentPhoto ? generateOptions(currentPhoto) : [];

  return (
    <GameShell title={t.albumTitle} instruction={t.albumInstruction} onExit={onBack} status={`${currentIndex + 1} / ${photos.length}`}>
      <div className="animate-fade-in">

      {currentPhoto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Photo Frame */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-900 aspect-video md:aspect-[4/3]">
            <img
              src={currentPhoto.imageUrl}
              alt={currentPhoto.title}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/fallback-memory.svg';
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
              <h3 className="text-base sm:text-lg font-black leading-tight">{currentPhoto.title}</h3>
              <p className="text-base text-stone-200">
                {currentPhoto.relationshipOrPlace} {currentPhoto.year ? `• ${currentPhoto.year}` : ''}
              </p>
            </div>
          </div>

          {/* Memory Prompt & Interaction Area */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-tea-500/30 flex flex-col justify-between">
            <div>
              <div className="mb-2 flex items-center space-x-2 text-base font-bold text-tea-800">
                <Sparkles className="w-4 h-4 text-assamGold-500" />
                <span>{t.memoryRecallQuestion}</span>
              </div>

              <h4 className="text-lg sm:text-xl font-black text-stone-900 leading-snug mb-4">
                {currentPhoto.memoryPromptQuestion}
              </h4>

              {/* Audio / Verbal Clue Button */}
              {currentPhoto.audioPromptHint && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      audioManager.playTap();
                      setShowAudioClue(!showAudioClue);
                    }}
                    className="tactile-btn flex min-h-[48px] items-center space-x-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-base font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>{showAudioClue ? t.hideClue : t.listenFamilyClue}</span>
                  </button>

                  {showAudioClue && (
                    <div className="mt-2 flex items-start space-x-2 rounded-2xl border border-amber-300 bg-amber-100/70 p-3 text-base font-semibold text-amber-950 animate-fade-in">
                      <Music className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <span>{currentPhoto.audioPromptHint}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Choice Answers */}
              <div className="space-y-2.5 my-4">
                {currentOptions.map((opt, idx) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = opt.trim().toLowerCase() === currentPhoto.correctAnswer.trim().toLowerCase();

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`tactile-btn w-full p-4 rounded-2xl border-2 text-left font-bold text-base flex items-center justify-between transition-all ${
                        isSelected
                          ? isCorrect
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md'
                            : 'bg-red-50 border-red-500 text-red-950 shadow-md'
                          : 'bg-stone-50 hover:bg-tea-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <span>{isCorrect ? `✓ ${t.correct}` : `✕ ${t.tryAgain}`}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Photo Action */}
            {selectedAnswer !== null && (
              <button
                onClick={handleNextPhoto}
                className="tactile-btn mt-2 flex min-h-[56px] w-full items-center justify-center space-x-2 rounded-2xl bg-tea-700 px-4 text-lg font-black text-white shadow-lg hover:bg-tea-800"
              >
                <span>
                  {currentIndex + 1 < photos.length ? t.nextMemory : t.completeSession}
                </span>
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <GameResultModal
        isOpen={isGameOver}
        accuracy={Math.round((correctAnswersCount / Math.max(1, photos.length)) * 100)}
        difficultyDecision={difficultyDecision}
        gameTitle={t.albumTitle}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setShowAudioClue(false);
          setCorrectAnswersCount(0);
          setIsGameOver(false);
          setDifficultyDecision(undefined);
          startTimeRef.current = 0;
        }}
        onBackToMenu={onBack}
      />
      </div>
    </GameShell>
  );
};
