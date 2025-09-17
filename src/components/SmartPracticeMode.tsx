import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, Zap, Clock, Star, TrendingUp } from 'lucide-react';
import { PracticeAnalyzer } from './PracticeAnalyzer';
import VirtualPiano from './VirtualPiano';

interface SmartPracticeModeProps {
  songs: any[];
  userStats: any;
  onPracticeComplete: (sessionData: any) => void;
}

export const SmartPracticeMode: React.FC<SmartPracticeModeProps> = ({ 
  songs, 
  userStats, 
  onPracticeComplete 
}) => {
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [practiceSession, setPracticeSession] = useState<any>(null);
  const [currentPart, setCurrentPart] = useState<any>(null);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<string[]>([]);

  // AI-powered song recommendation based on user stats
  const getSmartRecommendations = () => {
    const { userLevel, accuracy, totalHours } = userStats;
    
    // Simple AI logic for recommendations
    const recommendations = [];
    
    if (accuracy < 80) {
      recommendations.push("Focus on accuracy with slower tempo songs");
    }
    if (userLevel < 3) {
      recommendations.push("Practice basic chord progressions");
    }
    if (totalHours < 10) {
      recommendations.push("Work on finger strength and positioning");
    }
    
    return recommendations;
  };

  const startSmartSession = (song: any) => {
    setCurrentSong(song);
    
    // Create adaptive practice session
    const session = {
      id: Date.now(),
      songId: song.id,
      startTime: Date.now(),
      parts: shuffleArray([...song.parts.leftHand, ...song.parts.rightHand]),
      currentPartIndex: 0,
      completedParts: [],
      totalParts: song.parts.leftHand.length + song.parts.rightHand.length
    };
    
    setPracticeSession(session);
    setCurrentPart(session.parts[0]);
    setAdaptiveRecommendations(getSmartRecommendations());
  };

  const completeCurrentPart = () => {
    if (!practiceSession) return;
    
    const updatedSession = {
      ...practiceSession,
      currentPartIndex: practiceSession.currentPartIndex + 1,
      completedParts: [...practiceSession.completedParts, currentPart.id]
    };
    
    setPracticeSession(updatedSession);
    
    const progress = (updatedSession.completedParts.length / updatedSession.totalParts) * 100;
    setSessionProgress(progress);
    
    if (updatedSession.currentPartIndex < updatedSession.parts.length) {
      setCurrentPart(updatedSession.parts[updatedSession.currentPartIndex]);
    } else {
      // Session complete
      finishSession(updatedSession);
    }
  };

  const finishSession = (session: any) => {
    const sessionData = {
      ...session,
      endTime: Date.now(),
      duration: Date.now() - session.startTime,
      completion: 100
    };
    
    onPracticeComplete(sessionData);
    setPracticeSession(null);
    setCurrentSong(null);
    setCurrentPart(null);
    setSessionProgress(0);
  };

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (practiceSession) {
    return (
      <div className="space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain size={20} className="text-primary" />
                Smart Practice Session
              </CardTitle>
              <Badge variant="secondary">{currentSong?.title}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Session Progress</span>
                <span>{practiceSession.completedParts.length} / {practiceSession.totalParts} parts</span>
              </div>
              <Progress value={sessionProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Current Part Practice */}
        {currentPart && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={18} />
                {currentPart.name}
                <Badge className={getDifficultyColor(currentPart.difficulty)}>
                  {currentPart.difficulty}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{currentPart.description}</p>
              
              {/* Practice Area */}
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Notes to Practice:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentPart.notes.map((note: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {Array.isArray(note) ? note.join('+') : note}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <VirtualPiano 
                  onNotePlay={(note) => console.log('Note played:', note)}
                  isRecording={false}
                  highlightedKeys={new Set()}
                  autoPlayActive={false}
                />
              </div>

              {/* Practice Tools */}
              <div className="flex gap-3">
                <Button onClick={completeCurrentPart}>
                  <Target size={16} className="mr-2" />
                  Mark Complete
                </Button>
                <PracticeAnalyzer currentSong={currentSong} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {adaptiveRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={18} />
                AI Practice Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {adaptiveRecommendations.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Practice Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} className="text-primary" />
            AI-Powered Smart Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get personalized practice sessions based on your skill level, progress, and learning goals.
          </p>
        </CardContent>
      </Card>

      {/* User Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.userLevel}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalHours}h</div>
              <div className="text-sm text-muted-foreground">Practice Time</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.practiceStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Songs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {songs.slice(0, 3).map((song) => (
              <div key={song.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{song.title}</h4>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getDifficultyColor(song.difficulty)}>
                    {song.difficulty}
                  </Badge>
                  <Button 
                    size="sm"
                    onClick={() => startSmartSession(song)}
                  >
                    <Clock size={14} className="mr-1" />
                    Practice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};