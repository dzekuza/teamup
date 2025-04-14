import React, { useState } from 'react';
import { Event, MatchResult } from '../types';
import { useAuth } from '../hooks/useAuth';

interface MatchResultsDialogProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onSave: (results: MatchResult[]) => void;
}

interface ScoreRow {
  score: string;
  winner: 'Team A' | 'Team B';
}

export const MatchResultsDialog: React.FC<MatchResultsDialogProps> = ({
  event,
  open,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const isEventOwner = user?.uid === event.createdBy;
  const [scores, setScores] = useState<ScoreRow[]>(() => {
    if (!event.matchResults) return [{ score: '', winner: 'Team A' }];
    
    if (Array.isArray(event.matchResults)) {
      return event.matchResults.map(result => ({
        score: `${result.teamAScore}/${result.teamBScore}`,
        winner: result.winner
      }));
    }
    
    return [{
      score: `${event.matchResults.teamAScore}/${event.matchResults.teamBScore}`,
      winner: event.matchResults.winner
    }];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const results = scores.map(row => {
      const [teamAScore, teamBScore] = row.score.split('/').map(s => s.trim());
      return {
        teamAScore,
        teamBScore,
        winner: row.winner,
      };
    });
    
    onSave(results);
  };

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...scores];
    newScores[index].score = value;
    setScores(newScores);
  };

  const handleWinnerChange = (index: number, value: 'Team A' | 'Team B') => {
    const newScores = [...scores];
    newScores[index].winner = value;
    setScores(newScores);
  };

  const addRow = () => {
    setScores([...scores, { score: '', winner: 'Team A' }]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-3xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Match results</h2>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Team A */}
          <div>
            <h3 className="text-xl font-medium text-white mb-4">Team A</h3>
            <div className="flex flex-col gap-2">
              {event.players.slice(0, 2).map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A2A2A] rounded-full" />
                  <span className="text-gray-400">{player.name || 'Unknown Player'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team B */}
          <div>
            <h3 className="text-xl font-medium text-white mb-4">Team B</h3>
            <div className="flex flex-col gap-2">
              {event.players.slice(2, 4).map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A2A2A] rounded-full" />
                  <span className="text-gray-400">{player.name || 'Unknown Player'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Details</h3>
            
            {/* Score rows */}
            {scores.map((row, index) => (
              <div key={index} className="grid grid-cols-2 gap-8">
                <div>
                  <input
                    type="text"
                    value={row.score}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    placeholder="Enter result"
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                    required
                    disabled={!isEventOwner}
                  />
                </div>
                <div>
                  <select
                    value={row.winner}
                    onChange={(e) => handleWinnerChange(index, e.target.value as 'Team A' | 'Team B')}
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                    required
                    disabled={!isEventOwner}
                  >
                    <option value="Team A">Team A</option>
                    <option value="Team B">Team B</option>
                  </select>
                </div>
              </div>
            ))}

            {/* Add row button - Only show for event owner */}
            {isEventOwner && (
              <button
                type="button"
                onClick={addRow}
                className="text-[#C1FF2F] hover:underline text-sm"
              >
                Add row
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white hover:bg-[#2A2A2A] rounded-xl transition-colors"
            >
              Close
            </button>
            {isEventOwner && (
              <button
                type="submit"
                className="px-4 py-2 bg-[#C1FF2F] text-black font-medium rounded-xl hover:bg-[#B1EF1F] transition-colors"
              >
                Save changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}; 