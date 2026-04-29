import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

// Dummy AI-generated music tracks (using public domain/sample audio for demonstration)
const TRACKS = [
  { id: 1, title: 'Neon Nights', artist: 'AI Gen x Synth', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cyber Pulse', artist: 'AI Gen x Dark', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Digital Dawn', artist: 'AI Gen x Wave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Singari Movie Theme', artist: 'Singari OST', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 5, title: 'Dude Movie Theme', artist: 'Dude OST', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [[10, 10], [10, 11], [10, 12]];
const INITIAL_DIRECTION = [0, -1]; // moving UP
const SPEED = 120;

type Point = [number, number];

function generateFood(snake: Point[]): Point {
  let newFood: Point;
  while (true) {
    newFood = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE)
    ];
    // Ensure food doesn't spawn on the snake
    const isOnSnake = snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]);
    if (!isOnSnake) break;
  }
  return newFood;
}

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>([5, 5]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Initialize food
  useEffect(() => {
    setFood(generateFood(INITIAL_SNAKE));
  }, []);

  // --- Music Player Logic ---
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // --- Snake Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameRunning(true);
  };

  const startGame = () => {
    if (!isGameRunning) {
      resetGame();
      // Optionally auto-play music when game starts if not already playing
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const handleJoystick = (key: string) => {
    if (!isGameRunning) {
      if (key === 'Start') startGame();
      return;
    }
    setNextDirection(prev => {
      switch (key) {
        case 'ArrowUp':
          return prev[1] !== 1 ? [0, -1] : prev;
        case 'ArrowDown':
          return prev[1] !== -1 ? [0, 1] : prev;
        case 'ArrowLeft':
          return prev[0] !== 1 ? [-1, 0] : prev;
        case 'ArrowRight':
          return prev[0] !== -1 ? [1, 0] : prev;
        default:
          return prev;
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameRunning) {
        if (e.key === ' ' || e.key === 'Enter') {
          startGame();
        }
        return;
      }

      setNextDirection(prev => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            return prev[1] !== 1 ? [0, -1] : prev;
          case 'ArrowDown':
          case 's':
          case 'S':
            return prev[1] !== -1 ? [0, 1] : prev;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            return prev[0] !== 1 ? [-1, 0] : prev;
          case 'ArrowRight':
          case 'd':
          case 'D':
            return prev[0] !== -1 ? [1, 0] : prev;
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, isPlaying]);

  const gameLoop = useCallback(() => {
    if (!isGameRunning || gameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newDirection = nextDirection;
      const newHead: Point = [head[0] + newDirection[0], head[1] + newDirection[1]];

      setDirection(newDirection);

      // Check wall collision
      if (
        newHead[0] < 0 ||
        newHead[0] >= GRID_SIZE ||
        newHead[1] < 0 ||
        newHead[1] >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
        setGameOver(true);
        setIsGameRunning(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        // Don't pop, the snake grows
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isGameRunning, nextDirection, score, highScore]);

  useEffect(() => {
    const intervalId = setInterval(gameLoop, SPEED);
    return () => clearInterval(intervalId);
  }, [gameLoop]);


  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Aesthetic */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={skipForward}
      />

      <div className="z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Panel: Music Player */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 flex flex-col gap-6 p-6 rounded-2xl bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="text-cyan-400 w-6 h-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
              Neon Beats
            </h2>
          </div>

          <div className="flex flex-col gap-2 mt-4 relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-20 blur group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-neutral-950 rounded-lg p-4 border border-neutral-800">
              <h3 className="text-lg font-semibold text-white truncate">{currentTrack.title}</h3>
              <p className="text-sm text-neutral-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={skipBack}
              className="p-3 rounded-full hover:bg-neutral-800/80 text-neutral-300 hover:text-cyan-300 transition-all border border-transparent hover:border-cyan-900"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlay}
              className="p-4 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transform hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button 
              onClick={skipForward}
              className="p-3 rounded-full hover:bg-neutral-800/80 text-neutral-300 hover:text-fuchsia-300 transition-all border border-transparent hover:border-fuchsia-900"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-1">
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
               {/* Just a decorative active bar since we aren't tracking actual audio progress for simplicity here, but can animate playfully */}
              {isPlaying ? (
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <div className="h-full bg-neutral-700 w-1/3 rounded-full" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Center Panel: Snake Game */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 flex flex-col items-center"
        >
          {/* Header Stats */}
          <div className="w-full max-w-md flex justify-between items-end mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Score</span>
              <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] font-mono leading-none">
                {score.toString().padStart(4, '0')}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-1">
                <Trophy className="w-3 h-3" /> High Score
              </span>
              <span className="text-xl font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] font-mono leading-none">
                {highScore.toString().padStart(4, '0')}
              </span>
            </div>
          </div>

          {/* Game Board */}
          <div className="relative group p-1 rounded-xl bg-gradient-to-br from-cyan-500/20 via-transparent to-fuchsia-500/20">
            <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-xl rounded-xl border border-neutral-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]" />
            
            <div 
              className="relative bg-neutral-950 rounded-lg overflow-hidden grid"
              style={{ 
                width: 'min(90vw, 400px)', 
                height: 'min(90vw, 400px)',
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
              }}
            >
              {/* Grid Lines (subtle) */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                  backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                }}
              />

              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isFood = food[0] === x && food[1] === y;
                const snakeIndex = snake.findIndex(seg => seg[0] === x && seg[1] === y);
                const isSnake = snakeIndex !== -1;
                const isHead = snakeIndex === 0;

                return (
                  <div key={i} className="relative flex items-center justify-center">
                    {isFood && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-[70%] h-[70%] bg-fuchsia-500 rounded-sm shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                      />
                    )}
                    {isSnake && (
                      <div 
                        className={`w-[90%] h-[90%] rounded-sm ${
                          isHead 
                            ? 'bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-10' 
                            : 'bg-cyan-600/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        }`}
                        style={{
                          opacity: isHead ? 1 : Math.max(0.3, 1 - (snakeIndex / snake.length) * 0.7)
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Overlays */}
              {!isGameRunning && !gameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <button 
                    onClick={startGame}
                    className="px-6 py-3 rounded-full bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Start Game
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-3xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] uppercase tracking-widest">
                    System Failure
                  </h3>
                  <p className="text-neutral-300 mb-6 font-mono text-sm">
                    Final Score: <span className="text-cyan-400 font-bold">{score}</span>
                  </p>
                  <button 
                    onClick={resetGame}
                    className="px-6 py-3 rounded-full border border-fuchsia-500 text-fuchsia-400 font-bold hover:bg-fuchsia-500/10 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reboot System
                  </button>
                </div>
              )}
            </div>
            
          </div>
          
          <div className="mt-6 text-xs text-neutral-600 uppercase tracking-[0.2em] font-mono mb-4 text-center">
            Use WASD or Arrow Keys to move<br/>Or use the joystick below
          </div>

          {/* Extra Joystick Controls */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
             <div />
             <button 
               className="p-4 bg-neutral-950 rounded-xl active:bg-cyan-500/30 hover:bg-neutral-800 transition-colors flex items-center justify-center border border-neutral-800 shadow-inner" 
               onPointerDown={(e) => { e.preventDefault(); handleJoystick('ArrowUp'); }}
             >
               <ArrowUp className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
             </button>
             <div />
             <button 
               className="p-4 bg-neutral-950 rounded-xl active:bg-cyan-500/30 hover:bg-neutral-800 transition-colors flex items-center justify-center border border-neutral-800 shadow-inner" 
               onPointerDown={(e) => { e.preventDefault(); handleJoystick('ArrowLeft'); }}
             >
               <ArrowLeft className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
             </button>
             <button 
               className="p-4 bg-neutral-950 rounded-xl active:bg-cyan-500/30 hover:bg-neutral-800 transition-colors flex items-center justify-center border border-neutral-800 shadow-inner" 
               onPointerDown={(e) => { e.preventDefault(); handleJoystick('ArrowDown'); }}
             >
               <ArrowDown className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
             </button>
             <button 
               className="p-4 bg-neutral-950 rounded-xl active:bg-cyan-500/30 hover:bg-neutral-800 transition-colors flex items-center justify-center border border-neutral-800 shadow-inner" 
               onPointerDown={(e) => { e.preventDefault(); handleJoystick('ArrowRight'); }}
             >
               <ArrowRight className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
