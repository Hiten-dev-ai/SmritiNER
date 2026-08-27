import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import { ArrowLeft, Volume2, Sparkles, Heart, CheckCircle, Music } from 'lucide-react';
import { GameResultModal } from './GameResultModal';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import type { ReminiscencePhoto, GameSession } from '../../types';
import { useApp } from '../../context/AppContext';

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
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
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

      setDurationSeconds(elapsedSec);
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
      <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-3xl shadow-md border border-stone-200">
        <Heart className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-xl font-bold text-stone-900">No Reminiscence Photos Yet</h3>
        <p className="text-sm text-stone-600 my-3">
          Caregivers can easily upload memorable family photographs and regional memories in the Caregiver Portal.
        </p>
        <button
          onClick={onBack}
          className="tactile-btn px-6 py-2.5 bg-tea-600 text-white rounded-xl font-bold"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const currentOptions = currentPhoto ? generateOptions(currentPhoto) : [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
        <button
          onClick={() => {
            audioManager.playTap();
            onBack();
          }}
          className="tactile-btn flex items-center space-x-2 text-stone-700 hover:text-tea-800 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.exit}</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-tea-900 leading-tight flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            <span>{t.albumTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-stone-500">
            {t.albumSubtitle}
          </p>
        </div>

        <span className="text-xs font-bold bg-tea-100 text-tea-800 px-3 py-1.5 rounded-xl border border-tea-300">
          Memory {currentIndex + 1} of {photos.length}
        </span>
      </div>

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
              <p className="text-xs text-stone-300">
                {currentPhoto.relationshipOrPlace} {currentPhoto.year ? `• ${currentPhoto.year}` : ''}
              </p>
            </div>
          </div>

          {/* Memory Prompt & Interaction Area */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-tea-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-tea-800 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-assamGold-500" />
                <span>Memory Recall Question</span>
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
                    className="tactile-btn flex items-center space-x-2 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>{showAudioClue ? 'Hide Audio Clue' : 'Listen to Family Clue'}</span>
                  </button>

                  {showAudioClue && (
                    <div className="mt-2 p-3 bg-amber-100/70 rounded-2xl border border-amber-300 text-xs font-semibold text-amber-950 animate-fade-in flex items-start space-x-2">
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
                      className={`tactile-btn w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all ${
                        isSelected
                          ? isCorrect
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md'
                            : 'bg-red-50 border-red-500 text-red-950 shadow-md'
                          : 'bg-stone-50 hover:bg-tea-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <span>{isCorrect ? '✓ Correct' : '✕ Try Again'}</span>
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
                className="tactile-btn w-full py-4 rounded-2xl bg-tea-600 hover:bg-tea-700 text-white font-black text-base shadow-lg flex items-center justify-center space-x-2 animate-bounce mt-2"
              >
                <span>
                  {currentIndex + 1 < photos.length ? 'Next Cherished Memory' : 'Complete Session'}
                </span>
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <GameResultModal
        isOpen={isGameOver}
        score={Math.round((correctAnswersCount / Math.max(1, photos.length)) * 100)}
        accuracy={Math.round((correctAnswersCount / Math.max(1, photos.length)) * 100)}
        durationSeconds={durationSeconds}
        difficultyLevel={1}
        difficultyDecision={difficultyDecision}
        gameTitle="Reminiscence Photo & Sound Album"
        onPlayAgain={() => {
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setShowAudioClue(false);
          setCorrectAnswersCount(0);
          setIsGameOver(false);
          setDurationSeconds(0);
          setDifficultyDecision(undefined);
          startTimeRef.current = 0;
        }}
        onBackToMenu={onBack}
      />
    </div>
  );
};
