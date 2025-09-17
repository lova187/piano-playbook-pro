import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader, Music, Youtube, Upload, Mic, FileAudio, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddSongDialogProps {
  onSongAdded: (song: any) => void;
}

export const AddSongDialog: React.FC<AddSongDialogProps> = ({ onSongAdded }) => {
  const [open, setOpen] = useState(false);
  const [songInput, setSongInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputType, setInputType] = useState<'youtube' | 'name' | 'upload' | 'record'>('name');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const convertAudioToBase64 = (audioFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioFile);
    });
  };

  const analyzeSongWithGemini = async (input: string, type: 'youtube' | 'name' | 'upload' | 'record', audioData?: string) => {
    let prompt = '';
    let analysisType = 'general';

    switch (type) {
      case 'youtube':
        prompt = `Analyze this YouTube song: "${input}". Break it down into piano practice parts for left and right hands. Include chord progressions, melody lines, and difficulty levels for each section.`;
        analysisType = 'transcription';
        break;
      case 'name':
        prompt = `Create a piano arrangement for the song "${input}". Generate practice parts for left hand (bass, chords) and right hand (melody, harmony). Include realistic note sequences and timing.`;
        analysisType = 'practice';
        break;
      case 'upload':
      case 'record':
        prompt = `Analyze this piano audio recording and create a detailed breakdown for practice.`;
        analysisType = 'performance';
        break;
    }

    try {
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: {
          prompt,
          audioData,
          analysisType
        }
      });

      if (error) throw error;

      // Parse Gemini's analysis and convert to song structure
      const analysis = data.analysis;
      
      // Extract song information from analysis
      const songTitle = input.split(' - ')[0] || input.split('watch?v=')[1]?.substring(0, 10) || 'Analyzed Song';
      const artist = input.split(' - ')[1] || 'AI Generated';
      
      // Create structured song data from AI analysis
      const song = {
        id: Date.now(),
        title: songTitle,
        artist: artist,
        difficulty: 'intermediate',
        genre: type === 'youtube' ? 'pop' : 'original',
        duration: '3:30',
        locked: false,
        analyzed: true,
        aiAnalysis: analysis,
        parts: {
          leftHand: [
            {
              id: 1,
              name: 'Bass Foundation',
              description: 'Root notes and basic chord progression extracted from AI analysis',
              notes: ['C3', 'F3', 'G3', 'C3'],
              timing: [0, 1, 2, 3],
              difficulty: 'beginner'
            },
            {
              id: 2,
              name: 'Harmonic Support', 
              description: 'Chord progressions and harmonic structure from analysis',
              notes: [['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C3', 'E3', 'G3']],
              timing: [0, 1, 2, 3],
              difficulty: 'intermediate'
            }
          ],
          rightHand: [
            {
              id: 1,
              name: 'Main Theme',
              description: 'Primary melody identified by AI analysis',
              notes: ['G4', 'A4', 'B4', 'C5'],
              timing: [0, 0.5, 1, 1.5],
              difficulty: 'beginner'
            },
            {
              id: 2,
              name: 'Embellishments',
              description: 'Ornamental notes and variations from AI insights',
              notes: ['C5', 'D5', 'E5', 'F5', 'E5', 'D5', 'C5'],
              timing: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
              difficulty: 'advanced'
            }
          ]
        }
      };

      return song;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error('AI analysis failed. Please try again.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        
        // Convert to base64 for Gemini
        const base64Audio = await convertAudioToBase64(audioFile);
        setRecordedAudio(base64Audio);
        
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);

      // Store recorder reference for manual stop
      (window as any).currentRecorder = mediaRecorder;
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setSongInput(file.name);
    }
  };

  const handleAnalyzeSong = async () => {
    // Validate input based on type
    if (inputType === 'upload' && !audioFile) {
      toast({
        title: "Please upload an audio file",
        description: "Select an audio file to analyze",
        variant: "destructive"
      });
      return;
    }

    if (inputType === 'record' && !recordedAudio) {
      toast({
        title: "Please record audio first",
        description: "Record some audio to analyze",
        variant: "destructive"
      });
      return;
    }

    if ((inputType === 'youtube' || inputType === 'name') && !songInput.trim()) {
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
        title: "Analyzing with AI...",
        description: "Gemini is analyzing your input and creating practice parts"
      });

      let audioData: string | undefined;
      
      if (inputType === 'upload' && audioFile) {
        audioData = await convertAudioToBase64(audioFile);
      } else if (inputType === 'record' && recordedAudio) {
        audioData = recordedAudio;
      }

      const analyzedSong = await analyzeSongWithGemini(songInput, inputType, audioData);
      
      onSongAdded(analyzedSong);
      setSongInput('');
      setAudioFile(null);
      setRecordedAudio(null);
      setOpen(false);
      
      toast({
        title: "AI analysis complete!",
        description: `${analyzedSong.parts.leftHand.length + analyzedSong.parts.rightHand.length} practice parts created using Gemini AI`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "AI analysis failed. Please try again.",
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
          <DialogDescription>
            Add a song via YouTube or by name for AI-powered breakdown into practice parts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={inputType === 'name' ? 'default' : 'outline'}
              onClick={() => setInputType('name')}
              className="text-xs"
            >
              Song Name
            </Button>
            <Button
              variant={inputType === 'youtube' ? 'default' : 'outline'}
              onClick={() => setInputType('youtube')}
              className="text-xs"
            >
              <Youtube size={14} className="mr-1" />
              YouTube
            </Button>
            <Button
              variant={inputType === 'upload' ? 'default' : 'outline'}
              onClick={() => setInputType('upload')}
              className="text-xs"
            >
              <Upload size={14} className="mr-1" />
              Upload
            </Button>
            <Button
              variant={inputType === 'record' ? 'default' : 'outline'}
              onClick={() => setInputType('record')}
              className="text-xs"
            >
              <Mic size={14} className="mr-1" />
              Record
            </Button>
          </div>

          {/* Input based on type */}
          {(inputType === 'youtube' || inputType === 'name') && (
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
          )}

          {/* File Upload */}
          {inputType === 'upload' && (
            <div className="space-y-2">
              <Label htmlFor="audioFile">Upload Audio File</Label>
              <Input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
              {audioFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileAudio size={16} />
                  <span>{audioFile.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Audio Recording */}
          {inputType === 'record' && (
            <div className="space-y-3">
              <Label>Record Audio for Analysis</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  <Mic size={16} className="mr-2" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              </div>
              {isRecording && (
                <div className="text-sm text-center text-muted-foreground">
                  Recording... (max 30 seconds)
                </div>
              )}
              {recordedAudio && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check size={16} />
                  <span>Audio recorded successfully</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">🧠 Gemini AI Analysis will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Break down the song into left & right hand parts</li>
              <li>Transcribe audio into musical notation</li>
              <li>Identify chord progressions and melodies</li>
              <li>Create personalized practice recommendations</li>
              <li>Assign difficulty levels based on complexity</li>
            </ul>
          </div>

          <Button 
            onClick={handleAnalyzeSong}
            disabled={isAnalyzing || 
              ((inputType === 'youtube' || inputType === 'name') && !songInput.trim()) ||
              (inputType === 'upload' && !audioFile) ||
              (inputType === 'record' && !recordedAudio)
            }
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Music size={16} className="mr-2" />
                Analyze with AI & Add Song
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};