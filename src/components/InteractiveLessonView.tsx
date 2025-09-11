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
  const [speechError, setSpeechError] = useState(false);
  const [lastNarrationAttempt, setLastNarrationAttempt] = useState(0);

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

  // Comprehensive lesson content library
  const getLessonContent = (title: string, category: string): LessonStep[] => {
    if (title === "Basic Piano Posture") {
      return [
        {
          id: 1,
          title: "Правильная посадка за пианино",
          content: "Правильная посадка - это основа успешной игры на пианино. Сядьте на край стула или скамейки, так чтобы ваши ноги твердо стояли на полу или на подставке для ног. Спина должна быть прямой, но расслабленной.",
          audioText: "Правильная посадка - это основа успешной игры на пианино. Сядьте на край стула, спина прямая, ноги на полу.",
          tip: "Высота стула должна позволять локтям находиться на уровне клавиш или чуть выше"
        },
        {
          id: 2,
          title: "Положение рук и запястий",
          content: "Руки должны висеть свободно по бокам. Поднимите их к клавишам, сохраняя естественное положение. Запястья должны быть на одном уровне с кистями, не опущены и не подняты слишком высоко.",
          audioText: "Руки висят свободно, запястья на уровне кистей, никакого напряжения в плечах.",
          rightHandNotes: ['C4'],
          tip: "Представьте, что держите в руках маленький мячик - такой должна быть форма кисти"
        },
        {
          id: 3,
          title: "Форма пальцев и касание клавиш",
          content: "Пальцы должны быть слегка изогнуты, как будто держат маленький мяч. Касайтесь клавиш подушечками пальцев, а не кончиками. Большой палец касается клавиши боковой стороной.",
          audioText: "Пальцы изогнуты, касаемся клавиш подушечками, большой палец - боковой стороной.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
          tip: "Каждый палец должен нажимать свою клавишу независимо от других"
        },
        {
          id: 4,
          title: "Упражнение на независимость пальцев",
          content: "Поставьте все пальцы правой руки на клавиши C-D-E-F-G. Нажимайте каждый палец по очереди, удерживая остальные на клавишах без нажатия. Это развивает независимость пальцев.",
          audioText: "Ставим пальцы на клавиши до-ре-ми-фа-соль, нажимаем каждый по очереди, остальные просто лежат на клавишах.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
          tip: "Начинайте медленно, следите за тем, чтобы ненужные пальцы не поднимались"
        },
        {
          id: 5,
          title: "Практическое применение",
          content: "Теперь применим правильную посадку в простой мелодии. Играем простую гамму До мажор правой рукой, следя за осанкой и положением рук.",
          audioText: "Применяем все изученное в простой мелодии. Играем гамму до мажор, следим за посадкой.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          tip: "Если устали - остановитесь и проверьте осанку"
        }
      ];
    }
    
    if (title === "Major Scales") {
      return [
        {
          id: 1,
          title: "Что такое мажорная гамма",
          content: "Мажорная гамма - это последовательность из 8 нот, построенная по формуле: тон-тон-полутон-тон-тон-тон-полутон. Это основа западной музыки. Гамма До мажор состоит только из белых клавиш.",
          audioText: "Мажорная гамма - последовательность из восьми нот по формуле тон-тон-полутон-тон-тон-тон-полутон.",
        },
        {
          id: 2,
          title: "Аппликатура правой руки",
          content: "В гамме До мажор правая рука использует аппликатуру: 1-2-3-1-2-3-4-5 (большой палец-указательный-средний-большой-указательный-средний-безымянный-мизинец). Большой палец подкладывается под 3-й палец на ноте Фа.",
          audioText: "Аппликатура правой руки: один-два-три-один-два-три-четыре-пять. Большой палец подкладываем на ноте фа.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          tip: "Подкладывание большого пальца должно быть плавным, без рывков"
        },
        {
          id: 3,
          title: "Аппликатура левой руки",
          content: "Левая рука играет гамму в нисходящем направлении с аппликатурой: 5-4-3-2-1-3-2-1. Третий палец перекладывается через большой на ноте Соль.",
          audioText: "Левая рука: пять-четыре-три-два-один-три-два-один. Третий палец перекладываем через большой на ноте соль.",
          leftHandNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          tip: "Перекладывание 3-го пальца должно быть легким и точным"
        },
        {
          id: 4,
          title: "Координация двух рук",
          content: "Теперь играем гамму двумя руками в противоположном движении: правая вверх, левая вниз. Начинаем медленно, следим за синхронностью нажатий.",
          audioText: "Играем двумя руками: правая вверх, левая вниз одновременно. Начинаем медленно.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          leftHandNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          tip: "Считайте вслух: 1-2-3-4-5-6-7-8, это поможет синхронизации"
        },
        {
          id: 5,
          title: "Игра в разных темпах",
          content: "Практикуем гамму в разных темпах: медленно (60 bpm), умеренно (80 bpm), быстро (100 bpm). Используйте метроном для точности.",
          audioText: "Практикуем в разных темпах с метрономом: медленно, умеренно, быстро.",
          rightHandNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          leftHandNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          tip: "Начинайте всегда с медленного темпа, точность важнее скорости"
        }
      ];
    }
    
    if (title === "Basic Chords") {
      return [
        {
          id: 1,
          title: "Что такое аккорд",
          content: "Аккорд - это одновременное звучание трех или более нот. Трезвучие - самый простой аккорд из трех нот: основной тон (прима), терция и квинта. Мажорные аккорды звучат ярко и радостно.",
          audioText: "Аккорд - одновременное звучание трех или более нот. Трезвучие состоит из примы, терции и квинты.",
        },
        {
          id: 2,
          title: "Строение мажорного трезвучия",
          content: "Мажорное трезвучие До состоит из нот До-Ми-Соль. Между До и Ми - большая терция (4 полутона), между Ми и Соль - малая терция (3 полутона). Эта структура дает характерное мажорное звучание.",
          audioText: "Мажорное трезвучие до состоит из нот до-ми-соль. Большая терция плюс малая терция.",
          rightHandNotes: ['C4', 'E4', 'G4'],
          tip: "Запомните звучание мажорного трезвучия - оно всегда радостное и устойчивое"
        },
        {
          id: 3,
          title: "Позиция рук для аккордов",
          content: "Для игры трезвучия используйте пальцы 1-3-5 (большой-средний-мизинец) правой руки. Рука должна быть округлой, запястье на уровне кисти. Нажимайте все ноты одновременно с одинаковой силой.",
          audioText: "Используем пальцы один-три-пять правой руки. Нажимаем все ноты одновременно с одинаковой силой.",
          rightHandNotes: ['C4', 'E4', 'G4'],
          tip: "Представьте, что берете мяч - такая должна быть форма руки при игре аккорда"
        },
        {
          id: 4,
          title: "Последовательность аккордов",
          content: "Изучим простую последовательность: C-F-G-C (До мажор - Фа мажор - Соль мажор - До мажор). Это основа многих песен. Переходите от аккорда к аккорду плавно, ищите общие ноты.",
          audioText: "Играем последовательность до мажор - фа мажор - соль мажор - до мажор. Переходим плавно.",
          rightHandNotes: ['C4', 'E4', 'G4'],
          practiceNotes: ['C4', 'E4', 'G4', 'F4', 'A4', 'C5', 'G4', 'B4', 'D5', 'C4', 'E4', 'G4'],
          tip: "Ищите общие ноты между аккордами - они помогают плавному переходу"
        },
        {
          id: 5,
          title: "Ритмические паттерны",
          content: "Практикуем разные ритмы с аккордами: четверти, восьмые, синкопы. Начните с простого: играйте каждый аккорд на каждую долю, затем добавьте ритмические вариации.",
          audioText: "Практикуем разные ритмы: четверти, восьмые, синкопы. Начинаем с простого ритма.",
          rightHandNotes: ['C4', 'E4', 'G4'],
          tip: "Используйте метроном для точности ритма. Сначала медленно, потом быстрее"
        }
      ];
    }
    
    // Default generic lesson if specific content not found
    return [
      {
        id: 1,
        title: "Введение в урок",
        content: `Добро пожаловать на урок "${title}"! Этот урок поможет вам изучить основы ${category === 'basics' ? 'базовой техники' : category === 'scales' ? 'гамм' : 'гармонии'}.`,
        audioText: `Добро пожаловать на урок ${title}. Изучаем основы музыкальной теории и практики.`,
      },
      {
        id: 2,
        title: "Основные понятия",
        content: "Изучим основные теоретические понятия, которые понадобятся в этом уроке. Понимание теории поможет вам быстрее освоить практическую часть.",
        audioText: "Изучаем основные теоретические понятия для практического применения.",
      },
      {
        id: 3,
        title: "Практические упражнения",
        content: "Переходим к практической части. Начнем с простых упражнений и постепенно увеличим сложность.",
        audioText: "Переходим к практике. Начинаем с простых упражнений.",
        rightHandNotes: category === 'scales' ? ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] : ['C4', 'E4', 'G4'],
        tip: "Начинайте медленно и следите за правильностью исполнения"
      }
    ];
  };

  // Generate comprehensive lesson content based on lesson type
  const generateLessonSteps = useCallback((lesson: any): LessonStep[] => {
    // Create detailed lessons based on lesson title
    const lessonContent = getLessonContent(lesson.title, lesson.category);
    return lessonContent;
  }, []);

  const lessonSteps = generateLessonSteps(lesson);

  // Text-to-Speech function using Web Speech API
  const speakText = useCallback(async (text: string) => {
    if (!audioEnabled || speechError) return;
    
    // Prevent rapid-fire attempts
    const now = Date.now();
    if (now - lastNarrationAttempt < 2000) return; // 2 second cooldown
    
    setLastNarrationAttempt(now);
    setIsNarrating(true);
    
    try {
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to find a better voice
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
          setSpeechError(false);
        };
        
        utterance.onerror = () => {
          setIsNarrating(false);
          setSpeechError(true);
          console.log('Speech synthesis not available');
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsNarrating(false);
        setSpeechError(true);
      }
    } catch (error) {
      setIsNarrating(false);
      setSpeechError(true);
    }
  }, [audioEnabled, speechError, lastNarrationAttempt]);

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

  // Auto-narrate when step changes (only if no speech error)
  useEffect(() => {
    if (currentStepData?.audioText && audioEnabled && !speechError) {
      setTimeout(() => speakText(currentStepData.audioText), 500);
    }
  }, [currentStep, currentStepData, audioEnabled]); // Removed speakText from deps to prevent loops

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
                  onClick={() => {
                    setSpeechError(false); // Reset error when manually clicking
                    speakText(currentStepData.audioText);
                  }}
                  disabled={isNarrating}
                  variant="secondary"
                  size="sm"
                >
                  <Headphones size={16} className="mr-2" />
                  {isNarrating ? 'Speaking...' : speechError ? 'Try Narration' : 'Play Narration'}
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