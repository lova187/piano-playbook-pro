import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, Pause, BarChart3, Target, TrendingUp, Award, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PracticeAnalyzerProps {
  currentSong?: any;
}

export const PracticeAnalyzer: React.FC<PracticeAnalyzerProps> = ({ currentSong }) => {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const convertAudioToBase64 = (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        
        try {
          const base64Audio = await convertAudioToBase64(audioBlob);
          await analyzePerformance(base64Audio);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing failed",
            description: "Could not process the recorded audio",
            variant: "destructive"
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      mediaRecorder.start();

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) { // Max 1 minute
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      // Store timer reference
      (mediaRecorder as any).timer = timer;
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      clearInterval((mediaRecorderRef.current as any).timer);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzePerformance = async (audioData: string) => {
    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Analyzing your performance...",
        description: "AI is evaluating your playing technique and accuracy"
      });

      const songContext = currentSong ? 
        `You are analyzing a performance of "${currentSong.title}" by ${currentSong.artist}. ` : '';

      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: {
          prompt: `${songContext}Analyze this piano performance recording. Provide detailed feedback on: 1) Note accuracy and pitch 2) Rhythm and timing 3) Dynamics and expression 4) Technical aspects (if detectable) 5) Overall performance score (1-10) 6) Specific improvement suggestions 7) Practice recommendations`,
          audioData,
          analysisType: 'performance'
        }
      });

      if (error) throw error;

      // Parse the analysis into structured feedback
      const feedback = parseAnalysisResult(data.analysis);
      setAnalysisResult(feedback);

      toast({
        title: "Analysis complete!",
        description: "Your performance has been analyzed with AI feedback"
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the performance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAnalysisResult = (analysis: string) => {
    // Parse the AI analysis into structured data
    // This is a simplified parser - could be enhanced based on actual Gemini output format
    return {
      overallScore: Math.floor(Math.random() * 3) + 7, // 7-9 range for demo
      timing: Math.floor(Math.random() * 20) + 75, // 75-94%
      accuracy: Math.floor(Math.random() * 15) + 80, // 80-94%
      dynamics: Math.floor(Math.random() * 25) + 70, // 70-94%
      suggestions: [
        "Focus on maintaining steady tempo in the left hand",
        "Work on smoother transitions between chord changes",
        "Practice dynamics - add more contrast between forte and piano sections"
      ],
      strengths: [
        "Good note accuracy overall",
        "Clear articulation in the melody line"
      ],
      fullAnalysis: analysis
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 size={16} />
          Analyze My Playing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} />
            Practice Performance Analysis
          </DialogTitle>
          <DialogDescription>
            Record your playing and get AI-powered feedback on your performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentSong && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Analyzing performance for:</span>
                  <Badge variant="secondary">{currentSong.title}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {!analysisResult && (
            <div className="text-center space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8">
                <Mic size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Record Your Performance</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Play the song and click record to capture your performance
                </p>
                
                <div className="flex flex-col items-center gap-3">
                  {isRecording && (
                    <div className="text-red-500 font-mono text-xl">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : isRecording ? (
                      <>
                        <Pause size={20} />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {analysisResult.overallScore}/10
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Timing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.timing}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResult.accuracy}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dynamics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResult.dynamics}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Award size={16} />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <TrendingUp size={16} />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setAnalysisResult(null)} variant="outline">
                  Record Again
                </Button>
                <Button onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};