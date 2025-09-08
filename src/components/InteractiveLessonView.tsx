import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, ArrowLeft, ArrowRight, Volume2, VolumeX, 
  Hand, Music, CheckCircle, RotateCcw, Headphones 
} from 'lucide-react';
import * as Tone from 'tone';
import VirtualPiano from './VirtualPiano';

interface LessonStep {
  id: number;
  title: string;
  content: string;
  audioText: string;
  leftHandNotes?: string[];
  rightHandNotes?: string[];
  practiceNotes?: string[];
  tip?: string;
}

interface InteractiveLessonViewProps {
  lesson: {
    id: number;
    title: string;
    category: string;
    duration: string;
    description: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

const InteractiveLessonView: React.FC<InteractiveLessonViewProps> = ({
  lesson,
  onComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [synth, setSynth] = useState<Tone.Sampler | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  // Initialize Tone.js piano sampler with better sounds
  useEffect(() => {
    // Create a piano sampler with multiple samples for better sound quality
    const pianoSampler = new Tone.Sampler({
      urls: {
        C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
        "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3",
        "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3",
        A4: "https://tonejs.github.io/audio/salamander/A4.mp3",
        C5: "https://tonejs.github.io/audio/salamander/C5.mp3",
        "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3",
        "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3",
        A5: "https://tonejs.github.io/audio/salamander/A5.mp3",
      },
      release: 1,
      baseUrl: "",
    }).toDestination();

    // Add reverb and compressor for more realistic sound
    const reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.3,
    }).toDestination();
    
    const compressor = new Tone.Compressor({
      threshold: -30,
      ratio: 3,
      attack: 0.003,
      release: 0.1,
    });

    pianoSampler.chain(compressor, reverb);
    setSynth(pianoSampler);
    
    return () => {
      pianoSampler.dispose();
      reverb.dispose();
      compressor.dispose();
    };
  }, []);

  // Generate lesson steps based on the lesson content
  const generateLessonSteps = useCallback((lesson: any): LessonStep[] => {
    const baseSteps: LessonStep[] = [
      {
        id: 1,
        title: "Introduction",
        content: `Welcome to ${lesson.title}! In this lesson, you'll learn ${lesson.description.toLowerCase()}. We'll break this down into manageable steps, starting with the fundamentals.`,
        audioText: `Welcome to ${lesson.title}. In this lesson, you'll learn ${lesson.description}. Let's start with the fundamentals.`,
      },
      {
        id: 2,
        title: "Understanding the Concept",
        content: `Let's begin by understanding what ${lesson.title.toLowerCase()} means in music theory. This concept is fundamental to ${lesson.category} and will help you in your musical journey.`,
        audioText: `Let's begin by understanding what ${lesson.title} means in music theory. This concept is fundamental to ${lesson.category}.`,
      },
    ];

    // Add category-specific steps
    if (lesson.category === 'basics') {
      baseSteps.push({
        id: 3,
        title: "Basic Exercise",
        content: "Let's practice with a simple exercise. Try playing these notes with your right hand.",
        audioText: "Now let's practice with a simple exercise. Try playing these notes with your right hand.",
        rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
        tip: "Keep your wrist relaxed and fingers curved"
      });
    } else if (lesson.category === 'scales') {
      baseSteps.push({
        id: 3,
        title: "Scale Pattern",
        content: "Let's learn the basic scale pattern. Start with your right hand, then we'll add the left hand.",
        audioText: "Let's learn the basic scale pattern. Start with your right hand, then we'll add the left hand.",
        rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        leftHandNotes: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
      });
    } else if (lesson.category === 'harmony') {
      baseSteps.push({
        id: 3,
        title: "Chord Structure",
        content: "Let's build a chord step by step. First the root note, then add the third and fifth.",
        audioText: "Let's build a chord step by step. First the root note, then add the third and fifth.",
        rightHandNotes: ['C4', 'E4', 'G4'],
        tip: "Listen to how each note adds to the harmony"
      });
    }

    baseSteps.push({
      id: 4,
      title: "Both Hands Practice",
      content: "Now let's coordinate both hands. Start slowly and gradually increase the tempo.",
      audioText: "Now let's coordinate both hands. Start slowly and gradually increase the tempo.",
      leftHandNotes: ['C3', 'G3', 'C3', 'G3'],
      rightHandNotes: ['E4', 'G4', 'E4', 'G4'],
      tip: "Focus on timing and coordination between hands"
    });

    baseSteps.push({
      id: 5,
      title: "Completion",
      content: `Excellent work! You've completed the ${lesson.title} lesson. Practice what you've learned regularly to reinforce these concepts.`,
      audioText: `Excellent work! You've completed the ${lesson.title} lesson. Keep practicing to reinforce these concepts.`,
    });

    return baseSteps;
  }, []);

  const lessonSteps = generateLessonSteps(lesson);

  // Text-to-Speech function using Web Speech API
  const speakText = useCallback(async (text: string) => {
    if (!audioEnabled) return;
    
    setIsNarrating(true);
    
    try {
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to find a better voice (prefer female voices for teaching)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Sarah') || voice.name.includes('Samantha'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsNarrating(false);
        };
        
        utterance.onerror = () => {
          setIsNarrating(false);
          console.error('Speech synthesis error');
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: show text in console and stop narrating state
        console.log('Narration:', text);
        setIsNarrating(false);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsNarrating(false);
    }
  }, [audioEnabled]);

  // Play piano notes with more realistic timing and dynamics
  const playNotes = useCallback(async (notes: string[], hand: 'left' | 'right' = 'right') => {
    if (!synth || !audioEnabled) return;
    
    setIsPlaying(true);
    await Tone.start();
    
    // Add slight timing variations for more human-like playing
    const baseDelay = hand === 'left' ? 0 : 0.02; // Left hand slightly ahead
    
    for (let i = 0; i < notes.length; i++) {
      const timing = Tone.now() + baseDelay + i * 0.6 + (Math.random() * 0.02 - 0.01);
      const velocity = 0.7 + (Math.random() * 0.2 - 0.1); // Slight velocity variation
      const duration = "4n";
      
      if (synth.triggerAttackRelease) {
        synth.triggerAttackRelease(notes[i], duration, timing, velocity);
      }
    }
    
    setTimeout(() => setIsPlaying(false), notes.length * 600 + 1000);
  }, [synth, audioEnabled]);

  const currentStepData = lessonSteps[currentStep];
  const progress = ((currentStep + 1) / lessonSteps.length) * 100;

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
  };

  // Load voices when component mounts
  useEffect(() => {
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
      let voices = window.speechSynthesis.getVoices();
      
      // If voices aren't loaded yet, wait for them
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Auto-narrate when step changes
  useEffect(() => {
    if (currentStepData?.audioText && audioEnabled) {
      setTimeout(() => speakText(currentStepData.audioText), 500);
    }
  }, [currentStep, currentStepData, speakText, audioEnabled]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-white mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBack}
            className="text-white border-white hover:bg-white hover:text-purple-600"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Lessons
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-white border-white hover:bg-white hover:text-purple-600"
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
        <div className="flex items-center gap-4 text-lg opacity-90 mb-4">
          <Badge variant="secondary">{lesson.category}</Badge>
          <span>Step {currentStep + 1} of {lessonSteps.length}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lesson Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Music size={20} />
                  {currentStepData.title}
                </CardTitle>
                {completedSteps.has(currentStep) && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentStepData.content}
              </p>
              
              {currentStepData.tip && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start gap-2">
                    <div className="font-medium text-blue-700 dark:text-blue-300">💡 Tip:</div>
                    <p className="text-blue-700 dark:text-blue-300">{currentStepData.tip}</p>
                  </div>
                </div>
              )}

              {/* Audio Controls */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => speakText(currentStepData.audioText)}
                  disabled={isNarrating}
                  variant="secondary"
                  size="sm"
                >
                  <Headphones size={16} className="mr-2" />
                  {isNarrating ? 'Speaking...' : 'Play Narration'}
                </Button>
                
                {currentStepData.rightHandNotes && (
                  <Button
                    onClick={() => playNotes(currentStepData.rightHandNotes!, 'right')}
                    disabled={isPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <Hand size={16} className="mr-2" />
                    Right Hand Example
                  </Button>
                )}
                
                {currentStepData.leftHandNotes && (
                  <Button
                    onClick={() => playNotes(currentStepData.leftHandNotes!, 'left')}
                    disabled={isPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <Hand size={16} className="mr-2" />
                    Left Hand Example
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Virtual Piano for Practice */}
          {(currentStepData.rightHandNotes || currentStepData.leftHandNotes) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Practice Piano</CardTitle>
              </CardHeader>
              <CardContent>
                <VirtualPiano 
                  onNotePlay={(note) => console.log('Note played:', note)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lesson Navigation & Progress */}
        <div className="space-y-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Step Navigation</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1"
                  >
                    {currentStep === lessonSteps.length - 1 ? 'Complete' : 'Next'}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
                
                {!completedSteps.has(currentStep) && currentStep < lessonSteps.length - 1 && (
                  <Button
                    onClick={handleStepComplete}
                    variant="secondary"
                    className="w-full"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Mark Step Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step Overview */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Lesson Steps</h3>
              <div className="space-y-2">
                {lessonSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      index === currentStep 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : completedSteps.has(index)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {index + 1}. {step.title}
                        </span>
                      </div>
                      {completedSteps.has(index) && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLessonView;