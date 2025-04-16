import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Event, MatchResult, Player } from '../types';
import { useUpdateMatchResult } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';

interface MatchResultsDialogProps {
  open: boolean;
  onClose: () => void;
  event: Event;
  user: any;
  onSave?: (results: MatchResult[]) => Promise<void>;
}

interface ScoreRow {
  id: string;
  label: string;
  team1Score: string;
  team2Score: string;
}

export const MatchResultsDialog: React.FC<MatchResultsDialogProps> = ({
  open,
  onClose,
  event,
  user,
  onSave
}) => {
  const { updateMatchResult, loading } = useUpdateMatchResult();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const { user: authUser } = useAuth();
  const isEventOwner = authUser?.uid === event.createdBy;
  const [isMobile, setIsMobile] = useState(false);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle touch start event
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(null);
  };
  
  // Handle touch move event
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  // Handle touch end event to determine swipe direction
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Determine distance of swipe
    const distance = touchEnd - touchStart;
    
    // If distance is greater than 100px, consider it a swipe down
    if (distance > 100) {
      onClose();
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      // Add a delay to allow the animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setIsMobile(matches);
  }, [matches]);

  // Initialize scores when the dialog opens
  useEffect(() => {
    if (open) {
      setScores([
        { id: '1', label: 'Set 1', team1Score: '', team2Score: '' },
        { id: '2', label: 'Set 2', team1Score: '', team2Score: '' },
        { id: '3', label: 'Set 3', team1Score: '', team2Score: '' }
      ]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    
    const validScores = scores.filter(score => 
      score.team1Score !== '' && score.team2Score !== ''
    );
    
    if (validScores.length === 0) return;
    
    const matchResults = validScores.map(score => {
      const teamAScore = parseInt(score.team1Score, 10);
      const teamBScore = parseInt(score.team2Score, 10);
      
      const winner: 'Team A' | 'Team B' = teamAScore > teamBScore ? 'Team A' : 'Team B';
      
      return {
        set: score.label,
        teamAScore: score.team1Score,
        teamBScore: score.team2Score,
        winner
      };
    });
    
    if (onSave) {
      await onSave(matchResults);
    } else {
      const success = await updateMatchResult(event.id, matchResults);
      if (success) {
        onClose();
      }
    }
  };

  const handleScoreChange = (id: string, team: 'team1Score' | 'team2Score', value: string) => {
    // Only allow numeric input
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setScores(prevScores =>
      prevScores.map(score =>
        score.id === id ? { ...score, [team]: value } : score
      )
    );
  };

  const renderContent = () => (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Match Results
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter the scores for each set
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {scores.map((score) => (
            <Grid item xs={12} key={score.id}>
              <Typography variant="body2" gutterBottom>
                {score.label}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Team 1"
                    variant="outlined"
                    value={score.team1Score}
                    onChange={(e) => handleScoreChange(score.id, 'team1Score', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0, max: 7 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Team 2"
                    variant="outlined"
                    value={score.team2Score}
                    onChange={(e) => handleScoreChange(score.id, 'team2Score', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0, max: 7 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Save Results
        </Button>
      </Box>
    </>
  );

  return isMobile ? (
    <div 
      className={`fixed inset-0 z-50 ${isVisible ? 'block' : 'hidden'}`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        transition: 'background-color 0.3s ease, opacity 0.3s ease',
        opacity: open ? 1 : 0
      }}
      onClick={onClose}
    >
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 bg-[#1E1E1E] rounded-t-xl max-h-[90vh] overflow-auto transform transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full flex justify-center py-2">
          <div className="w-10 h-1 bg-gray-500 rounded-full"></div>
        </div>
        {renderContent()}
      </div>
    </div>
  ) : (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Match Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter the scores for each set
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {scores.map((score) => (
            <Grid item xs={12} key={score.id}>
              <Typography variant="body2" gutterBottom>
                {score.label}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Team 1"
                    variant="outlined"
                    value={score.team1Score}
                    onChange={(e) => handleScoreChange(score.id, 'team1Score', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0, max: 7 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Team 2"
                    variant="outlined"
                    value={score.team2Score}
                    onChange={(e) => handleScoreChange(score.id, 'team2Score', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0, max: 7 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Save Results
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchResultsDialog; 