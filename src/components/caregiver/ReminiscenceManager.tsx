import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import { Plus, Trash2 } from 'lucide-react';
import type { ReminiscencePhoto } from '../../types';

export const ReminiscenceManager: React.FC = () => {
  const photos = useLiveQuery(() => db.reminiscenceItems.toArray()) || [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [relationshipOrPlace, setRelationshipOrPlace] = useState('');
  const [year, setYear] = useState('2022');
  const [memoryPromptQuestion, setMemoryPromptQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [audioPromptHint, setAudioPromptHint] = useState('');

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    audioManager.playSuccess();
    const newPhoto: Omit<ReminiscencePhoto, 'id'> = {
      patientId: 'pat-ner-001',
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      relationshipOrPlace: relationshipOrPlace.trim(),
      year: year.trim(),
      memoryPromptQuestion: memoryPromptQuestion.trim(),
      correctAnswer: correctAnswer.trim(),
      audioPromptHint: audioPromptHint.trim() || undefined,
      synced: false,
    };

    await db.reminiscenceItems.add(newPhoto as ReminiscencePhoto);
    setTitle('');
    setImageUrl('');
    setRelationshipOrPlace('');
    setMemoryPromptQuestion('');
    setCorrectAnswer('');
    setAudioPromptHint('');
    setShowAddForm(false);
  };

  const handleDeletePhoto = async (id?: number | string) => {
    if (typeof id !== 'number') return;
    audioManager.playTap();
    await db.reminiscenceItems.delete(id);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
        <div>
          <h3 className="text-xl font-black text-stone-900">
            Family Photo & Memory Lane Manager
          </h3>
          <p className="text-xs text-stone-500">
            Upload family memories and set gentle reminiscence questions for therapy
          </p>
        </div>

        <button
          onClick={() => {
            audioManager.playTap();
            setShowAddForm(!showAddForm);
          }}
          className="tactile-btn flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add New Memory Photo'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPhoto} className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 mb-6 space-y-4 animate-fade-in">
          <h4 className="font-bold text-sm text-stone-800">Add New Cherished Memory</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Memory Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rongali Bihu Family Dance"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Photo Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">People / Location</label>
              <input
                type="text"
                value={relationshipOrPlace}
                onChange={(e) => setRelationshipOrPlace(e.target.value)}
                placeholder="e.g. Daughter Anuradha & Grandson Nilav"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Year / Occasion</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. April 2021 (Bihu)"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-600 mb-1">Memory Prompt Question for Elder</label>
              <input
                type="text"
                value={memoryPromptQuestion}
                onChange={(e) => setMemoryPromptQuestion(e.target.value)}
                placeholder="e.g. Who is holding the traditional Bihu Dhol drum in this photo?"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Correct Answer</label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="e.g. Grandson Nilav"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Audio Prompt Clue (Optional)</label>
              <input
                type="text"
                value={audioPromptHint}
                onChange={(e) => setAudioPromptHint(e.target.value)}
                placeholder="e.g. Your younger grandson with the yellow silk shirt!"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tactile-btn px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
            >
              Save Memory Photo
            </button>
          </div>
        </form>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 flex flex-col justify-between">
            <div className="h-40 overflow-hidden relative">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/fallback-memory.svg';
                }}
              />
              <button
                onClick={() => handleDeletePhoto(p.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5">
              <h4 className="font-bold text-stone-900 text-sm leading-tight">{p.title}</h4>
              <p className="text-xs text-stone-500 mt-0.5">{p.relationshipOrPlace} ({p.year})</p>
              <p className="text-xs text-rose-800 font-semibold mt-2 line-clamp-2">
                Q: "{p.memoryPromptQuestion}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
