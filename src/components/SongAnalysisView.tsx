import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, RotateCcw, Hand, Music, Volume2, 
  ChevronLeft, ChevronRight, Clock, Target 
} from 'lucide-react';
import * as Tone from 'tone';

interface SongPart {
  id: number;
  name: string;
  description: string;
  notes: string[] | string[][];
  timing: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface SongAnalysisViewProps {
  song: {
    id: number;
    title: string;
    artist: string;
    parts: {
      leftHand: SongPart[];
      rightHand: SongPart[];
    };
  };
  onBack: () => void;
}

export const SongAnalysisView: React.FC<SongAnalysisViewProps> = ({ song, onBack }) => {
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [selectedPart, setSelectedPart] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    return () => {
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  const currentParts = song.parts[selectedHand === 'left' ? 'leftHand' : 'rightHand'];
  const currentPart = currentParts[selectedPart];

  const difficultyColors = {
    beginner: 'bg-success/20 text-success border-success/30',
    intermediate: 'bg-warning/20 text-warning border-warning/30',
    advanced: 'bg-destructive/20 text-destructive border-destructive/30'
  };

  const playPart = async () => {
    if (!synthRef.current || !currentPart) return;
    
    await Tone.start();
    
    if (isPlaying) {
      Tone.Transport.stop();
      sequenceRef.current?.dispose();
      setIsPlaying(false);
      setPlaybackPosition(0);
      return;
    }

    const { notes, timing } = currentPart;
    setIsPlaying(true);

    // Create a sequence for the part
    const sequence = new Tone.Sequence((time, note) => {
      if (Array.isArray(note)) {
        // Chord - play multiple notes
        note.forEach(n => synthRef.current?.triggerAttackRelease(n, "8n", time));
      } else {
        // Single note
        synthRef.current?.triggerAttackRelease(note, "8n", time);
      }
      
      Tone.Draw.schedule(() => {
        setPlaybackPosition(prev => prev + 1);
      }, time);
    }, notes, "4n");

    sequenceRef.current = sequence;
    sequence.start(0);
    Tone.Transport.start();

    // Stop after the sequence finishes
    setTimeout(() => {
      Tone.Transport.stop();
      setIsPlaying(false);
      setPlaybackPosition(0);
    }, (timing[timing.length - 1] + 1) * 500); // Approximate duration
  };

  const resetPlayback = () => {
    Tone.Transport.stop();
    sequenceRef.current?.dispose();
    setIsPlaying(false);
    setPlaybackPosition(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 text-white mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft size={20} className="mr-2" />
          Back to Library
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="text-lg opacity-90">{song.artist} • AI Analyzed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hand Selection & Parts List */}
        <Card className="lg:col-span-1 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand size={20} />
              Practice Parts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hand Selection */}
            <div className="flex gap-2">
              <Button
                variant={selectedHand === 'left' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('left');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="flex-1"
              >
                Left Hand
              </Button>
              <Button
                variant={selectedHand === 'right' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('right');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="flex-1"
              >
                Right Hand
              </Button>
            </div>

            {/* Parts List */}
            <div className="space-y-2">
              {currentParts.map((part, index) => (
                <div
                  key={part.id}
                  onClick={() => {
                    setSelectedPart(index);
                    resetPlayback();
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPart === index 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{part.name}</h4>
                    <Badge variant="outline" className={difficultyColors[part.difficulty]}>
                      {part.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{part.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Practice Area */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music size={20} />
                {currentPart?.name}
              </CardTitle>
              <Badge variant="outline" className={difficultyColors[currentPart?.difficulty || 'beginner']}>
                {currentPart?.difficulty}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentPart?.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Controls */}
            <div className="flex items-center gap-4">
              <Button
                onClick={playPart}
                className="flex items-center gap-2"
                disabled={!currentPart}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Stop' : 'Play Part'}
              </Button>
              
              <Button
                variant="outline"
                onClick={resetPlayback}
                disabled={!isPlaying && playbackPosition === 0}
              >
                <RotateCcw size={16} className="mr-2" />
                Reset
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 size={16} />
                Audio Preview
              </div>
            </div>

            {/* Visual Note Display */}
            {currentPart && (
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Notes to Practice
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {currentPart.notes.map((note, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center text-sm rounded border transition-all ${
                        playbackPosition > index && isPlaying
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border'
                      }`}
                    >
                      {Array.isArray(note) ? note.join(' + ') : note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Tips */}
            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 Practice Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start slowly and focus on accuracy over speed</li>
                <li>• Practice each hand separately before combining</li>
                <li>• Use the audio preview to learn the rhythm</li>
                <li>• Repeat difficult sections multiple times</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPart(Math.max(0, selectedPart - 1));
                  resetPlayback();
                }}
                disabled={selectedPart === 0}
              >
                <ChevronLeft size={16} className="mr-2" />
                Previous Part
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPart(Math.min(currentParts.length - 1, selectedPart + 1));
                  resetPlayback();
                }}
                disabled={selectedPart === currentParts.length - 1}
              >
                Next Part
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};