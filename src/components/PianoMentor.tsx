import React, { useState, useEffect, useMemo } from 'react';
import { 
  Moon, Sun, Flame, Clock, Music, User, Calendar, Target, BookOpen, 
  TrendingUp, Play, Pause, ChevronRight, Award, BarChart3,
  Settings, Search, Filter, Download, Upload, Share2, Menu, X,
  Check, AlertCircle, Loader, Home, GraduationCap, Trophy, Users,
  Mic, Heart, Star, Lock, Unlock, ArrowLeft, ArrowRight, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VirtualPiano from './VirtualPiano';
import Metronome from './Metronome';
import PracticeTimer from './PracticeTimer';

const PianoMentor: React.FC = () => {
  // State Management
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({ title: '', description: '', icon: '🏆' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Array<{ note: string; timestamp: number }>>([]);
  const [practiceMode, setPracticeMode] = useState('free');
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favoritesSongs, setFavoritesSongs] = useState(new Set<number>());
  const [completedLessons, setCompletedLessons] = useState(new Set<number>());
  const [dailyGoal, setDailyGoal] = useState(30); // minutes
  const [dailyProgress, setDailyProgress] = useState(0);
  
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
  const songsLibrary = useMemo(() => [
    { id: 1, title: "Für Elise", artist: "Beethoven", difficulty: "intermediate", genre: "classical", duration: "3:00", locked: false },
    { id: 2, title: "Clair de Lune", artist: "Debussy", difficulty: "advanced", genre: "classical", duration: "5:30", locked: false },
    { id: 3, title: "Let It Be", artist: "The Beatles", difficulty: "beginner", genre: "pop", duration: "4:00", locked: false },
    { id: 4, title: "River Flows in You", artist: "Yiruma", difficulty: "intermediate", genre: "contemporary", duration: "3:30", locked: true },
    { id: 5, title: "Bohemian Rhapsody", artist: "Queen", difficulty: "advanced", genre: "rock", duration: "6:00", locked: true },
    { id: 6, title: "Canon in D", artist: "Pachelbel", difficulty: "intermediate", genre: "classical", duration: "4:30", locked: false },
  ], []);

  // Theory lessons data
  const theoryLessons = useMemo(() => [
    { id: 1, title: "Reading Music Notation", category: "basics", duration: "15 min", completed: false },
    { id: 2, title: "Major and Minor Scales", category: "scales", duration: "20 min", completed: false },
    { id: 3, title: "Chord Construction", category: "harmony", duration: "25 min", completed: false },
    { id: 4, title: "Time Signatures", category: "rhythm", duration: "15 min", completed: false },
  ], []);

  // Achievements data
  const achievements = useMemo(() => [
    { id: 1, title: "First Steps", description: "Complete your first practice session", icon: "👶", unlocked: true },
    { id: 2, title: "Week Warrior", description: "Practice 7 days in a row", icon: "🔥", unlocked: true },
    { id: 3, title: "Theory Master", description: "Complete all theory lessons", icon: "📚", unlocked: false },
    { id: 4, title: "Song Bird", description: "Learn 10 songs", icon: "🎵", unlocked: false },
  ], []);

  // Initialize app
  useEffect(() => {
    const savedTheme = localStorage.getItem('pianoMentorTheme') || 'light';
    setTheme(savedTheme);
    
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
  };

  const handleNotePlay = (note: string) => {
    if (isRecording) {
      setRecordedNotes(prev => [...prev, { note, timestamp: Date.now() }]);
    }
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
    
    if (completedLessons.size + 1 === theoryLessons.length) {
      showAchievementNotification("Theory Master!", "You've completed all theory lessons!", "🎓");
    }
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'practice', label: 'Practice Mode', icon: <Music size={18} /> },
    { id: 'learn', label: 'Learn', icon: <GraduationCap size={18} /> },
    { id: 'songs', label: 'Song Library', icon: <BookOpen size={18} /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp size={18} /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy size={18} /> },
  ];

  const difficultyColors = {
    beginner: 'bg-success/10 text-success border-success/20',
    intermediate: 'bg-warning/10 text-warning border-warning/20',
    advanced: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile Menu Toggle */}
      <Button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        variant="outline"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Theme Toggle */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        <span className="ml-2 hidden sm:inline">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      </Button>

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <Card className="w-80 shadow-purple border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{achievementData.icon}</div>
                <div>
                  <CardTitle className="text-sm">{achievementData.title}</CardTitle>
                  <CardDescription className="text-xs">{achievementData.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 h-full bg-card p-5 flex flex-col shadow-elegant z-40 transition-transform border-r border-border`}>
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xl mr-3 shadow-purple">
            🎹
          </div>
          <div>
            <div className="font-bold text-card-foreground">Piano Mentor</div>
            <div className="text-xs text-muted-foreground">Pro Learning Platform</div>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="mb-6 bg-gradient-primary text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <User size={24} />
              </div>
              <div>
                <div className="font-semibold">Piano Student</div>
                <div className="text-xs opacity-90">Level {userStats.userLevel} • {userStats.userXP} XP</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-2 mb-1">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(userStats.userXP % 1000) / 10}%` }}
              />
            </div>
            <div className="text-xs opacity-80">{1000 - (userStats.userXP % 1000)} XP to next level</div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <Button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              variant={activeSection === item.id ? "default" : "ghost"}
              className="w-full justify-start h-12"
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'achievements' && userStats.achievementsUnlocked > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {userStats.achievementsUnlocked}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        {/* Daily Goal Progress */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Daily Goal</span>
              <span className="text-xs text-muted-foreground">{dailyProgress}/{dailyGoal} min</span>
            </div>
            <div className="bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-success h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="mt-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center">
                <Flame size={14} className="mr-2" /> Streak
              </span>
              <span className="font-semibold">{userStats.practiceStreak} days</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center">
                <Clock size={14} className="mr-2" /> Total
              </span>
              <span className="font-semibold">{userStats.totalHours}h</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center">
                <Target size={14} className="mr-2" /> Accuracy
              </span>
              <span className="font-semibold">{userStats.accuracy}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-primary overflow-y-auto">
        <div className="p-6 lg:p-10 pt-16 lg:pt-10">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="text-white mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">Welcome back! 🎹</h1>
                <p className="text-lg opacity-90">
                  You're {Math.round(100 - (dailyProgress / dailyGoal * 100))}% away from your daily goal!
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Practice Streak</div>
                        <div className="text-3xl font-bold text-primary">{userStats.practiceStreak}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-warm rounded-lg flex items-center justify-center text-white shadow-purple">
                        <Flame size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Keep it up! 🔥
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Songs Learned</div>
                        <div className="text-3xl font-bold text-primary">{userStats.songsLearned}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center text-white shadow-purple">
                        <Music size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Great progress!
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Hours</div>
                        <div className="text-3xl font-bold text-primary">{userStats.totalHours}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center text-white shadow-purple">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amazing dedication!
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                        <div className="text-3xl font-bold text-primary">{userStats.accuracy}%</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white shadow-purple">
                        <Target size={20} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Excellent precision!
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Practice Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PracticeTimer onTimeUpdate={handlePracticeTime} />
                <Metronome />
                
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="text-primary" size={20} />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {achievements.filter(a => a.unlocked).slice(0, 3).map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="text-lg">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{achievement.title}</div>
                          <div className="text-xs text-muted-foreground">{achievement.description}</div>
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
                <h1 className="text-4xl font-bold mb-2">Practice Mode 🎼</h1>
                <p className="text-lg opacity-90">Perfect your skills with our interactive piano</p>
              </div>

              {/* Practice Controls */}
              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <Button
                      onClick={() => setIsRecording(!isRecording)}
                      variant={isRecording ? "destructive" : "outline"}
                      className="flex items-center gap-2"
                    >
                      <Mic size={16} />
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Play size={16} />
                      Play Recording
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                  
                  <VirtualPiano onNotePlay={handleNotePlay} isRecording={isRecording} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PracticeTimer onTimeUpdate={handlePracticeTime} />
                <Metronome />
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
                  <Card key={lesson.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground">{lesson.category}</p>
                        </div>
                        {completedLessons.has(lesson.id) && (
                          <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Duration: {lesson.duration}
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => completeLesson(lesson.id)}
                          disabled={completedLessons.has(lesson.id)}
                        >
                          {completedLessons.has(lesson.id) ? (
                            <>
                              <Check size={16} className="mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play size={16} className="mr-2" />
                              Start Lesson
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Song Library */}
          {activeSection === 'songs' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Song Library 📚</h1>
                <p className="text-lg opacity-90">Choose from our curated collection of songs</p>
              </div>

              {/* Filters */}
              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Search size={16} className="text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search songs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
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
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Song Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songsLibrary.map(song => (
                  <Card key={song.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{song.title}</h3>
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(song.id)}
                          className="p-2"
                        >
                          <Heart 
                            size={16} 
                            className={favoritesSongs.has(song.id) ? 'fill-destructive text-destructive' : ''} 
                          />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Badge className={difficultyColors[song.difficulty as keyof typeof difficultyColors]}>
                          {song.difficulty}
                        </Badge>
                        
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>{song.genre}</span>
                          <span>{song.duration}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1"
                            disabled={song.locked}
                          >
                            {song.locked ? <Lock size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                            {song.locked ? 'Locked' : 'Practice'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Progress Section */}
          {activeSection === 'progress' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Your Progress 📈</h1>
                <p className="text-lg opacity-90">Track your musical journey</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Weekly Practice</CardTitle>
                    <CardDescription>Minutes practiced each day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {userStats.weeklyProgress.map((minutes, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-gradient-primary rounded-t-lg transition-all duration-300"
                            style={{ height: `${(minutes / 50) * 100}%` }}
                          />
                          <div className="text-xs text-muted-foreground mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
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
                        <div className="bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {activeSection === 'achievements' && (
            <div className="space-y-6">
              <div className="text-white mb-8">
                <h1 className="text-4xl font-bold mb-2">Achievements 🏆</h1>
                <p className="text-lg opacity-90">Celebrate your musical milestones</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map(achievement => (
                  <Card key={achievement.id} className={`shadow-elegant transition-all duration-300 ${
                    achievement.unlocked ? 'shadow-glow' : 'opacity-60'
                  }`}>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-4xl mb-4">{achievement.icon}</div>
                        <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                        {achievement.unlocked ? (
                          <Badge variant="default" className="bg-success">
                            <Check size={12} className="mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Lock size={12} className="mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
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

              <Card className="shadow-elegant">
                <CardContent className="p-6 text-center">
                  <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Coming Soon!</h3>
                  <p className="text-muted-foreground">
                    Connect with other learners, share your progress, and participate in challenges.
                  </p>
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
