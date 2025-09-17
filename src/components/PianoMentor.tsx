import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Moon, Sun, Flame, Clock, Music, User, Calendar, Target, Cpu, BookOpen, 
  TrendingUp, Play, Pause, Headphones, ChevronRight, Award, BarChart3,
  Volume2, Settings, Search, Filter, Download, Upload, Share2, Menu, X,
  Check, AlertCircle, Loader, Home, GraduationCap, Trophy, Users,
  Mic, Camera, Repeat, SkipForward, SkipBack, Maximize2, MessageSquare,
  Heart, Star, Lock, Unlock, ArrowLeft, ArrowRight, PlusCircle, Piano
} from 'lucide-react';
import * as Tone from 'tone';
import { AddSongDialog } from './AddSongDialog';
import { SongAnalysisView } from './SongAnalysisView';
import { MidiController } from './MidiController';
import InteractiveLessonView from './InteractiveLessonView';
import { PracticeAnalyzer } from './PracticeAnalyzer';
import { SmartPracticeMode } from './SmartPracticeMode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VirtualPiano from './VirtualPiano';
import Metronome from './Metronome';
import PracticeTimer from './PracticeTimer';
import { useToast } from '@/components/ui/use-toast';

const PianoMentor: React.FC = () => {
  // State Management
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({ title: '', description: '', icon: '🏆' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Array<{ note: string; timestamp: number }>>([]);
  const [practiceMode, setPracticeMode] = useState('free');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favoritesSongs, setFavoritesSongs] = useState(new Set<number>());
  const [completedLessons, setCompletedLessons] = useState(new Set<number>());
  const [dailyGoal, setDailyGoal] = useState(30); // minutes
  const [dailyProgress, setDailyProgress] = useState(0);
  const [customSongs, setCustomSongs] = useState<any[]>([]);
  const [viewingAnalysis, setViewingAnalysis] = useState<any>(null);
  const { toast } = useToast();
  
  const [userStats, setUserStats] = useState({
    practiceStreak: 7,
    totalHours: 24,
    songsLearned: 3,
    userLevel: 2,
    userXP: 1250,
    accuracy: 85,
    sessionsCompleted: 12,
    achievementsUnlocked: 2,
    weeklyProgress: [10, 25, 30, 45, 20, 35, 40]
  });

  // Mock data for songs library
  const baseSongsLibrary = useMemo(() => [
    { id: 1, title: "Für Elise", artist: "Beethoven", difficulty: "intermediate", genre: "classical", duration: "3:00", locked: false },
    { id: 2, title: "Clair de Lune", artist: "Debussy", difficulty: "advanced", genre: "classical", duration: "5:30", locked: false },
    { id: 3, title: "Let It Be", artist: "The Beatles", difficulty: "beginner", genre: "pop", duration: "4:00", locked: false },
    { id: 4, title: "River Flows in You", artist: "Yiruma", difficulty: "intermediate", genre: "contemporary", duration: "3:30", locked: true },
    { id: 5, title: "Bohemian Rhapsody", artist: "Queen", difficulty: "advanced", genre: "rock", duration: "6:00", locked: true },
    { id: 6, title: "Canon in D", artist: "Pachelbel", difficulty: "intermediate", genre: "classical", duration: "4:30", locked: false },
    { id: 7, title: "All of Me", artist: "John Legend", difficulty: "beginner", genre: "pop", duration: "4:30", locked: true },
    { id: 8, title: "Moonlight Sonata", artist: "Beethoven", difficulty: "advanced", genre: "classical", duration: "6:00", locked: true }
  ], []);

  // Combined songs library with custom songs
  const songsLibrary = useMemo(() => [...baseSongsLibrary, ...customSongs], [baseSongsLibrary, customSongs]);

  // Theory lessons data
  const theoryLessons = useMemo(() => [
    // Basics
    { id: 1, title: "Reading Music Notation", category: "basics", duration: "15 min", completed: false, description: "Learn to read notes on the staff" },
    { id: 2, title: "The Piano Keyboard", category: "basics", duration: "12 min", completed: false, description: "Understanding keys, octaves, and layout" },
    { id: 3, title: "Note Names and Values", category: "basics", duration: "18 min", completed: false, description: "Whole notes, half notes, quarters, and beyond" },
    { id: 4, title: "Rhythm Fundamentals", category: "basics", duration: "20 min", completed: false, description: "Beat, tempo, and basic counting" },
    
    // Scales
    { id: 5, title: "Major Scales", category: "scales", duration: "25 min", completed: false, description: "Construction and patterns of major scales" },
    { id: 6, title: "Minor Scales", category: "scales", duration: "25 min", completed: false, description: "Natural, harmonic, and melodic minor scales" },
    { id: 7, title: "Chromatic Scale", category: "scales", duration: "15 min", completed: false, description: "All 12 pitches in sequence" },
    { id: 8, title: "Pentatonic Scales", category: "scales", duration: "20 min", completed: false, description: "Major and minor pentatonic scales" },
    { id: 9, title: "Blues Scale", category: "scales", duration: "18 min", completed: false, description: "The blues scale and its applications" },
    { id: 10, title: "Modal Scales", category: "scales", duration: "35 min", completed: false, description: "Dorian, Mixolydian, and other modes" },
    
    // Intervals and Harmony
    { id: 11, title: "Intervals", category: "harmony", duration: "30 min", completed: false, description: "Perfect, major, minor, augmented, diminished" },
    { id: 12, title: "Triads", category: "harmony", duration: "25 min", completed: false, description: "Major, minor, diminished, augmented triads" },
    { id: 13, title: "Seventh Chords", category: "harmony", duration: "30 min", completed: false, description: "Dominant, major, minor, and half-diminished 7ths" },
    { id: 14, title: "Extended Chords", category: "harmony", duration: "35 min", completed: false, description: "9th, 11th, 13th chords and their uses" },
    { id: 15, title: "Chord Inversions", category: "harmony", duration: "25 min", completed: false, description: "Root position, first, and second inversions" },
    { id: 16, title: "Voice Leading", category: "harmony", duration: "40 min", completed: false, description: "Smooth movement between chords" },
    
    // Rhythm and Time
    { id: 17, title: "Time Signatures", category: "rhythm", duration: "20 min", completed: false, description: "Simple and compound time signatures" },
    { id: 18, title: "Syncopation", category: "rhythm", duration: "25 min", completed: false, description: "Off-beat rhythms and patterns" },
    { id: 19, title: "Polyrhythm", category: "rhythm", duration: "30 min", completed: false, description: "Multiple rhythms simultaneously" },
    { id: 20, title: "Swing and Shuffle", category: "rhythm", duration: "22 min", completed: false, description: "Jazz and blues rhythmic feels" },
    
    // Advanced Theory
    { id: 21, title: "Key Signatures", category: "theory", duration: "25 min", completed: false, description: "Circle of fifths and key relationships" },
    { id: 22, title: "Circle of Fifths", category: "theory", duration: "30 min", completed: false, description: "Key relationships and modulation" },
    { id: 23, title: "Roman Numeral Analysis", category: "theory", duration: "35 min", completed: false, description: "Analyzing chord progressions" },
    { id: 24, title: "Secondary Dominants", category: "theory", duration: "40 min", completed: false, description: "V/V and other secondary functions" },
    { id: 25, title: "Modulation Techniques", category: "theory", duration: "45 min", completed: false, description: "Common chord and pivot modulation" },
    { id: 26, title: "Non-Chord Tones", category: "theory", duration: "35 min", completed: false, description: "Passing tones, suspensions, appoggiature" },
    
    // Form and Analysis
    { id: 27, title: "Song Forms", category: "form", duration: "30 min", completed: false, description: "ABA, AABA, verse-chorus structures" },
    { id: 28, title: "Classical Forms", category: "form", duration: "40 min", completed: false, description: "Sonata, rondo, theme and variations" },
    { id: 29, title: "Phrase Structure", category: "form", duration: "25 min", completed: false, description: "Periods, sentences, and cadences" },
    
    // Genre-Specific
    { id: 30, title: "Jazz Theory Basics", category: "jazz", duration: "45 min", completed: false, description: "Jazz chord symbols and progressions" },
    { id: 31, title: "Blues Progressions", category: "blues", duration: "30 min", completed: false, description: "12-bar blues and variations" },
    { id: 32, title: "Pop Chord Progressions", category: "pop", duration: "25 min", completed: false, description: "Common progressions in popular music" },
    { id: 33, title: "Classical Harmony", category: "classical", duration: "50 min", completed: false, description: "Bach chorales and classical voice leading" },
    
    // Ear Training
    { id: 34, title: "Interval Recognition", category: "ear-training", duration: "30 min", completed: false, description: "Identifying intervals by ear" },
    { id: 35, title: "Chord Recognition", category: "ear-training", duration: "35 min", completed: false, description: "Identifying chord qualities by ear" },
    { id: 36, title: "Scale Recognition", category: "ear-training", duration: "30 min", completed: false, description: "Major, minor, and modal recognition" },
    
    // Composition
    { id: 37, title: "Melody Writing", category: "composition", duration: "40 min", completed: false, description: "Creating memorable melodies" },
    { id: 38, title: "Counterpoint Basics", category: "composition", duration: "45 min", completed: false, description: "Writing independent melodic lines" },
    { id: 39, title: "Arrangement Techniques", category: "composition", duration: "50 min", completed: false, description: "Orchestrating for different instruments" },
    
    // Performance
    { id: 40, title: "Piano Technique", category: "performance", duration: "35 min", completed: false, description: "Proper hand position and fingering" },
    { id: 41, title: "Pedaling Techniques", category: "performance", duration: "25 min", completed: false, description: "Sustain and soft pedal usage" },
    { id: 42, title: "Dynamics and Expression", category: "performance", duration: "30 min", completed: false, description: "Musical expression and interpretation" }
  ], []);

  // Achievements data
  const achievements = useMemo(() => [
    { id: 1, title: "First Steps", description: "Complete your first practice session", icon: "👶", unlocked: true },
    { id: 2, title: "Week Warrior", description: "Practice 7 days in a row", icon: "🔥", unlocked: false },
    { id: 3, title: "Theory Master", description: "Complete all theory lessons", icon: "📚", unlocked: false },
    { id: 4, title: "Song Bird", description: "Learn 10 songs", icon: "🎵", unlocked: false },
    { id: 5, title: "Perfect Pitch", description: "Achieve 95% accuracy", icon: "🎯", unlocked: false },
    { id: 6, title: "Dedication", description: "Practice for 100 hours total", icon: "⏰", unlocked: false }
  ], []);

  // Initialize app
  useEffect(() => {
    const savedTheme = localStorage.getItem('pianoMentorTheme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    
    // Show welcome message
    setTimeout(() => {
      showAchievementNotification("Welcome to Piano Mentor!", "Your musical journey begins now!", "🎹");
    }, 2000);

    // Setup keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1': setActiveSection('dashboard'); break;
          case '2': setActiveSection('practice'); break;
          case '3': setActiveSection('learn'); break;
          case '4': setActiveSection('songs'); break;
          case 'm': setMobileMenuOpen(prev => !prev); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('pianoMentorTheme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const showAchievementNotification = (title: string, description: string, icon = '🏆') => {
    setAchievementData({ title, description, icon });
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 5000);
  };

  const handlePracticeTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    setDailyProgress(prev => Math.min(prev + minutes, dailyGoal));
    
    if (minutes > 0 && minutes % 5 === 0) {
      addXP(50, 'Practice milestone');
    }
  };

  const addXP = (amount: number, reason: string) => {
    const newXP = userStats.userXP + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;
    
    if (newLevel > userStats.userLevel) {
      showAchievementNotification("Level Up!", `You've reached Level ${newLevel}!`, "🎊");
    }
    
    setUserStats(prev => ({
      ...prev,
      userXP: newXP,
      userLevel: newLevel,
      totalHours: Math.floor(newXP / 60),
      songsLearned: Math.floor(newLevel * 1.5)
    }));
  };

  const handlePracticeSessionComplete = (sessionData: any) => {
    const minutes = Math.floor(sessionData.duration / (1000 * 60));
    setDailyProgress(prev => Math.min(prev + minutes, dailyGoal));
    addXP(minutes * 10, 'Practice session completed');
    
    showAchievementNotification(
      "Practice Complete!", 
      `Great session! You practiced for ${minutes} minutes.`, 
      "🎹"
    );
  };
    console.log('Adding song:', song);
    setCustomSongs(prev => {
      const updated = [...prev, song];
      console.log('Updated custom songs:', updated);
      return updated;
    });
    addXP(200, 'Custom song added');
    showAchievementNotification("Song Added!", `${song.title} has been analyzed and added to your library`, "🎵");
  };

  const handleNotePlay = (note: string, velocity: number = 1) => {
    if (isRecording) {
      setRecordedNotes(prev => [...prev, { note, timestamp: Date.now() }]);
    }
  };

  const handleNoteStop = (note: string) => {
    // Handle note off for sustained notes
    console.log('Note stopped:', note);
  };

  const toggleFavorite = (songId: number) => {
    setFavoritesSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const completeLesson = (lessonId: number) => {
    setCompletedLessons(prev => new Set(prev).add(lessonId));
    addXP(100, 'Lesson completed');
    
    if (completedLessons.size + 1 === theoryLessons.length) {
      showAchievementNotification("Theory Master!", "You've completed all theory lessons!", "🎓");
    }
  };

  // Filtered songs based on search and filters
  const filteredSongs = useMemo(() => {
    return songsLibrary.filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || song.genre === selectedGenre;
      const matchesDifficulty = selectedDifficulty === 'all' || song.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesGenre && matchesDifficulty;
    });
  }, [searchQuery, selectedGenre, selectedDifficulty, songsLibrary]);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'practice', label: 'Practice Mode', icon: <Music size={18} /> },
    { id: 'learn', label: 'Learn', icon: <GraduationCap size={18} /> },
    { id: 'songs', label: 'Song Library', icon: <BookOpen size={18} /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp size={18} /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy size={18} /> },
    { id: 'community', label: 'Community', icon: <Users size={18} /> }
  ];

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        <span className="text-sm hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-from-top">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{achievementData.icon}</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{achievementData.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{achievementData.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 h-full bg-white dark:bg-gray-900 p-5 flex flex-col shadow-lg z-40 transition-transform`}>
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white text-xl mr-3">
            🎹
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">Piano Mentor</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pro Learning Platform</div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white mr-3">
              <User size={24} />
            </div>
            <div className="text-white">
              <div className="font-semibold">Piano Student</div>
              <div className="text-xs opacity-90">Level {userStats.userLevel} • {userStats.userXP} XP</div>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2 mb-1">
            <div 
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${(userStats.userXP % 1000) / 10}%` }}
            />
          </div>
          <div className="text-xs text-white/80">{1000 - (userStats.userXP % 1000)} XP to next level</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.id === 'achievements' && userStats.achievementsUnlocked > 0 && (
                <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {userStats.achievementsUnlocked}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Daily Goal Progress */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Goal</span>
            <span className="text-xs text-gray-500">{dailyProgress}/{dailyGoal} min</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <Flame size={14} className="mr-2" /> Streak
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{userStats.practiceStreak} days</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <Clock size={14} className="mr-2" /> Total
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{userStats.totalHours}h</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <Target size={14} className="mr-2" /> Accuracy
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{userStats.accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-y-auto">
        <div className="p-6 lg:p-10 pt-16 lg:pt-10">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="text-white mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">Welcome back! 🎹</h1>
                <p className="text-lg opacity-90">You're {Math.round(100 - (dailyProgress / dailyGoal * 100))}% away from your daily goal!</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Practice Streak</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.practiceStreak}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg flex items-center justify-center text-white">
                        <Flame size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">days in a row</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Total Hours</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.totalHours}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">practice time</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Songs Learned</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.songsLearned}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-400 rounded-lg flex items-center justify-center text-white">
                        <Music size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">completed</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Accuracy</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.accuracy}%</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-red-400 rounded-lg flex items-center justify-center text-white">
                        <Target size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">overall score</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Practice */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Practice Session</CardTitle>
                  <CardDescription>Jump right into practicing with our AI-powered tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <VirtualPiano onNotePlay={handleNotePlay} isRecording={isRecording} />
                  <div className="flex gap-4 flex-wrap">
                    <Button 
                      onClick={() => setIsRecording(!isRecording)}
                      variant={isRecording ? "destructive" : "default"}
                    >
                      {isRecording ? <Pause size={16} className="mr-2" /> : <Mic size={16} className="mr-2" />}
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveSection('practice')}>
                      <Play size={16} className="mr-2" />
                      Full Practice Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Continue Learning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {theoryLessons.slice(0, 3).map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-sm text-gray-500">{lesson.duration}</div>
                        </div>
                        <Button size="sm" onClick={() => setActiveSection('learn')}>
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Recommended Songs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {songsLibrary.slice(0, 3).map(song => (
                      <div key={song.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium">{song.title}</div>
                          <div className="text-sm text-gray-500">{song.artist}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={difficultyColors[song.difficulty as keyof typeof difficultyColors]}>
                            {song.difficulty}
                          </Badge>
                          <Button size="sm" onClick={() => setActiveSection('songs')}>
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Practice Mode */}
          {activeSection === 'practice' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Practice Mode 🎵</h1>
                <p className="text-lg opacity-90">Perfect your skills with our advanced practice tools</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="shadow-lg mb-6">
                    <CardHeader>
                      <CardTitle>Virtual Piano</CardTitle>
                      <CardDescription>Play and practice with our virtual keyboard or connect your MIDI device</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VirtualPiano onNotePlay={handleNotePlay} isRecording={isRecording} />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle>Practice Timer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PracticeTimer onTimeUpdate={handlePracticeTime} />
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle>Metronome</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Metronome />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* MIDI Controller */}
                  <MidiController 
                    onNotePlay={handleNotePlay}
                    onNoteStop={handleNoteStop}
                  />

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Practice Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Practice Mode</label>
                        <select 
                          value={practiceMode}
                          onChange={(e) => setPracticeMode(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="free">Free Play</option>
                          <option value="guided">Guided Practice</option>
                          <option value="smart">AI Smart Practice</option>
                          <option value="challenge">Challenge Mode</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Difficulty</label>
                        <select 
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Recording</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        onClick={() => setIsRecording(!isRecording)}
                        variant={isRecording ? "destructive" : "default"}
                        className="w-full"
                      >
                        {isRecording ? (
                          <>
                            <Pause size={16} className="mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic size={16} className="mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                      {recordedNotes.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Recorded {recordedNotes.length} notes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Learn Section */}
          {activeSection === 'learn' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Learn Theory 📖</h1>
                <p className="text-lg opacity-90">Master the fundamentals of music theory</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theoryLessons.map(lesson => (
                  <Card key={lesson.id} className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{lesson.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.category}</p>
                        </div>
                        {completedLessons.has(lesson.id) && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {lesson.description}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Duration: {lesson.duration}
                        </div>

                        {completedLessons.has(lesson.id) ? (
                          <Button 
                            className="w-full"
                            disabled
                            variant="secondary"
                          >
                            <Check size={16} className="mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Button 
                              className="w-full"
                              onClick={() => {
                                setActiveSection('lesson-view');
                                setCurrentLesson(lesson);
                              }}
                            >
                              <Play size={16} className="mr-2" />
                              Start Lesson
                            </Button>
                            <Button 
                              className="w-full"
                              variant="outline"
                              size="sm"
                              onClick={() => completeLesson(lesson.id)}
                            >
                              Mark Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lesson View */}
          {activeSection === 'lesson-view' && currentLesson && (
            <InteractiveLessonView
              lesson={currentLesson}
              onComplete={() => {
                completeLesson(currentLesson.id);
                showAchievementNotification("Lesson Complete!", `You've finished ${currentLesson.title}`, "🎓");
                setActiveSection('learn');
              }}
              onBack={() => setActiveSection('learn')}
            />
          )}

          {/* Song Library */}
          {activeSection === 'songs' && !viewingAnalysis && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Song Library 📚</h1>
                <p className="text-lg opacity-90">Choose from our curated collection of songs</p>
              </div>

              {/* Filters & Add Song */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Search size={16} className="text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search songs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        />
                      </div>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      >
                        <option value="all">All Genres</option>
                        <option value="classical">Classical</option>
                        <option value="pop">Pop</option>
                        <option value="rock">Rock</option>
                        <option value="contemporary">Contemporary</option>
                      </select>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <AddSongDialog onSongAdded={handleSongAdded} />
                  </div>
                </CardContent>
              </Card>

              {/* Song Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSongs.map(song => (
                  <Card key={song.id} className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{song.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(song.id)}
                          className="p-2"
                        >
                          <Heart 
                            size={16} 
                            className={favoritesSongs.has(song.id) ? 'fill-red-500 text-red-500' : ''} 
                          />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Badge className={difficultyColors[song.difficulty as keyof typeof difficultyColors]}>
                          {song.difficulty}
                        </Badge>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{song.genre}</span>
                          <span>{song.duration}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1"
                            disabled={song.locked}
                            onClick={() => {
                              if ((song as any).analyzed && (song as any).parts) {
                                setViewingAnalysis(song);
                              }
                            }}
                          >
                            {song.locked ? <Lock size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                            {song.locked ? 'Locked' : (song as any).analyzed ? 'View Analysis' : 'Practice'}
                          </Button>
                        </div>
                        {(song as any).analyzed && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                            <Music size={12} />
                            AI Analyzed • {((song as any).parts?.leftHand?.length || 0) + ((song as any).parts?.rightHand?.length || 0)} parts
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Song Analysis View */}
          {activeSection === 'songs' && viewingAnalysis && (
            <SongAnalysisView 
              song={viewingAnalysis} 
              onBack={() => setViewingAnalysis(null)}
            />
          )}

          {/* Progress Section */}
          {activeSection === 'progress' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Your Progress 📈</h1>
                <p className="text-lg opacity-90">Track your musical journey</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Weekly Practice</CardTitle>
                    <CardDescription>Minutes practiced each day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {userStats.weeklyProgress.map((minutes, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-300"
                            style={{ height: `${(minutes / 50) * 100}%` }}
                          />
                          <div className="text-xs text-gray-500 mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Skill Breakdown</CardTitle>
                    <CardDescription>Your proficiency in different areas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { skill: 'Rhythm', level: 85 },
                      { skill: 'Melody', level: 78 },
                      { skill: 'Harmony', level: 65 },
                      { skill: 'Technique', level: 72 }
                    ].map(item => (
                      <div key={item.skill}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.skill}</span>
                          <span>{item.level}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all"
                            style={{ width: `${item.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Achievement Progress</CardTitle>
                  <CardDescription>Your journey towards mastery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map(achievement => (
                      <div 
                        key={achievement.id}
                        className={`p-4 rounded-lg border transition-all ${
                          achievement.unlocked 
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-sm text-gray-500">{achievement.description}</div>
                          </div>
                          {achievement.unlocked && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Achievements Section */}
          {activeSection === 'achievements' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Achievements 🏆</h1>
                <p className="text-lg opacity-90">Celebrate your piano learning milestones</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map(achievement => (
                  <Card 
                    key={achievement.id}
                    className={`shadow-lg transition-all duration-300 ${
                      achievement.unlocked 
                        ? 'border-green-200 shadow-green-100 hover:shadow-green-200' 
                        : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-6xl mb-4">{achievement.icon}</div>
                      <h3 className="font-bold text-xl mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{achievement.description}</p>
                      {achievement.unlocked ? (
                        <Badge variant="default" className="bg-green-500">
                          <Check size={14} className="mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Lock size={14} className="mr-1" />
                          Locked
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Community Section */}
          {activeSection === 'community' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Community 👥</h1>
                <p className="text-lg opacity-90">Connect with fellow piano enthusiasts</p>
              </div>

              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Coming Soon!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect with other learners, share your progress, and participate in challenges.
                  </p>
                  <Button disabled>
                    <MessageSquare size={16} className="mr-2" />
                    Join Community
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PianoMentor;