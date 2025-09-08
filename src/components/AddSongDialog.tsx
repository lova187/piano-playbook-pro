import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader, Music, Youtube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AddSongDialogProps {
  onSongAdded: (song: any) => void;
}

export const AddSongDialog: React.FC<AddSongDialogProps> = ({ onSongAdded }) => {
  const [open, setOpen] = useState(false);
  const [songInput, setSongInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputType, setInputType] = useState<'youtube' | 'name'>('name');
  const { toast } = useToast();

  const mockAnalyzeSong = async (input: string, type: 'youtube' | 'name') => {
    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    // Mock song data based on input
    const songTitle = type === 'youtube' 
      ? input.includes('watch?v=') ? 'YouTube Song' : input
      : input;
    
    const mockSong = {
      id: Date.now(),
      title: songTitle,
      artist: 'Unknown Artist',
      difficulty: 'intermediate',
      genre: 'pop',
      duration: '3:45',
      locked: false,
      analyzed: true,
      parts: {
        leftHand: [
          {
            id: 1,
            name: 'Introduction Bass Line',
            description: 'Simple bass pattern in C major',
            notes: ['C3', 'G3', 'E3', 'G3'],
            timing: [0, 0.5, 1, 1.5],
            difficulty: 'beginner'
          },
          {
            id: 2,
            name: 'Main Chord Progression',
            description: 'Block chords following I-V-vi-IV progression',
            notes: [['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3']],
            timing: [0, 1, 2, 3],
            difficulty: 'intermediate'
          },
          {
            id: 3,
            name: 'Bridge Section',
            description: 'Walking bass line with chord transitions',
            notes: ['F3', 'E3', 'D3', 'C3', 'B2', 'A2'],
            timing: [0, 0.25, 0.5, 0.75, 1, 1.25],
            difficulty: 'intermediate'
          }
        ],
        rightHand: [
          {
            id: 1,
            name: 'Main Melody',
            description: 'Primary vocal melody line',
            notes: ['G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4'],
            timing: [0, 0.5, 1, 1.5, 2, 2.5, 3],
            difficulty: 'beginner'
          },
          {
            id: 2,
            name: 'Harmony Line',
            description: 'Supporting harmonies and fills',
            notes: [['E4', 'G4'], ['F4', 'A4'], ['G4', 'B4'], ['A4', 'C5']],
            timing: [0, 1, 2, 3],
            difficulty: 'intermediate'
          },
          {
            id: 3,
            name: 'Embellishments',
            description: 'Decorative runs and ornaments',
            notes: ['C5', 'D5', 'E5', 'F5', 'E5', 'D5', 'C5'],
            timing: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75],
            difficulty: 'advanced'
          }
        ]
      }
    };

    return mockSong;
  };

  const handleAnalyzeSong = async () => {
    if (!songInput.trim()) {
      toast({
        title: "Please enter a song",
        description: "Enter either a YouTube link or song name",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Analyzing song...",
        description: "AI is breaking down the song into parts for each hand"
      });

      const analyzedSong = await mockAnalyzeSong(songInput, inputType);
      
      onSongAdded(analyzedSong);
      setSongInput('');
      setOpen(false);
      
      toast({
        title: "Song analyzed successfully!",
        description: `${analyzedSong.parts.leftHand.length + analyzedSong.parts.rightHand.length} practice parts created`
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Please try again with a different song",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
          <PlusCircle size={16} className="mr-2" />
          Add Song
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music size={20} />
            Add Song for AI Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={inputType === 'name' ? 'default' : 'outline'}
              onClick={() => setInputType('name')}
              className="flex-1"
            >
              Song Name
            </Button>
            <Button
              variant={inputType === 'youtube' ? 'default' : 'outline'}
              onClick={() => setInputType('youtube')}
              className="flex-1"
            >
              <Youtube size={16} className="mr-2" />
              YouTube Link
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="songInput">
              {inputType === 'youtube' ? 'YouTube URL' : 'Song Name & Artist'}
            </Label>
            <Input
              id="songInput"
              value={songInput}
              onChange={(e) => setSongInput(e.target.value)}
              placeholder={
                inputType === 'youtube' 
                  ? 'https://youtube.com/watch?v=...' 
                  : 'Song Title - Artist Name'
              }
              disabled={isAnalyzing}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">🤖 AI Analysis will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Break down the song into left & right hand parts</li>
              <li>Create practice sections with audio examples</li>
              <li>Assign difficulty levels to each part</li>
              <li>Generate practice recommendations</li>
            </ul>
          </div>

          <Button 
            onClick={handleAnalyzeSong}
            disabled={isAnalyzing || !songInput.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Analyzing Song...
              </>
            ) : (
              <>
                <Music size={16} className="mr-2" />
                Analyze & Add Song
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};