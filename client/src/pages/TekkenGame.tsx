import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useHabboUser } from "@/hooks/use-game";
import { PixelButton } from "@/components/PixelButton";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 100;
const MAX_HP = 200;
const GRAVITY = 0.6;
const JUMP_STRENGTH = 15;
const GROUND_Y = GAME_HEIGHT - PLAYER_SIZE - 50;

export default function TekkenGame() {
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username") || "Player";
  const { data: playerData } = useHabboUser(username);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null);
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [opponentHp, setOpponentHp] = useState(MAX_HP);
  const [playerX, setPlayerX] = useState(100);
  const [opponentX, setOpponentX] = useState(GAME_WIDTH - PLAYER_SIZE - 100);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [opponentY, setOpponentY] = useState(GROUND_Y);
  const [playerVelY, setPlayerVelY] = useState(0);
  const [opponentVelY, setOpponentVelY] = useState(0);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [opponentAttacking, setOpponentAttacking] = useState(false);
  const [playerDirection, setPlayerDirection] = useState<"left" | "right">("right");
  const [opponentDirection, setOpponentDirection] = useState<"left" | "right">("left");
  const [isPlayerBlocking, setIsPlayerBlocking] = useState(false);
  const [isOpponentBlocking, setIsOpponentBlocking] = useState(false);
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [hits, setHits] = useState<Array<{ x: number; y: number; damage: number; id: number }>>([]);
  const [boosts, setBoosts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();
  const lastHitId = useRef(0);
  const boostId = useRef(0);
  const attackCooldown = useRef(0);
  const opponentAI = useRef(0);
  const playerOnGround = useRef(true);
  const opponentOnGround = useRef(true);

  // 👇 Teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if ([" ", "tab", "w", "a", "s", "d", "arrowup", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 👇 Sonido simple
  const playSound = (freq: number, duration = 0.1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // 👇 Efecto de golpe
  const addHitEffect = (x: number, y: number, damage: number) => {
    const id = lastHitId.current++;
    setHits(prev => [...prev, { x, y, damage, id }]);
    setTimeout(() => setHits(prev => prev.filter(h => h.id !== id)), 1000);
  };

  // 👇 Loop principal
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const update = () => {
      const now = Date.now();

      // === Jugador ===
      let newPlayerX = playerX;
      let newPlayerY = playerY;
      let newPlayerVelY = playerVelY + GRAVITY;
      let isMoving = false;

      if (keysPressed.current.has("a") || keysPressed.current.has("arrowleft")) {
        newPlayerX = Math.max(0, playerX - 8);
        setPlayerDirection("left");
        isMoving = true;
      }
      if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) {
        newPlayerX = Math.min(GAME_WIDTH - PLAYER_SIZE, playerX + 8);
        setPlayerDirection("right");
        isMoving = true;
      }
      setIsPlayerMoving(isMoving);

      if ((keysPressed.current.has("w") || keysPressed.current.has("arrowup")) && playerOnGround.current) {
        newPlayerVelY = -JUMP_STRENGTH;
        playerOnGround.current = false;
        playSound(400);
      }

      newPlayerY += newPlayerVelY;
      if (newPlayerY >= GROUND_Y) {
        newPlayerY = GROUND_Y;
        newPlayerVelY = 0;
        playerOnGround.current = true;
      } else {
        playerOnGround.current = false;
      }

      setPlayerX(newPlayerX);
      setPlayerY(newPlayerY);
      setPlayerVelY(newPlayerVelY);

      // === Oponente (IA mejorada) ===
      let newOpponentX = opponentX;
      let newOpponentY = opponentY;
      let newOpponentVelY = opponentVelY + GRAVITY;

      newOpponentY += newOpponentVelY;
      if (newOpponentY >= GROUND_Y) {
        newOpponentY = GROUND_Y;
        newOpponentVelY = 0;
        opponentOnGround.current = true;
      } else {
        opponentOnGround.current = false;
      }

      // IA aleatoria mejorada - menos predecible
      const distToPlayer = Math.abs(opponentX - newPlayerX);
      const randomDecision = Math.random();
      
      // Buscar item más cercano
      let closestBoost = null;
      let minBoostDist = 200;
      for (const boost of boosts) {
        const dx = (opponentX + PLAYER_SIZE / 2) - boost.x;
        const dy = (GROUND_Y - boost.y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minBoostDist) {
          minBoostDist = dist;
          closestBoost = boost;
        }
      }

      // IA con aleatoriedad: 40% items, 30% atacar, 30% otro
      const shouldGoForBoost = closestBoost && minBoostDist < 180 && randomDecision < 0.4;
      const shouldAttack = distToPlayer < 80 && randomDecision > 0.4 && randomDecision < 0.7;
      const shouldRandomMove = randomDecision > 0.8;

      if (shouldGoForBoost) {
        // Recoger items
        newOpponentX = closestBoost.x > opponentX + PLAYER_SIZE / 2 ? 
          Math.min(GAME_WIDTH - PLAYER_SIZE, opponentX + 5) : 
          Math.max(0, opponentX - 5);
        setOpponentDirection(closestBoost.x > opponentX + PLAYER_SIZE / 2 ? "right" : "left");
        
        if (opponentOnGround.current && closestBoost.y < GROUND_Y - 100) {
          newOpponentVelY = -JUMP_STRENGTH;
          opponentOnGround.current = false;
        }
      } 
      else if (shouldAttack) {
        // Atacar cuando está cerca (verificar distancia real)
        if (now - opponentAI.current > 1500 && Math.abs(newOpponentX - newPlayerX) < 70) {
          setOpponentAttacking(true);
          setTimeout(() => setOpponentAttacking(false), 300);
          if (!isPlayerBlocking) {
            const dmg = 25 + Math.random() * 20;
            setPlayerHp(hp => Math.max(0, hp - dmg));
            addHitEffect(newPlayerX + PLAYER_SIZE / 2, newPlayerY, dmg);
            playSound(120);
          }
          opponentAI.current = now;
        }

        // Saltar para esquivar
        if (opponentOnGround.current && Math.random() < 0.08) {
          newOpponentVelY = -JUMP_STRENGTH * 0.7;
          opponentOnGround.current = false;
        }

        // Bloqueo aleatorio
        setIsOpponentBlocking(Math.random() < 0.25);
      }
      else if (shouldRandomMove) {
        // Movimiento aleatorio sin objetivo
        const moveDir = Math.random();
        if (moveDir < 0.3) {
          newOpponentX = Math.max(0, opponentX - 4);
          setOpponentDirection("left");
        } else if (moveDir < 0.6) {
          newOpponentX = Math.min(GAME_WIDTH - PLAYER_SIZE, opponentX + 4);
          setOpponentDirection("right");
        }
      }
      else {
        // Buscar al jugador (no seguir constantemente)
        if (distToPlayer > 120 && randomDecision < 0.5) {
          const moveSpeed = 4;
          newOpponentX = opponentX > newPlayerX ? 
            Math.max(0, opponentX - moveSpeed) : 
            Math.min(GAME_WIDTH - PLAYER_SIZE, opponentX + moveSpeed);
          setOpponentDirection(opponentX > newPlayerX ? "left" : "right");
        }
      }

      setOpponentX(newOpponentX);
      setOpponentY(newOpponentY);
      setOpponentVelY(newOpponentVelY);

      // === Ataque jugador ===
      if (keysPressed.current.has(" ") && now - attackCooldown.current > 800) {
        setPlayerAttacking(true);
        setTimeout(() => setPlayerAttacking(false), 300);
        playSound(250);
        if (Math.abs(newPlayerX - newOpponentX) < 70) {
          if (!isOpponentBlocking) {
            const dmg = 30 + Math.random() * 20;
            setOpponentHp(hp => Math.max(0, hp - dmg));
            addHitEffect(newOpponentX + PLAYER_SIZE / 2, newOpponentY, dmg);
            playSound(100);
          }
        }
        attackCooldown.current = now;
      }

      // === Bloqueo con TAB ===
      setIsPlayerBlocking(keysPressed.current.has("tab"));

      // === Boosts (simple, cada 3s) ===
      if (Math.random() < 0.005) {
        setBoosts(prev => [...prev, { id: boostId.current++, x: Math.random() * (GAME_WIDTH - 40), y: -50 }]);
      }

      // === Mover boosts y colisiones ===
      setBoosts(prev =>
        prev
          .map(b => ({ ...b, y: b.y + 4 }))
          .filter(b => {
            const playerHit = Math.abs((playerX + PLAYER_SIZE / 2) - b.x) < 40 && Math.abs(GROUND_Y - b.y) < 40;
            const opponentHit = Math.abs((opponentX + PLAYER_SIZE / 2) - b.x) < 40 && Math.abs(GROUND_Y - b.y) < 40;
            if (playerHit) {
              setPlayerHp(hp => Math.min(MAX_HP, hp + 50));
              playSound(600);
              return false;
            }
            if (opponentHit) {
              setOpponentHp(hp => Math.min(MAX_HP, hp + 50));
              return false;
            }
            return b.y < GAME_HEIGHT + 100;
          })
      );

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, playerX, playerY, playerVelY, opponentX, opponentY, opponentVelY, isPlayerBlocking, isOpponentBlocking, boosts]);

  // 👇 Verificar fin del juego
  useEffect(() => {
    if (playerHp <= 0) {
      setIsPlaying(false);
      setIsGameOver(true);
      setWinner("opponent");
    } else if (opponentHp <= 0) {
      setIsPlaying(false);
      setIsGameOver(true);
      setWinner("player");
    }
  }, [playerHp, opponentHp]);

  const handleStartGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setWinner(null);
    setPlayerHp(MAX_HP);
    setOpponentHp(MAX_HP);
    setPlayerX(100);
    setOpponentX(GAME_WIDTH - PLAYER_SIZE - 100);
    setPlayerY(GROUND_Y);
    setOpponentY(GROUND_Y);
    setPlayerVelY(0);
    setOpponentVelY(0);
    setHits([]);
    setBoosts([]);
    attackCooldown.current = 0;
    opponentAI.current = 0;
    playerOnGround.current = true;
    opponentOnGround.current = true;
  };

  // 👇 Avatar seguro (¡sin espacios en la URL!)
  const getPlayerFigure = () =>
    encodeURIComponent(playerData?.figureString || "hr-155-1035.hd-185-1026.ch-255-1189.lg-275-1239.sh-290-62");

  const getOpponentFigure = () =>
    "hr-845-1191.hd-180-1.ch-210-66.lg-280-110.sh-305-62";

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-pixel text-red-400 mb-4 text-center drop-shadow-lg" style={{ textShadow: "4px 4px 0px #000000" }}>
        HABBO TEKKEN
      </h1>

      {!isPlaying && !isGameOver && (
        <div className="text-center mb-8">
          <p className="text-slate-300 text-lg mb-4">¡Derrota al oponente!</p>
          <PixelButton onClick={handleStartGame} size="lg">
            ⚔️ JUGAR
          </PixelButton>
        </div>
      )}

      {(isPlaying || isGameOver) && (
        <>
          {/* Barras de vida */}
          <div className="w-full max-w-2xl mb-4 px-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-blue-300 font-bold text-sm">TÚ</span>
                  <span className="text-white text-sm font-bold">{Math.ceil(playerHp)}/{MAX_HP}</span>
                </div>
                <div className="w-full h-6 bg-slate-900 border-2 border-blue-500 rounded">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(playerHp / MAX_HP) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-red-300 font-bold text-sm">OPONENTE</span>
                  <span className="text-white text-sm font-bold">{Math.ceil(opponentHp)}/{MAX_HP}</span>
                </div>
                <div className="w-full h-6 bg-slate-900 border-2 border-red-500 rounded">
                  <div
                    className="h-full bg-red-500 ml-auto"
                    style={{ width: `${(opponentHp / MAX_HP) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Área de juego */}
          <div
            className="relative border-6 border-yellow-600 rounded-lg overflow-hidden bg-gradient-to-b from-slate-700 to-slate-800 shadow-2xl"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Suelo */}
            <div className="absolute bottom-12 w-full h-4 bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-lg" />

            {/* Efectos de golpe */}
            {hits.map(hit => (
              <motion.div
                key={hit.id}
                className="absolute text-red-600 font-bold text-2xl drop-shadow-lg"
                style={{ left: hit.x, top: hit.y }}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.3 }}
                transition={{ duration: 1 }}
              >
                -{Math.ceil(hit.damage)}
              </motion.div>
            ))}

            {/* Boosts */}
            {boosts.map(boost => (
              <div
                key={boost.id}
                className="absolute w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs"
                style={{ left: boost.x, top: boost.y }}
              >
                ❤️
              </div>
            ))}

            {/* Jugador */}
            <div
              className="absolute"
              style={{ left: playerX, bottom: GAME_HEIGHT - playerY - PLAYER_SIZE }}
            >
              <img
                src={`https://www.habbo.es/habbo-imaging/avatarimage?figure=${getPlayerFigure()}&direction=${playerDirection === "right" ? 2 : 4}&head_direction=${playerDirection === "right" ? 2 : 4}&action=${playerAttacking ? "spk" : isPlayerMoving ? "wlk" : "std"}&gesture=sml&size=b`}
                alt="Player"
                className="w-24 h-32"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://www.habbo.com/habbo-imaging/avatarimage?figure=${getPlayerFigure()}&direction=${playerDirection === "right" ? 2 : 4}&head_direction=${playerDirection === "right" ? 2 : 4}&action=${playerAttacking ? "spk" : isPlayerMoving ? "wlk" : "std"}&gesture=sml&size=b`;
                }}
              />
            </div>

            {/* Oponente */}
            <div
              className="absolute"
              style={{ left: opponentX, bottom: GAME_HEIGHT - opponentY - PLAYER_SIZE }}
            >
              <img
                src={`https://www.habbo.es/habbo-imaging/avatarimage?figure=${getOpponentFigure()}&direction=${opponentDirection === "left" ? 4 : 2}&head_direction=${opponentDirection === "left" ? 4 : 2}&action=${opponentAttacking ? "spk" : isOpponentMoving ? "wlk" : "std"}&gesture=sml&size=b`}
                alt="Opponent"
                className="w-24 h-32"
              />
            </div>
          </div>

          <div className="mt-4 text-center text-slate-200 text-xs max-w-2xl">
            <p>⌨️ A/D o ←→: Mover | W/↑: Saltar | ESPACIO: Atacar | TAB: Bloquear</p>
          </div>
        </>
      )}

      {isGameOver && winner && (
        <div className="mt-8 text-center">
          <h2 className="text-4xl font-bold text-yellow-400 mb-4">
            {winner === "player" ? "🎉 ¡GANASTE!" : "💀 PERDISTE"}
          </h2>
          <div className="flex gap-4 justify-center">
            <PixelButton onClick={handleStartGame}>JUGAR DE NUEVO</PixelButton>
            <PixelButton onClick={() => setLocation("/menu")} variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-1" /> MENÚ
            </PixelButton>
          </div>
        </div>
      )}

      {!isPlaying && !isGameOver && (
        <PixelButton onClick={() => setLocation("/menu")} variant="secondary" className="mt-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> VOLVER
        </PixelButton>
      )}

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
}