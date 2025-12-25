import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useHabboUser, useSubmitScore } from "@/hooks/use-game";
import { PixelButton } from "@/components/PixelButton";
import { PixelCard } from "@/components/PixelCard";
import { Leaderboard } from "@/components/Leaderboard";
import { useWindowSize, useInterval } from "usehooks-ts";
import confetti from "canvas-confetti";
import { Heart, Play, Home, Trophy, RefreshCcw, Zap, Maximize2, Shield, Bolt, Hourglass, Magnet, Bomb, Snowflake, Gift, AlertCircle, Shuffle, Zap as ZapDouble, TrendingDown, Skull, Sword, Flame, Coins } from "lucide-react";
import { motion } from "framer-motion";

// === AUDIO ===
let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (globalAudioContext?.state === 'suspended') {
    globalAudioContext.resume();
  }
  return globalAudioContext;
};

const playSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {}
};

const playBoostSound = () => {
  playSound(800, 0.1, 'square');
  setTimeout(() => playSound(1200, 0.1, 'square'), 50);
};
const playRareSound = () => {
  playSound(600, 0.08, 'sine');
  setTimeout(() => playSound(800, 0.08, 'sine'), 60);
  setTimeout(() => playSound(1000, 0.1, 'sine'), 120);
};
const playAttackSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const bass = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bass.connect(bassGain);
    bassGain.connect(audioContext.destination);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(150, now);
    bass.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    bassGain.gain.setValueAtTime(0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    bass.start(now);
    bass.stop(now + 0.1);

    const mid = audioContext.createOscillator();
    const midGain = audioContext.createGain();
    mid.connect(midGain);
    midGain.connect(audioContext.destination);
    mid.type = 'square';
    mid.frequency.setValueAtTime(800, now);
    mid.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    midGain.gain.setValueAtTime(0.25, now);
    midGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    mid.start(now);
    mid.stop(now + 0.08);

    const high = audioContext.createOscillator();
    const highGain = audioContext.createGain();
    high.connect(highGain);
    highGain.connect(audioContext.destination);
    high.type = 'triangle';
    high.frequency.setValueAtTime(2000, now);
    high.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    highGain.gain.setValueAtTime(0.2, now);
    highGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    high.start(now);
    high.stop(now + 0.05);
  } catch (e) {
    playSound(400, 0.15, 'square');
  }
};
const playHitSound = () => {
  playSound(800, 0.06, 'triangle');
  setTimeout(() => playSound(600, 0.08, 'triangle'), 30);
};
const playPistolSound = () => {
  playSound(1200, 0.02, 'square');
  setTimeout(() => playSound(600, 0.1, 'sine'), 50);
};
const playMinigunSound = () => {
  playSound(1500, 0.01, 'square');
  setTimeout(() => playSound(1200, 0.05, 'square'), 40);
};
const playLifeLostSound = () => {
  playSound(200, 0.2, 'sine');
  setTimeout(() => playSound(150, 0.15, 'sine'), 100);
};
const playPinataSound = () => {
  playSound(700, 0.1, 'sine');
  setTimeout(() => playSound(900, 0.1, 'sine'), 50);
  setTimeout(() => playSound(500, 0.15, 'sine'), 100);
};
const playCollectSound = () => {
  playSound(1000, 0.08, 'triangle');
  setTimeout(() => playSound(1200, 0.08, 'triangle'), 50);
};
const playEnemyHitSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const punch = audioContext.createOscillator();
    const punchGain = audioContext.createGain();
    punch.connect(punchGain);
    punchGain.connect(audioContext.destination);
    punch.type = 'square';
    punch.frequency.setValueAtTime(1500, now);
    punch.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    punchGain.gain.setValueAtTime(0.3, now);
    punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    punch.start(now);
    punch.stop(now + 0.1);
  } catch (e) {
    playSound(1000, 0.1, 'square');
  }
};
const playEnemyDeathSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const bass = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bass.connect(bassGain);
    bassGain.connect(audioContext.destination);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(150, now);
    bass.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    bassGain.gain.setValueAtTime(0.15, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    bass.start(now);
    bass.stop(now + 0.15);
    setTimeout(() => {
      try {
        const mid = audioContext.createOscillator();
        const midGain = audioContext.createGain();
        mid.connect(midGain);
        midGain.connect(audioContext.destination);
        mid.type = 'sine';
        mid.frequency.setValueAtTime(300, audioContext.currentTime);
        mid.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.1);
        midGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        midGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        mid.start(audioContext.currentTime);
        mid.stop(audioContext.currentTime + 0.1);
      } catch {}
    }, 50);
  } catch (e) {
    playSound(150, 0.15, 'sine');
  }
};

// === CONFIG ===
const RARES = [
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/amber_red.gif", points: 50, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/petal.gif", points: 30, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/nelly_silver.gif", points: 80, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/throne.gif", points: 1000, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/nelly_gold.gif", points: 90, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/cauldron.gif", points: 40, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/hologirl.gif", points: 95, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/cola.gif", points: 20, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/dino.gif", points: 60, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/hammock.gif", points: 55, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/globe.gif", points: 75, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/holopod.gif", points: 85, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/monsterplant.gif", points: 65, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/lappland.gif", points: 45, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/samovar.gif", points: 70, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/moon.gif", points: 110, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/beach.gif", points: 35, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/nelly_bronze.gif", points: 78, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/para_green.gif", points: 25, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/para_yellow.gif", points: 25, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/para_purple.gif", points: 25, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/para_orange.gif", points: 25, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/snow.gif", points: 40, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/speaker.gif", points: 50, type: "rare" },
  { url: "https://files.habboemotion.com/resources/images/small_furni/rare/aloe.gif", points: 30, type: "rare" },
];

const BOOSTS = [
  { id: "size", label: "SIZE UP", color: "bg-purple-400", effect: { scale: 1.5, duration: 6000 } },
  { id: "2x", label: "2X POINTS", color: "bg-yellow-400", effect: { multiplier: 2, duration: 5000 } },
  { id: "3x", label: "3X POINTS", color: "bg-orange-500", effect: { multiplier: 3, duration: 4000 } },
  { id: "4x", label: "4X POINTS", color: "bg-yellow-500", effect: { multiplier: 4, duration: 4500 } },
  { id: "5x", label: "5X POINTS", color: "bg-amber-600", effect: { multiplier: 5, duration: 3000 } },
  { id: "10x", label: "10X POINTS", color: "bg-red-700", effect: { multiplier: 10, duration: 2000 } },
  { id: "15x", label: "15X POINTS", color: "bg-amber-700", effect: { multiplier: 15, duration: 1500 } },
  { id: "shield", label: "SHIELD", color: "bg-blue-500", effect: { shield: 1, duration: 8000 } },
  { id: "speed", label: "SPEED", color: "bg-red-500", effect: { speed: 2, duration: 5000 } },
  { id: "slow", label: "SLOW TIME", color: "bg-indigo-500", effect: { slow: 0.5, duration: 12000 } },
  { id: "magnet", label: "MAGNET", color: "bg-pink-500", effect: { magnet: 150, duration: 5000 } },
  { id: "freeze", label: "FREEZE", color: "bg-cyan-400", effect: { freeze: 1, duration: 2500 } },
  { id: "bomb", label: "BOMB", color: "bg-gray-700", effect: { bomb: 1, duration: 0 } },
  { id: "life", label: "EXTRA LIFE", color: "bg-green-500", effect: { extraLife: 1, duration: 0 } },
  { id: "invincible", label: "INVINCIBLE", color: "bg-rose-500", effect: { invincible: 1, duration: 7000 } },
  { id: "mega_size", label: "MEGA SIZE", color: "bg-violet-600", effect: { scale: 2.5, duration: 5000 } },
  { id: "mega_magnet", label: "MEGA MAGNET", color: "bg-fuchsia-500", effect: { magnet: 250, duration: 6000 } },
  { id: "chaos", label: "CHAOS", color: "bg-lime-600", effect: { chaos: 1, duration: 8000 } },
  { id: "weak", label: "WEAK GRAVITY", color: "bg-sky-600", effect: { weak: 0.3, duration: 5000 } },
  { id: "dash", label: "DASH BOOST", color: "bg-teal-500", effect: { dash: 1, duration: 6000 } },
  { id: "split", label: "SPLIT", color: "bg-indigo-700", effect: { split: 1, duration: 0 } },
  { id: "shrink", label: "SHRINK", color: "bg-slate-500", effect: { shrink: 1, duration: 5000 } },
  { id: "drift", label: "DRIFT", color: "bg-orange-600", effect: { drift: 1, duration: 5000 } },
  { id: "pistol", label: "PISTOL", color: "bg-yellow-600", effect: { pistol: 1, duration: 6000 } },
  { id: "minigun", label: "MINIGUN", color: "bg-red-600", effect: { minigun: 1, duration: 5000 } },
  { id: "power_attack", label: "POWER ATTACK", color: "bg-orange-700", effect: { powerAttack: 1, duration: 7000 } },
];

const GAME_WIDTH = 800;
const AVATAR_SIZE = 64;
const ITEM_SIZE = 40;
const INITIAL_LIVES = 5;
const FALL_SPEED_BASE = 2;
const MAX_FALL_SPEED = 12;

interface FallingItem {
  id: number;
  x: number;
  y: number;
  itemIndex: number;
  speed: number;
  isBoost?: boolean;
  boostType?: string;
  frozenTime?: number;
  isEnemy?: boolean;
  enemyHealth?: number;
  isProjectile?: boolean;
  projectileType?: 'pistol' | 'minigun';
  isBaseball?: boolean;
  isPinata?: boolean;
  isCoin?: boolean;
  releasedTime?: number;
  rowId?: number;
}

export default function Game() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username") || ".:josefaura:.";
  const { data: user } = useHabboUser(username);
  const submitScore = useSubmitScore();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [avatarX, setAvatarX] = useState(0);
  const [avatarDirection, setAvatarDirection] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);
  const [avatarScale, setAvatarScale] = useState(1);
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [activeBoost, setActiveBoost] = useState<string | null>(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [slowMultiplier, setSlowMultiplier] = useState(1);
  const [magnetRange, setMagnetRange] = useState(0);
  const [freezeActive, setFreezeActive] = useState(false);
  const [invincibleActive, setInvincibleActive] = useState(false);
  const [chaosActive, setChaosActive] = useState(false);
  const [weakGravity, setWeakGravity] = useState(1);
  const [dashActive, setDashActive] = useState(false);
  const [showBoosts, setShowBoosts] = useState(false);
  const [attackActive, setAttackActive] = useState(false);
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [pistolActive, setPistolActive] = useState(false);
  const [minigunActive, setMinigunActive] = useState(false);
  const [powerAttackActive, setPowerAttackActive] = useState(false);
  const [rockHealth, setRockHealth] = useState(3);
  const [inSmallZone, setInSmallZone] = useState(false);
  const explosionIdRef = useRef(0);
  const projectileIdRef = useRef(10000);
  const enemyRowIdRef = useRef(0);
  const lastRowTimeRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const nextItemId = useRef(0);
  const boostTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseMoveTimeRef = useRef<number>(0);
  const gameStateRef = useRef({
    score: 0,
    lives: INITIAL_LIVES,
    avatarX: 0,
    avatarVelocityX: 0,
    difficulty: 1,
    isMoving: false,
    avatarDirection: 'right' as 'left' | 'right',
    avatarScale: 1,
    pointsMultiplier: 1,
    shieldActive: false,
    speedMultiplier: 1,
    slowMultiplier: 1,
    magnetRange: 0,
    freezeActive: false,
    invincibleActive: false,
    chaosActive: false,
    weakGravity: 1,
    dashActive: false,
    attackActive: false,
    pistol: false,
    minigun: false,
    powerAttackActive: false,
  });

  useEffect(() => {
    if (gameAreaRef.current) {
      const initialX = gameAreaRef.current.clientWidth / 2 - AVATAR_SIZE / 2;
      setAvatarX(initialX);
      gameStateRef.current.avatarX = initialX;
      gameStateRef.current.avatarVelocityX = 0;
    }
  }, [windowWidth]);

  const activateBomb = () => {
    if (!isPlaying) return;
    playSound(200, 0.3, 'sine');
    playSound(100, 0.3, 'sine');
    setItems(prev => {
      const enemies = prev.filter(item => item.isEnemy);
      enemies.forEach(enemy => {
        const explosionId = explosionIdRef.current++;
        setExplosions(p => [...p, { id: explosionId, x: enemy.x + ITEM_SIZE / 2, y: enemy.y + ITEM_SIZE / 2 }]);
        setTimeout(() => {
          setExplosions(p => p.filter(e => e.id !== explosionId));
        }, 600);
        const originX = (enemy.x + ITEM_SIZE / 2) / (gameAreaRef.current?.clientWidth || window.innerWidth);
        const originY = enemy.y / windowHeight;
        confetti({
          particleCount: 25,
          spread: 100,
          startVelocity: 25,
          angle: -90,
          origin: { x: originX, y: originY },
          colors: ['#dc2626', '#ff4444', '#ff6666']
        });
        confetti({
          particleCount: 20,
          spread: 180,
          startVelocity: 20,
          angle: 0,
          origin: { x: originX, y: originY },
          colors: ['#dc2626', '#ff4444', '#ff6666']
        });
        confetti({
          particleCount: 15,
          spread: 100,
          startVelocity: 15,
          angle: 90,
          origin: { x: originX, y: originY },
          colors: ['#dc2626', '#ff4444', '#ff6666']
        });
        gameStateRef.current.score += 25 * gameStateRef.current.pointsMultiplier;
      });
      setScore(gameStateRef.current.score);
      confetti({ particleCount: 200, spread: 360, startVelocity: 40, origin: { x: 0.5, y: 0.5 } });
      return prev.filter(item => !item.isEnemy);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const wasAlreadyPressed = keysPressed.current.has(e.key);
      keysPressed.current.add(e.key);
      if (e.key === " " && isPlaying && !wasAlreadyPressed) {
        e.preventDefault();
        performAttack();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying]);

  const performAttack = () => {
    if (attackActive) return;
    setAttackActive(true);
    setTimeout(() => setAttackActive(false), 400);
    playAttackSound();
    if (gameStateRef.current.minigun) {
      playPistolSound();
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          setItems(prev => [...prev, {
            id: projectileIdRef.current++,
            x: gameStateRef.current.avatarX + AVATAR_SIZE / 2 - 2 + (Math.random() - 0.5) * 40,
            y: windowHeight - 150,
            itemIndex: 0,
            speed: -10,
            isProjectile: true,
            projectileType: 'minigun'
          }]);
        }, i * 30);
      }
      return;
    }
    if (gameStateRef.current.pistol) {
      playPistolSound();
      setItems(prev => [...prev, {
        id: projectileIdRef.current++,
        x: gameStateRef.current.avatarX + AVATAR_SIZE / 2 - 2,
        y: windowHeight - 150,
        itemIndex: 0,
        speed: -12,
        isProjectile: true,
        projectileType: 'pistol'
      }]);
      return;
    }
    const scaledSize = AVATAR_SIZE * gameStateRef.current.avatarScale;
    const rangeBonus = gameStateRef.current.powerAttackActive ? 130 : 85;
    const avatarHitbox = {
      x: gameStateRef.current.avatarX - (rangeBonus * gameStateRef.current.avatarScale),
      y: windowHeight - 200,
      w: AVATAR_SIZE + (rangeBonus * 2 * gameStateRef.current.avatarScale),
      h: 150 * gameStateRef.current.avatarScale
    };

    if (gameStateRef.current.avatarScale <= 0.8) {
      const smallZoneRock = { x: 10, y: windowHeight - 150, w: 60, h: 100 };
      const isHitRock =
        avatarHitbox.x < smallZoneRock.x + smallZoneRock.w &&
        avatarHitbox.x + avatarHitbox.w > smallZoneRock.x &&
        avatarHitbox.y < smallZoneRock.y + smallZoneRock.h &&
        avatarHitbox.y + avatarHitbox.h > smallZoneRock.y;
      if (isHitRock) {
        playHitSound();
        gameStateRef.current.score += 150 * gameStateRef.current.pointsMultiplier;
        setScore(gameStateRef.current.score);
        confetti({ particleCount: 40, spread: 360, startVelocity: 20, origin: { x: 0.08, y: 0.8 } });
      }
    }

    if (gameStateRef.current.avatarScale >= 2.3) {
      const maxZoneBox = { x: (gameAreaRef.current?.clientWidth || 800) - 80, y: windowHeight - 250, w: 80, h: 150 };
      const isHitMaxZone =
        avatarHitbox.x < maxZoneBox.x + maxZoneBox.w &&
        avatarHitbox.x + avatarHitbox.w > maxZoneBox.x &&
        avatarHitbox.y < maxZoneBox.y + maxZoneBox.h &&
        avatarHitbox.y + avatarHitbox.h > maxZoneBox.y;
      if (isHitMaxZone) {
        playHitSound();
        gameStateRef.current.score += 200;
        setScore(gameStateRef.current.score);
        confetti({ particleCount: 80, spread: 360, startVelocity: 35, origin: { x: (gameAreaRef.current?.clientWidth || 800) / (gameAreaRef.current?.clientWidth || 800), y: 0.8 } });
      }
    }

    setItems(prev => prev.filter(item => {
      if (item.isEnemy || item.isPinata) {
        const itemHitbox = { x: item.x, y: item.y, w: ITEM_SIZE, h: ITEM_SIZE };
        const isHit =
          itemHitbox.x < avatarHitbox.x + avatarHitbox.w &&
          itemHitbox.x + itemHitbox.w > avatarHitbox.x &&
          itemHitbox.y < avatarHitbox.y + avatarHitbox.h &&
          itemHitbox.y + itemHitbox.h > avatarHitbox.y;
        if (isHit) {
          if (item.isEnemy) playEnemyDeathSound();
          else if (item.isPinata) playHitSound();
          const points = item.isPinata ? 75 : 25;
          gameStateRef.current.score += points;
          setScore(gameStateRef.current.score);
          const explosionId = explosionIdRef.current++;
          setExplosions(prev => [...prev, { id: explosionId, x: item.x + ITEM_SIZE / 2, y: item.y + ITEM_SIZE / 2 }]);
          setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== explosionId)), 600);
          const originX = (item.x + ITEM_SIZE / 2) / (gameAreaRef.current?.clientWidth || window.innerWidth);
          const originY = item.y / windowHeight;
          if (item.isEnemy) {
            confetti({
              particleCount: 20,
              spread: 100,
              startVelocity: 20,
              angle: -90,
              origin: { x: originX, y: originY },
              colors: ['#dc2626', '#ff4444', '#ff6666']
            });
            confetti({
              particleCount: 15,
              spread: 180,
              startVelocity: 15,
              angle: 0,
              origin: { x: originX, y: originY },
              colors: ['#dc2626', '#ff4444', '#ff6666']
            });
            confetti({
              particleCount: 12,
              spread: 100,
              startVelocity: 10,
              angle: 90,
              origin: { x: originX, y: originY },
              colors: ['#dc2626', '#ff4444', '#ff6666']
            });
          } else {
            confetti({ particleCount: 20, spread: 100, startVelocity: 20, angle: -90, origin: { x: originX, y: originY } });
            confetti({ particleCount: 15, spread: 180, startVelocity: 15, angle: 0, origin: { x: originX, y: originY } });
            confetti({ particleCount: 12, spread: 100, startVelocity: 10, angle: 90, origin: { x: originX, y: originY } });
          }
          return false;
        }
      }
      return true;
    }));
  };

  const applyBoost = (boostId: string) => {
    const boost = BOOSTS.find(b => b.id === boostId);
    if (!boost) return;
    setActiveBoost(boostId);
    if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
    if (boost.effect.scale) {
      gameStateRef.current.avatarScale = boost.effect.scale;
      setAvatarScale(boost.effect.scale);
    }
    if (boost.effect.multiplier) {
      gameStateRef.current.pointsMultiplier = boost.effect.multiplier;
      setPointsMultiplier(boost.effect.multiplier);
    }
    if (boost.effect.shield) {
      gameStateRef.current.shieldActive = true;
      setShieldActive(true);
    }
    if (boost.effect.speed) {
      gameStateRef.current.speedMultiplier = boost.effect.speed;
      setSpeedMultiplier(boost.effect.speed);
    }
    if (boost.effect.slow) {
      gameStateRef.current.slowMultiplier = boost.effect.slow;
      setSlowMultiplier(boost.effect.slow);
    }
    if (boost.effect.magnet) {
      gameStateRef.current.magnetRange = boost.effect.magnet;
      setMagnetRange(boost.effect.magnet);
    }
    if (boost.effect.freeze) {
      gameStateRef.current.freezeActive = true;
      setFreezeActive(true);
    }
    if (boost.effect.invincible) {
      gameStateRef.current.invincibleActive = true;
      setInvincibleActive(true);
    }
    if (boost.effect.chaos) {
      gameStateRef.current.chaosActive = true;
      setChaosActive(true);
    }
    if (boost.effect.weak) {
      gameStateRef.current.weakGravity = boost.effect.weak;
      setWeakGravity(boost.effect.weak);
    }
    if (boost.effect.dash) {
      gameStateRef.current.dashActive = true;
      setDashActive(true);
    }
    if (boost.effect.bomb) {
      activateBomb();
    }
    if (boost.effect.extraLife) {
      gameStateRef.current.lives += boost.effect.extraLife;
      setLives(gameStateRef.current.lives);
    }
    if (boost.effect.split) {
      setItems(prev => [
        ...prev,
        ...prev.filter(item => !item.isBoost).map(item => ({
          ...item,
          id: nextItemId.current++,
          x: item.x + 30
        }))
      ]);
    }
    if (boost.effect.shrink) {
      gameStateRef.current.avatarScale = 0.7;
      setAvatarScale(0.7);
    }
    if (boost.effect.pistol) {
      gameStateRef.current.pistol = true;
      setPistolActive(true);
    }
    if (boost.effect.minigun) {
      gameStateRef.current.minigun = true;
      setMinigunActive(true);
    }
    if (boost.effect.powerAttack) {
      gameStateRef.current.powerAttackActive = true;
      setPowerAttackActive(true);
    }
    if (boost.effect.duration > 0) {
      boostTimerRef.current = setTimeout(() => {
        gameStateRef.current.avatarScale = 1;
        gameStateRef.current.pointsMultiplier = 1;
        gameStateRef.current.shieldActive = false;
        gameStateRef.current.speedMultiplier = 1;
        gameStateRef.current.slowMultiplier = 1;
        gameStateRef.current.magnetRange = 0;
        gameStateRef.current.freezeActive = false;
        gameStateRef.current.invincibleActive = false;
        gameStateRef.current.chaosActive = false;
        gameStateRef.current.weakGravity = 1;
        gameStateRef.current.dashActive = false;
        setAvatarScale(1);
        setPointsMultiplier(1);
        setShieldActive(false);
        setSpeedMultiplier(1);
        setSlowMultiplier(1);
        setMagnetRange(0);
        setFreezeActive(false);
        setInvincibleActive(false);
        setChaosActive(false);
        setWeakGravity(1);
        setDashActive(false);
        setActiveBoost(null);
        gameStateRef.current.pistol = false;
        gameStateRef.current.minigun = false;
        gameStateRef.current.powerAttackActive = false;
        setPistolActive(false);
        setMinigunActive(false);
        setPowerAttackActive(false);
      }, boost.effect.duration);
    }
  };

  const gameLoop = useCallback((time: number) => {
    if (!isPlaying || isGameOver || !gameAreaRef.current) return;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    const containerWidth = gameAreaRef.current.clientWidth || GAME_WIDTH;

    // === FÍSICA DE DESLIZAMIENTO ===
    const acceleration = 0.8;
    const baseFriction = 0.88;
    const friction = gameStateRef.current.freezeActive ? 0.992 : baseFriction;
    const maxSpeed = 11;

    let newDirection = gameStateRef.current.avatarDirection;
    let nowMoving = false;

    const isKeyboardMoving = keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a") || keysPressed.current.has("ArrowRight") || keysPressed.current.has("d");

    // Teclado
    if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
      gameStateRef.current.avatarVelocityX -= acceleration;
      newDirection = 'left';
      nowMoving = true;
    } else if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
      gameStateRef.current.avatarVelocityX += acceleration;
      newDirection = 'right';
      nowMoving = true;
    }

    // === MOUSE / TOUCH: Steering suave tipo "arrive" ===
    if (isMouseDownRef.current && lastMousePosRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const mouseX = lastMousePosRef.current.x - rect.left;
      const avatarCenter = gameStateRef.current.avatarX + (AVATAR_SIZE * gameStateRef.current.avatarScale) / 2;

      // Velocidad deseada proporcional a la distancia
      const maxDesiredSpeed = maxSpeed * 0.8;
      const distance = mouseX - avatarCenter;
      const desiredVelocity = Math.max(-maxDesiredSpeed, Math.min(maxDesiredSpeed, distance * 0.07));

      // Steering: aceleración suave hacia la velocidad deseada
      const steer = desiredVelocity - gameStateRef.current.avatarVelocityX;
      gameStateRef.current.avatarVelocityX += steer * 0.25;

      if (distance > 5) {
        newDirection = 'right';
        nowMoving = true;
      } else if (distance < -5) {
        newDirection = 'left';
        nowMoving = true;
      }
    }

    // Fricción y límites
    gameStateRef.current.avatarVelocityX *= friction;
    if (!isKeyboardMoving && (!isMouseDownRef.current || !lastMousePosRef.current)) {
      if (Math.abs(gameStateRef.current.avatarVelocityX) < 0.1) {
        gameStateRef.current.avatarVelocityX = 0;
      }
    }
    if (gameStateRef.current.avatarVelocityX > maxSpeed) gameStateRef.current.avatarVelocityX = maxSpeed;
    if (gameStateRef.current.avatarVelocityX < -maxSpeed) gameStateRef.current.avatarVelocityX = -maxSpeed;

    // Nueva posición
    let newAvatarX = gameStateRef.current.avatarX + gameStateRef.current.avatarVelocityX;
    newAvatarX = Math.max(0, Math.min(containerWidth - AVATAR_SIZE, newAvatarX));
    gameStateRef.current.avatarX = newAvatarX;
    setAvatarX(newAvatarX);

    // Actualizar estado
    if (nowMoving) {
      setIsMoving(true);
    } else {
      setIsMoving(false);
    }

    setItems(prevItems => {
      const nextItems: FallingItem[] = [];
      let scoreIncrease = 0;
      let livesDecrease = 0;
      const hitboxPadding = (8 - (gameStateRef.current.avatarScale - 1) * 4) / gameStateRef.current.avatarScale;
      const scaledAvatarSize = AVATAR_SIZE * gameStateRef.current.avatarScale;
      const baseLootExpansion = 15;
      const lootZoneExpansion = baseLootExpansion + AVATAR_SIZE * (gameStateRef.current.avatarScale - 1) * (gameStateRef.current.avatarScale > 2 ? 1.8 : 0.8);
      const avatarHitbox = {
        x: newAvatarX + (hitboxPadding * gameStateRef.current.avatarScale) - lootZoneExpansion,
        y: windowHeight - 120,
        w: scaledAvatarSize - (hitboxPadding * 2 * gameStateRef.current.avatarScale) + (lootZoneExpansion * 2),
        h: scaledAvatarSize + 20
      };

      for (const item of prevItems) {
        let speedMultiplier = gameStateRef.current.freezeActive ? 0 : gameStateRef.current.slowMultiplier;
        if (!gameStateRef.current.freezeActive && item.frozenTime && item.frozenTime > 0 && !item.releasedTime) {
          item.releasedTime = Date.now();
        }
        if (item.releasedTime) {
          const timeSinceRelease = Date.now() - item.releasedTime;
          if (timeSinceRelease < 1200) {
            speedMultiplier = 0.15;
          } else {
            item.releasedTime = undefined;
          }
        }

        const calculatedSpeed = item.speed * gameStateRef.current.difficulty * speedMultiplier * gameStateRef.current.weakGravity;
        const cappedSpeed = Math.min(calculatedSpeed, MAX_FALL_SPEED);
        let nextY = item.y + cappedSpeed;
        let nextX = item.x;

        if (!gameStateRef.current.freezeActive && item.frozenTime && item.frozenTime > 0) {
          nextX += (Math.random() - 0.5) * 150;
        }
        if (gameStateRef.current.chaosActive && !item.isBoost) {
          nextX += (Math.random() - 0.5) * 4;
        }
        if (gameStateRef.current.magnetRange > 0 && !item.isBoost && !item.isEnemy && !item.isPinata && !item.isCoin) {
          const itemCenterX = item.x + ITEM_SIZE / 2;
          const itemCenterY = item.y + ITEM_SIZE / 2;
          const distX = avatarHitbox.x + avatarHitbox.w / 2 - itemCenterX;
          const distY = avatarHitbox.y + avatarHitbox.h / 2 - itemCenterY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          if (distance < gameStateRef.current.magnetRange && distance > 0) {
            const magnetPull = 6;
            nextX += (distX / distance) * magnetPull;
            nextY += (distY / distance) * magnetPull;
          }
        }

        // Proyectiles
        if (item.isProjectile) {
          let hitEnemy = false;
          for (const otherItem of prevItems) {
            if (otherItem.isEnemy && otherItem.id !== item.id) {
              const projectileHitbox = { x: nextX, y: nextY, w: 6, h: 6 };
              const enemyHitbox = { x: otherItem.x, y: otherItem.y, w: ITEM_SIZE, h: ITEM_SIZE };
              const isHit =
                projectileHitbox.x < enemyHitbox.x + enemyHitbox.w &&
                projectileHitbox.x + projectileHitbox.w > enemyHitbox.x &&
                projectileHitbox.y < enemyHitbox.y + enemyHitbox.h &&
                projectileHitbox.y + projectileHitbox.h > enemyHitbox.y;
              if (isHit) {
                playEnemyDeathSound();
                const explosionId = explosionIdRef.current++;
                setExplosions(prev => [...prev, { id: explosionId, x: otherItem.x + ITEM_SIZE / 2, y: otherItem.y + ITEM_SIZE / 2 }]);
                setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== explosionId)), 600);
                const originX = (otherItem.x + ITEM_SIZE / 2) / (gameAreaRef.current?.clientWidth || window.innerWidth);
                const originY = otherItem.y / windowHeight;
                confetti({ particleCount: 25, spread: 100, startVelocity: 25, angle: -90, origin: { x: originX, y: originY }, colors: ['#dc2626', '#ff4444', '#ff6666'] });
                confetti({ particleCount: 20, spread: 180, startVelocity: 20, angle: 0, origin: { x: originX, y: originY }, colors: ['#dc2626', '#ff4444', '#ff6666'] });
                confetti({ particleCount: 15, spread: 100, startVelocity: 15, angle: 90, origin: { x: originX, y: originY }, colors: ['#dc2626', '#ff4444', '#ff6666'] });
                scoreIncrease += 25 * gameStateRef.current.pointsMultiplier;
                hitEnemy = true;
                break;
              }
            }
          }
          if (hitEnemy) continue;
        }

        const itemHitbox = { x: nextX, y: nextY, w: ITEM_SIZE, h: ITEM_SIZE };
        const expandedHitbox = { ...avatarHitbox };
        if (item.isCoin) {
          expandedHitbox.x -= 15;
          expandedHitbox.w += 30;
          expandedHitbox.y -= 25;
          expandedHitbox.h += 50;
        }
        const isColliding =
          itemHitbox.x < expandedHitbox.x + expandedHitbox.w &&
          itemHitbox.x + itemHitbox.w > expandedHitbox.x &&
          itemHitbox.y < expandedHitbox.y + expandedHitbox.h &&
          itemHitbox.y + itemHitbox.h > expandedHitbox.y;

        if (isColliding) {
          if (item.isBoost) {
            playBoostSound();
            applyBoost(item.boostType!);
          } else if (item.isBaseball) {
            playRareSound();
            scoreIncrease += 50 * gameStateRef.current.pointsMultiplier;
            const explosionId = explosionIdRef.current++;
            setExplosions(prev => [...prev, { id: explosionId, x: item.x + ITEM_SIZE / 2, y: item.y + ITEM_SIZE / 2 }]);
            setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== explosionId)), 600);
            confetti({ particleCount: 40, spread: 360, origin: { x: (item.x + ITEM_SIZE / 2) / (gameAreaRef.current?.clientWidth || window.innerWidth), y: item.y / windowHeight } });
          } else if (item.isEnemy) {
            if (!gameStateRef.current.invincibleActive) {
              livesDecrease += 1;
              playLifeLostSound();
            }
          } else if (item.isPinata) {
            playPinataSound();
            scoreIncrease += 75 * gameStateRef.current.pointsMultiplier;
            const explosionId = explosionIdRef.current++;
            setExplosions(prev => [...prev, { id: explosionId, x: item.x + ITEM_SIZE / 2, y: item.y + ITEM_SIZE / 2 }]);
            setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== explosionId)), 600);
            confetti({ particleCount: 50, spread: 360, startVelocity: 25, origin: { x: (item.x + ITEM_SIZE / 2) / (gameAreaRef.current?.clientWidth || window.innerWidth), y: item.y / windowHeight } });
          } else if (item.isCoin) {
            playCollectSound();
            scoreIncrease += 5 * gameStateRef.current.pointsMultiplier;
          } else {
            playCollectSound();
            const basePoints = RARES[item.itemIndex].points;
            scoreIncrease += basePoints * gameStateRef.current.pointsMultiplier;
          }
        } else if (nextY > windowHeight - 50) {
          // desaparece sin penalizar
        } else if (item.isProjectile && (nextY < -50 || nextX < -50 || nextX > containerWidth + 50)) {
          // proyectil sale
        } else {
          const updatedItem = { ...item, x: nextX, y: nextY };
          if (gameStateRef.current.freezeActive) {
            updatedItem.frozenTime = (updatedItem.frozenTime || 0) + 1;
          } else {
            updatedItem.frozenTime = 0;
          }
          nextItems.push(updatedItem);
        }
      }

      if (scoreIncrease > 0) {
        gameStateRef.current.score += scoreIncrease;
        setScore(gameStateRef.current.score);
      }
      if (livesDecrease > 0) {
        gameStateRef.current.lives -= livesDecrease;
        setLives(gameStateRef.current.lives);
      }
      return nextItems;
    });

    if (newDirection !== gameStateRef.current.avatarDirection) {
      gameStateRef.current.avatarDirection = newDirection;
      setAvatarDirection(newDirection);
    }
    if (nowMoving !== gameStateRef.current.isMoving) {
      gameStateRef.current.isMoving = nowMoving;
      setIsMoving(nowMoving);
    }

    reqRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isGameOver, windowHeight]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      lastTimeRef.current = performance.now();
      reqRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, isGameOver, gameLoop]);

  useEffect(() => {
    if (lives <= 0 && isPlaying) handleGameOver();
  }, [lives, isPlaying]);

  // === SPAWN MEJORADO ===
  useInterval(() => {
    if (!isPlaying || isGameOver || !gameAreaRef.current) return;
    const containerWidth = gameAreaRef.current.clientWidth || GAME_WIDTH;
    const padding = 50;
    const isMobile = containerWidth < 600;
    const now = Date.now();
    const isEnemyRow = now - lastRowTimeRef.current > (isMobile ? 4000 + Math.random() * 1500 : 3000 + Math.random() * 1000) && gameStateRef.current.difficulty > 0.5;
    if (isEnemyRow) {
      lastRowTimeRef.current = now;
      const rowId = enemyRowIdRef.current++;
      const mobilePatterns = ['4_in_5', 'sides', 'corners'];
      const desktopPatterns = [
        'groups_3_3', 'groups_2_2', '4_in_5', '5_in_5',
        'staircase_left', 'staircase_right', 'diagonal_left', 'diagonal_right',
        'scattered', 'corners', 'wall', 'sides'
      ];
      const patterns = isMobile ? mobilePatterns : desktopPatterns;
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let positions: number[] = [];
      const enemyPadding = 10;
      const usableWidth = containerWidth - ITEM_SIZE - enemyPadding * 2;

      const generateGroup = (count: number, groupCount: number, spacing: number) => {
        const groups: number[] = [];
        for (let g = 0; g < groupCount; g++) {
          const groupStart = Math.random() * (usableWidth - (count - 1) * spacing) + enemyPadding;
          for (let i = 0; i < count; i++) {
            groups.push(groupStart + i * spacing);
          }
        }
        return groups;
      };

      if (pattern === 'groups_3_3') {
        positions = generateGroup(3, 3, 45);
      } else if (pattern === 'groups_2_2') {
        positions = generateGroup(2, 4, 50);
      } else if (pattern === '4_in_5') {
        const zones = [0.15, 0.35, 0.65, 0.85];
        positions = zones.map(z => enemyPadding + z * usableWidth);
      } else if (pattern === '5_in_5') {
        const zones = [0.1, 0.25, 0.5, 0.75, 0.9];
        positions = zones.map(z => enemyPadding + z * usableWidth);
      } else if (pattern === 'staircase_left') {
        for (let i = 0; i < 5; i++) positions.push(enemyPadding + i * (usableWidth / 4));
      } else if (pattern === 'staircase_right') {
        for (let i = 0; i < 5; i++) positions.push(containerWidth - enemyPadding - ITEM_SIZE - i * (usableWidth / 4));
      } else if (pattern === 'diagonal_left') {
        for (let i = 0; i < 5; i++) positions.push(enemyPadding + i * 60);
      } else if (pattern === 'diagonal_right') {
        for (let i = 0; i < 5; i++) positions.push(containerWidth - enemyPadding - ITEM_SIZE - i * 60);
      } else if (pattern === 'scattered') {
        for (let i = 0; i < 5; i++) positions.push(enemyPadding + Math.random() * usableWidth);
      } else if (pattern === 'corners') {
        positions = [
          enemyPadding,
          containerWidth / 2 - ITEM_SIZE / 2,
          containerWidth - ITEM_SIZE - enemyPadding,
        ];
      } else if (pattern === 'wall') {
        for (let x = enemyPadding; x <= containerWidth - ITEM_SIZE - enemyPadding; x += ITEM_SIZE + 15) {
          positions.push(x);
        }
        positions = positions.slice(0, isMobile ? 3 : 8);
      } else if (pattern === 'sides') {
        positions = [
          enemyPadding,
          enemyPadding + 80,
          containerWidth - ITEM_SIZE - enemyPadding - 80,
          containerWidth - ITEM_SIZE - enemyPadding,
        ];
      }

      positions = positions.map(x => Math.max(enemyPadding, Math.min(x, containerWidth - ITEM_SIZE - enemyPadding)));
      const newItems = positions.map(x => ({
        id: nextItemId.current++,
        x,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + 0.2,
        isEnemy: true,
        enemyHealth: 1,
        rowId,
      }));
      setItems(prev => [...prev, ...newItems]);
      return;
    }

    const isCoin = Math.random() < 0.25;
    const isBoost = Math.random() < 0.12;
    const isEnemy = Math.random() < (isMobile ? 0.08 * gameStateRef.current.difficulty : 0.2 * gameStateRef.current.difficulty);
    const isBaseball = Math.random() < 0.08;
    const isPinata = Math.random() < 0.07;

    if (isCoin) {
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + Math.random() * 0.7,
        isCoin: true,
      }]);
    } else if (isBoost) {
      const randomBoost = BOOSTS[Math.floor(Math.random() * BOOSTS.length)];
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + Math.random() * 0.8,
        isBoost: true,
        boostType: randomBoost.id,
      }]);
    } else if (isEnemy) {
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + Math.random() * 0.6,
        isEnemy: true,
        enemyHealth: 1,
      }]);
    } else if (isBaseball) {
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + Math.random() * 0.7,
        isBaseball: true,
      }]);
    } else if (isPinata) {
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: 0,
        speed: FALL_SPEED_BASE + Math.random() * 0.6,
        isPinata: true,
      }]);
    } else {
      setItems(prev => [...prev, {
        id: nextItemId.current++,
        x: Math.random() * (containerWidth - padding * 2) + padding,
        y: -50,
        itemIndex: Math.floor(Math.random() * RARES.length),
        speed: FALL_SPEED_BASE + Math.random() * 0.8,
      }]);
    }

    gameStateRef.current.difficulty = Math.min(gameStateRef.current.difficulty + 0.002, 5);
  }, isPlaying && !isGameOver ? Math.max(250, 1000 / gameStateRef.current.difficulty) : null);

  // === MANEJADORES ===
  const handleStartGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setItems([]);
    setAvatarScale(1);
    setPointsMultiplier(1);
    setRockHealth(3);
    setInSmallZone(false);
    setShieldActive(false);
    setSpeedMultiplier(1);
    setSlowMultiplier(1);
    setMagnetRange(0);
    setFreezeActive(false);
    setInvincibleActive(false);
    setChaosActive(false);
    setWeakGravity(1);
    setDashActive(false);
    setActiveBoost(null);
    setAttackActive(false);
    setPistolActive(false);
    setMinigunActive(false);
    setPowerAttackActive(false);
    setAvatarX(gameAreaRef.current?.clientWidth ? gameAreaRef.current.clientWidth / 2 - AVATAR_SIZE / 2 : 0);
    setAvatarDirection('right');
    setIsMoving(false);
    nextItemId.current = 0;
    projectileIdRef.current = 10000;
    gameStateRef.current = {
      score: 0,
      lives: INITIAL_LIVES,
      avatarX: gameAreaRef.current?.clientWidth ? gameAreaRef.current.clientWidth / 2 - AVATAR_SIZE / 2 : 0,
      avatarVelocityX: 0,
      difficulty: 1,
      isMoving: false,
      avatarDirection: 'right',
      avatarScale: 1,
      pointsMultiplier: 1,
      shieldActive: false,
      speedMultiplier: 1,
      slowMultiplier: 1,
      magnetRange: 0,
      freezeActive: false,
      invincibleActive: false,
      chaosActive: false,
      weakGravity: 1,
      dashActive: false,
      attackActive: false,
      pistol: false,
      minigun: false,
      powerAttackActive: false,
    };
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setItems([]);
    if (score > 500) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    if (user?.username) {
      submitScore.mutate({
        username: user.username,
        score: score,
        figureString: user.figureString || undefined
      });
    }
  };

  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef<{x: number, y: number} | null>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying) return;
    isMouseDownRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    lastMousePosRef.current = { x: clientX, y: 0 };
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = null;
  };

  // ✅ handleMouseMove simplificado: solo actualiza posición, no dirección
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || !gameAreaRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    lastMousePosRef.current = { x: clientX, y: 0 };
  };

  const handleGameAreaClick = () => {
    if (isPlaying) performAttack();
  };

  return (
    <div className="w-screen h-screen overflow-hidden font-sans select-none relative"
      style={{
        backgroundImage: `url('https://files.habboemotion.com/resources/images/backgrounds/habbo_room.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#87CEEB'
      }}>
      <div className="absolute top-2 md:top-4 left-0 right-0 z-20 px-2 md:px-4 flex justify-between items-start max-w-6xl mx-auto gap-1 md:gap-2">
        <PixelCard variant="primary" className="py-1 md:py-2 px-2 md:px-4 flex items-center gap-2 md:gap-3">
          <div className="flex gap-1">
            {[...Array(INITIAL_LIVES)].map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 transition-colors ${i < lives ? 'fill-red-500 text-red-600' : 'fill-gray-300 text-gray-400'}`}
              />
            ))}
          </div>
          <div className="w-px h-8 bg-white/20 mx-2" />
          <div className="text-2xl font-pixel">{score.toLocaleString()} pts</div>
        </PixelCard>
        {activeBoost && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex gap-2">
            {BOOSTS.map(b => (
              activeBoost === b.id && (
                <motion.div key={b.id} initial={{ y: -10 }} animate={{ y: 0 }} className={`${b.color} rounded py-2 px-4 flex items-center gap-2 shadow-lg border-2 border-white`}>
                  <Zap className="w-5 h-5 text-white" />
                  <span className="text-sm font-pixel text-white font-bold">{b.label}</span>
                </motion.div>
              )
            ))}
          </motion.div>
        )}
        <PixelCard variant="neutral" className="py-2 px-4 hidden md:flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">PLAYER:</span>
          <span className="text-lg font-pixel text-primary">{user?.username}</span>
        </PixelCard>
      </div>
      <div
        ref={gameAreaRef}
        className="relative w-full max-w-5xl mx-auto h-screen cursor-none touch-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onClick={handleGameAreaClick}
      >
        {explosions.map(explosion => (
          <motion.div
            key={`explosion-${explosion.id}`}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute pointer-events-none"
            style={{ left: explosion.x, top: explosion.y, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-orange-400 rounded-full" />
            </div>
          </motion.div>
        ))}

        {items.map(item => (
          <div key={item.id} className="absolute" style={{ left: item.x, top: item.y }}>
            {item.isBaseball ? (
              <div className="w-10 h-10 rounded-full bg-white border-4 border-red-500 shadow-lg flex items-center justify-center">
                <div className="w-8 h-1 bg-red-500 absolute" style={{ transform: 'rotate(45deg)' }} />
                <div className="w-8 h-1 bg-red-500 absolute" style={{ transform: 'rotate(-45deg)' }} />
              </div>
            ) : item.isProjectile ? (
              <div className={`w-3 h-3 rounded-full ${item.projectileType === 'pistol' ? 'bg-yellow-400' : 'bg-red-500'} shadow-lg`} />
            ) : item.isEnemy ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: attackActive ? 0.6 : 1 }}
                className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg border-2 border-red-900 relative"
              >
                <Skull className="w-6 h-6" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-700 text-white text-xs px-1 rounded font-bold">
                  ENEMY
                </div>
              </motion.div>
            ) : item.isPinata ? (
              <img
                src="/piñata.png"
                alt="piñata"
                className="w-10 h-10 object-contain drop-shadow-md pixelated"
              />
            ) : item.isCoin ? (
              <img
                src="/coin.png"
                alt="coin"
                className="w-10 h-10 object-contain drop-shadow-md pixelated"
              />
            ) : item.isBoost ? (
              <motion.div initial={{ scale: 0.5, rotate: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ duration: 0.8 }} className={`${BOOSTS.find(b => b.id === item.boostType)?.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white`}>
                {item.boostType === 'size' && <Maximize2 className="w-5 h-5" />}
                {item.boostType === '2x' && <span className="text-lg font-bold">2X</span>}
                {item.boostType === '3x' && <span className="text-lg font-bold">3X</span>}
                {item.boostType === 'shield' && <Shield className="w-5 h-5" />}
                {item.boostType === 'speed' && <Bolt className="w-5 h-5" />}
                {item.boostType === 'slow' && <Hourglass className="w-5 h-5" />}
                {item.boostType === 'magnet' && <Magnet className="w-5 h-5" />}
                {item.boostType === 'freeze' && <Snowflake className="w-5 h-5" />}
                {item.boostType === 'bomb' && <Bomb className="w-5 h-5" />}
                {item.boostType === 'life' && <Gift className="w-5 h-5" />}
                {item.boostType === 'invincible' && <AlertCircle className="w-5 h-5" />}
                {item.boostType === 'mega_size' && <Maximize2 className="w-5 h-5" />}
                {item.boostType === '5x' && <span className="text-lg font-bold">5X</span>}
                {item.boostType === 'mega_magnet' && <Magnet className="w-5 h-5" />}
                {item.boostType === 'chaos' && <Shuffle className="w-5 h-5" />}
                {item.boostType === 'weak' && <TrendingDown className="w-5 h-5" />}
                {item.boostType === 'dash' && <Bolt className="w-5 h-5" />}
                {item.boostType === '10x' && <span className="text-lg font-bold">10X</span>}
                {item.boostType === 'split' && <Shuffle className="w-5 h-5" />}
                {item.boostType === 'shrink' && <TrendingDown className="w-5 h-5" />}
                {item.boostType === 'drift' && <Bolt className="w-5 h-5" />}
                {item.boostType === 'pistol' && <Zap className="w-5 h-5" />}
                {item.boostType === 'minigun' && <Flame className="w-5 h-5" />}
                {item.boostType === 'power_attack' && <Bolt className="w-5 h-5" />}
              </motion.div>
            ) : (
              <img
                src={RARES[item.itemIndex].url}
                alt="rare"
                className="w-10 h-10 object-contain drop-shadow-md pixelated"
              />
            )}
          </div>
        ))}

        <div className="absolute left-0 bottom-20 w-20 h-32 bg-slate-700/40 border-r-4 border-slate-900 border-t-4 rounded-tr-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-bold text-slate-900">SHRINK ONLY</div>
            <TrendingDown className="w-6 h-6 text-slate-900 mx-auto" />
          </div>
        </div>
        <div className="absolute right-0 bottom-20 bg-purple-700/40 border-l-4 border-purple-900 border-t-4 rounded-tl-lg" style={{ width: '160px', height: '280px' }}>
          <div className="text-center">
            <div className="text-xs font-bold text-purple-900">MEGA ONLY</div>
            <Maximize2 className="w-6 h-6 text-purple-900 mx-auto" />
          </div>
        </div>

        {user && (
          <div
            className="absolute bottom-20 will-change-transform"
            style={{ transform: `translateX(${avatarX}px)`, width: AVATAR_SIZE }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-sm border border-black/10">
              {user.username}
            </div>
            {attackActive && pistolActive && (
              <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -100, opacity: 0 }} transition={{ duration: 0.4 }} className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none">
                <div className="flex flex-col gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg ml-4" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg -ml-4" />
                </div>
              </motion.div>
            )}
            {attackActive && !pistolActive && (
              <motion.div initial={{ scale: 0, rotate: 0 }} animate={{ scale: 1.2, rotate: 360 }} transition={{ duration: 0.3 }} className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none">
                <div className="text-4xl">💥</div>
              </motion.div>
            )}
            <div style={{ transform: `scale(${avatarScale})`, transformOrigin: 'bottom center' }}>
              <img
                src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${user.figureString || 'hr-155-1035.hd-185-1026.ch-255-1189.lg-275-1239.sh-290-62'}&gender=M&direction=${avatarDirection === 'left' ? 4 : 2}&head_direction=${avatarDirection === 'left' ? 4 : 2}&action=${attackActive ? 'crr%3D257' : isMoving ? 'wlk' : 'std'}&gesture=nrm&size=l`}
                alt="avatar"
                className="w-full h-auto drop-shadow-xl pixelated scale-125 origin-bottom"
                draggable={false}
              />
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/20 rounded-full blur-[2px]" />
          </div>
        )}

        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-b from-cyan-200 to-blue-300 border-t-4 border-cyan-400 shadow-inner" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.3) 80px, rgba(255,255,255,0.3) 160px)',
        }} />
      </div>

      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
            <PixelCard variant="neutral" className="bg-white text-center space-y-6 shadow-2xl">
              <div className="space-y-2">
                <h1 className="text-5xl font-pixel text-primary drop-shadow-sm">RARE CATCHER</h1>
                <p className="text-muted-foreground">Catch rares & collect BOOSTS!</p>
              </div>
              <div className="flex justify-center py-4">
                <div className="relative w-24 h-24 bg-blue-100 rounded-full border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                  {user?.figureString && (
                    <img
                      src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${user.figureString}&action=wav&gesture=sml&size=l&head_direction=3`}
                      className="absolute -top-4"
                      alt="Preview"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <PixelButton onClick={handleStartGame} size="lg" className="flex-1 animate-pulse shadow-lg shadow-primary/20">
                  <Play className="mr-2 w-5 h-5" /> START GAME
                </PixelButton>
                <PixelButton onClick={() => setShowBoosts(!showBoosts)} variant="outline" size="lg" className="flex-1 shadow-lg">
                  <Zap className="mr-2 w-5 h-5" /> BOOSTS
                </PixelButton>
              </div>
              {showBoosts && (
                <div className="space-y-2 bg-gradient-to-br from-purple-50 to-orange-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                  <div className="font-bold text-sm mb-2 sticky top-0 bg-white py-2">AVAILABLE BOOSTS ({BOOSTS.length}):</div>
                  {BOOSTS.map(b => (
                    <div key={b.id} className={`${b.color} text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1`}>
                      <Zap className="w-3 h-3" />
                      {b.label}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t">
                <button
                  onClick={() => setLocation("/")}
                  className="text-sm text-muted-foreground hover:text-primary underline decoration-dotted"
                >
                  Change User
                </button>
              </div>
            </PixelCard>
          </motion.div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6 my-auto">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <PixelCard variant="neutral" className="bg-white h-full flex flex-col items-center justify-center text-center space-y-6">
                <div>
                  <h2 className="text-4xl font-pixel text-destructive mb-2">GAME OVER!</h2>
                  <p className="text-muted-foreground">Great effort, {user?.username}!</p>
                </div>
                <div className="py-6">
                  <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold mb-1">Final Score</div>
                  <div className="text-7xl font-pixel text-primary drop-shadow-md">
                    {score}
                  </div>
                </div>
                <div className="w-full space-y-3">
                  <PixelButton onClick={handleStartGame} variant="primary" className="w-full">
                    <RefreshCcw className="mr-2 w-4 h-4" /> PLAY AGAIN
                  </PixelButton>
                  <PixelButton onClick={() => setLocation("/")} variant="outline" className="w-full">
                    <Home className="mr-2 w-4 h-4" /> MAIN MENU
                  </PixelButton>
                </div>
              </PixelCard>
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Leaderboard />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}