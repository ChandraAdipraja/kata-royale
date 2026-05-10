import crypto from "crypto";
import Lobby from "../models/Lobby.js";
import Match from "../models/Match.js";
import User from "../models/User.js";
import { verifyToken } from "../utils/auth.js";
import { validateWord } from "../utils/wordValidationService.js";
import { validateCategory, randomCategory } from "../utils/categoryValidationService.js";

const games = new Map();
const alphabet = "abcdefghijklmnopqrstuvwxyz";

const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)];
const makeRoomCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();
const publicLobby = (lobby) => lobby.toObject?.() || lobby;
const playerKey = (player) => player.userId?.toString() || player.guestId || player.socketId;
const alivePlayers = (game) => game.players.filter((player) => player.alive && player.hp > 0);

const resolveSocketUser = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return User.findById(decoded.id).select("-password");
  } catch (_error) {
    return null;
  }
};

const makePlayer = (socket, user, hp, isHost = false, guestName = "", guestId = "") => {
  const fallbackName = guestName?.trim() || socket.handshake.auth?.guestName || `Guest_${socket.id.slice(0, 4).toUpperCase()}`;

  return {
    userId: user?._id || null,
    guestId: user ? null : guestId || socket.handshake.auth?.guestId || null,
    socketId: socket.id,
    username: user?.username || fallbackName,
    avatar: user?.avatar || "Avatar1.png",
    isGuest: !user,
    isHost,
    ready: isHost,
    hp,
    alive: true
  };
};

const emitLobby = async (io, roomCode) => {
  const lobby = await Lobby.findOne({ roomCode });
  if (lobby) io.to(roomCode).emit("lobby:updated", publicLobby(lobby));
};

const statePayload = (game) => ({
  roomCode: game.roomCode,
  currentLetter: game.currentLetter,
  currentCategory: game.currentCategory,
  currentTurnPlayerId: playerKey(game.players[game.turnIndex]),
  currentTurnUsername: game.players[game.turnIndex]?.username,
  secondsLeft: game.secondsLeft,
  isValidating: Boolean(game.isValidating),
  validatingWord: game.validatingWord || "",
  timer: game.settings.timer,
  maxHp: game.settings.hp,
  players: game.players,
  wordsUsed: game.wordsUsed,
  status: game.status,
  winner: game.winner || null
});

const emitGameState = (io, game) => {
  io.to(game.roomCode).emit("game:state_updated", statePayload(game));
};

const syncLobbyPlayers = async (game) => {
  await Lobby.updateOne(
    { roomCode: game.roomCode },
    {
      players: game.players.map((player) => ({
        userId: player.userId,
        guestId: player.guestId,
        socketId: player.socketId,
        username: player.username,
        avatar: player.avatar || "Avatar1.png",
        isGuest: player.isGuest,
        isHost: player.isHost,
        ready: player.ready,
        hp: player.hp,
        alive: player.alive
      }))
    }
  );
};

export const syncUserAvatarInRooms = async (io, userId, avatar) => {
  const userIdString = userId?.toString();
  if (!io || !userIdString) return;

  const lobbies = await Lobby.find({ "players.userId": userId });
  await Promise.all(
    lobbies.map(async (lobby) => {
      let changed = false;

      lobby.players.forEach((player) => {
        if (player.userId?.toString() === userIdString) {
          player.avatar = avatar;
          changed = true;
        }
      });

      if (!changed) return;
      await lobby.save();
      io.to(lobby.roomCode).emit("lobby:updated", publicLobby(lobby));
    })
  );

  games.forEach((game) => {
    let changed = false;

    game.players.forEach((player) => {
      if (player.userId?.toString() === userIdString) {
        player.avatar = avatar;
        changed = true;
      }
    });

    if (changed) emitGameState(io, game);
  });
};

const updateStats = async (game) => {
  const validWordCounts = new Map();
  for (const entry of game.wordEvents) {
    if (entry.isValid && entry.userId) {
      const key = entry.userId.toString();
      validWordCounts.set(key, (validWordCounts.get(key) || 0) + 1);
    }
  }

  await Promise.all(
    game.players
      .filter((player) => player.userId)
      .map(async (player) => {
        const isWinner = playerKey(player) === playerKey(game.winner);
        const user = await User.findById(player.userId);
        if (!user) return;

        user.totalMatch += 1;
        user.win += isWinner ? 1 : 0;
        user.lose += isWinner ? 0 : 1;
        user.totalValidWords += validWordCounts.get(player.userId.toString()) || 0;
        user.recalculateWinrate();
        await user.save();
      })
  );
};

const finishGame = async (io, game) => {
  if (game.status === "finished") return;

  game.status = "finished";
  game.winner = alivePlayers(game)[0] || game.players.find((player) => player.hp > 0) || game.players[0];
  clearInterval(game.interval);
  await syncLobbyPlayers(game);
  await Lobby.updateOne({ roomCode: game.roomCode }, { status: "finished" });
  await Match.create({
    roomCode: game.roomCode,
    players: game.players,
    winner: game.winner,
    wordsUsed: game.wordsUsed
  });
  await updateStats(game);

  io.to(game.roomCode).emit("game:finished", statePayload(game));
  emitGameState(io, game);
};

const moveTurn = (io, game) => {
  const alive = alivePlayers(game);
  if (alive.length <= 1) return finishGame(io, game);

  let nextIndex = game.turnIndex;
  do {
    nextIndex = (nextIndex + 1) % game.players.length;
  } while (!game.players[nextIndex].alive || game.players[nextIndex].hp <= 0);

  game.turnIndex = nextIndex;
  game.secondsLeft = game.settings.timer;
  io.to(game.roomCode).emit("game:turn_changed", statePayload(game));
  emitGameState(io, game);
  return null;
};

const penalizeCurrentPlayer = async (io, game, reason) => {
  const player = game.players[game.turnIndex];
  if (!player) return;

  player.hp = Math.max(player.hp - 1, 0);
  if (player.hp === 0) {
    player.alive = false;
    io.to(game.roomCode).emit("game:player_eliminated", { playerId: playerKey(player), username: player.username });
  }

  await syncLobbyPlayers(game);
  io.to(game.roomCode).emit("game:word_invalid", { playerId: playerKey(player), username: player.username, reason });
  await moveTurn(io, game);
};

const startTimer = (io, game) => {
  clearInterval(game.interval);
  game.interval = setInterval(async () => {
    if (game.status !== "playing") return;
    if (game.isValidating) return;

    game.secondsLeft -= 1;
    emitGameState(io, game);

    if (game.secondsLeft <= 0) {
      await penalizeCurrentPlayer(io, game, "Timeout");
    }
  }, 1000);
};

export const registerGameSocket = (io) => {
  io.use(async (socket, next) => {
    socket.user = await resolveSocketUser(socket);
    next();
  });

  io.on("connection", (socket) => {
    socket.on("lobby:create", async (payload = {}, callback) => {
      try {
        const settings = {
          maxPlayers: Number(payload.maxPlayers) || 4,
          hp: Number(payload.hp) || 3,
          timer: Number(payload.timer) || 15,
          isPublic: payload.isPublic !== false,
          categoryChallenge: Boolean(payload.categoryChallenge)
        };

        const roomCode = makeRoomCode();
        const player = makePlayer(socket, socket.user, settings.hp, true, payload.guestName, payload.guestId);
        const lobby = await Lobby.create({
          roomCode,
          name: payload.name?.trim() || `${player.username}'s Lobby`,
          players: [player],
          settings,
          status: "waiting"
        });

        socket.join(roomCode);
        callback?.({ ok: true, lobby: publicLobby(lobby) });
        await emitLobby(io, roomCode);
      } catch (error) {
        callback?.({ ok: false, message: "Gagal membuat lobby" });
      }
    });

    socket.on("lobby:join", async ({ roomCode, guestName, guestId } = {}, callback) => {
      try {
        const code = roomCode?.trim().toUpperCase();
        const lobby = await Lobby.findOne({ roomCode: code });
        if (!lobby) return callback?.({ ok: false, message: "Lobby tidak ditemukan" });
        if (lobby.status !== "waiting") {
          const existingPlayer = lobby.players.find(
            (player) =>
              (socket.user && player.userId?.toString() === socket.user._id.toString()) ||
              (!socket.user && (guestId || socket.handshake.auth?.guestId) && player.guestId === (guestId || socket.handshake.auth.guestId))
          );

          if (!existingPlayer) return callback?.({ ok: false, message: "Game sudah berjalan" });

          existingPlayer.socketId = socket.id;
          await lobby.save();
          const game = games.get(code);
          if (game) {
            const gamePlayer = game.players.find((player) => playerKey(player) === playerKey(existingPlayer));
            if (gamePlayer) gamePlayer.socketId = socket.id;
          }
          socket.join(code);
          return callback?.({ ok: true, lobby: publicLobby(lobby), gameState: game ? statePayload(game) : null });
        }
        if (lobby.players.length >= lobby.settings.maxPlayers) return callback?.({ ok: false, message: "Lobby penuh" });

        const alreadyJoined = lobby.players.some(
          (player) =>
            player.socketId === socket.id ||
            (socket.user && player.userId?.toString() === socket.user._id.toString()) ||
            (!socket.user && (guestId || socket.handshake.auth?.guestId) && player.guestId === (guestId || socket.handshake.auth.guestId))
        );
        if (!alreadyJoined) {
          lobby.players.push(makePlayer(socket, socket.user, lobby.settings.hp, false, guestName, guestId || socket.handshake.auth?.guestId));
        } else {
          const player = lobby.players.find(
            (item) =>
              item.socketId === socket.id ||
              (socket.user && item.userId?.toString() === socket.user._id.toString()) ||
              (!socket.user && (guestId || socket.handshake.auth?.guestId) && item.guestId === (guestId || socket.handshake.auth.guestId))
          );
          if (player) player.socketId = socket.id;
        }

        await lobby.save();
        socket.join(code);
        callback?.({ ok: true, lobby: publicLobby(lobby) });
        await emitLobby(io, code);
      } catch (error) {
        callback?.({ ok: false, message: "Gagal join lobby" });
      }
    });

    socket.on("game:sync", ({ roomCode } = {}, callback) => {
      const game = games.get(roomCode?.toUpperCase());
      if (!game) return callback?.({ ok: false, message: "Game tidak ditemukan atau sudah selesai" });

      const player = game.players.find(
        (item) =>
          item.socketId === socket.id ||
          (socket.user && item.userId?.toString() === socket.user._id.toString()) ||
          (!socket.user && socket.handshake.auth?.guestId && item.guestId === socket.handshake.auth.guestId)
      );
      if (player) player.socketId = socket.id;
      socket.join(game.roomCode);
      callback?.({ ok: true, state: statePayload(game) });
    });

    socket.on("lobby:ready", async ({ roomCode, ready } = {}, callback) => {
      const lobby = await Lobby.findOne({ roomCode: roomCode?.toUpperCase() });
      if (!lobby || lobby.status !== "waiting") return callback?.({ ok: false, message: "Lobby tidak tersedia" });

      const player = lobby.players.find((item) => item.socketId === socket.id);
      if (!player) return callback?.({ ok: false, message: "Kamu belum ada di lobby" });

      player.ready = Boolean(ready);
      if (player.isHost) player.ready = true;
      await lobby.save();
      callback?.({ ok: true });
      await emitLobby(io, lobby.roomCode);
    });

    socket.on("lobby:start", async ({ roomCode } = {}, callback) => {
      const lobby = await Lobby.findOne({ roomCode: roomCode?.toUpperCase() });
      if (!lobby) return callback?.({ ok: false, message: "Lobby tidak ditemukan" });
      const host = lobby.players.find((player) => player.socketId === socket.id && player.isHost);
      if (!host) return callback?.({ ok: false, message: "Hanya host yang bisa mulai" });
      if (lobby.players.length < 2) return callback?.({ ok: false, message: "Minimal 2 pemain" });
      if (!lobby.players.every((player) => player.ready || player.isHost)) {
        return callback?.({ ok: false, message: "Semua pemain harus ready" });
      }

      lobby.status = "playing";
      lobby.players.forEach((player) => {
        player.hp = lobby.settings.hp;
        player.alive = true;
      });
      await lobby.save();

      const game = {
        roomCode: lobby.roomCode,
        settings: {
          maxPlayers: lobby.settings.maxPlayers,
          hp: lobby.settings.hp,
          timer: lobby.settings.timer,
          isPublic: lobby.settings.isPublic,
          categoryChallenge: lobby.settings.categoryChallenge
        },
        players: lobby.players.map((player) => player.toObject()),
        currentLetter: randomLetter(),
        currentCategory: lobby.settings.categoryChallenge ? randomCategory() : null,
        turnIndex: 0,
        secondsLeft: lobby.settings.timer,
        wordsUsed: [],
        wordEvents: [],
        status: "playing",
        isValidating: false,
        validatingWord: "",
        winner: null,
        interval: null
      };

      games.set(lobby.roomCode, game);
      callback?.({ ok: true, state: statePayload(game) });
      io.to(lobby.roomCode).emit("game:started", statePayload(game));
      emitGameState(io, game);
      startTimer(io, game);
    });

    socket.on("lobby:close", async ({ roomCode } = {}, callback) => {
      const code = roomCode?.toUpperCase();
      const lobby = await Lobby.findOne({ roomCode: code, status: "waiting" });
      if (!lobby) return callback?.({ ok: false, message: "Lobby tidak ditemukan" });

      const host = lobby.players.find((player) => player.socketId === socket.id && player.isHost);
      if (!host) return callback?.({ ok: false, message: "Hanya host yang bisa membubarkan" });

      io.to(code).emit("lobby:closed", { roomCode: code });
      await Lobby.deleteOne({ roomCode: code });
      callback?.({ ok: true });
    });

    socket.on("game:typing", ({ roomCode, text } = {}) => {
      const game = games.get(roomCode?.toUpperCase());
      if (!game || game.status !== "playing") return;
      const current = game.players[game.turnIndex];
      if (!current || current.socketId !== socket.id) return;

      const preview = `${String(text || "").trim().toUpperCase().split("").join(" ")} _`.trim();
      socket.to(game.roomCode).emit("game:typing_preview", {
        playerId: playerKey(current),
        username: current.username,
        preview
      });
    });

    socket.on("game:submit_word", async ({ roomCode, word } = {}, callback) => {
      const game = games.get(roomCode?.toUpperCase());
      if (!game || game.status !== "playing") return callback?.({ ok: false, message: "Game tidak berjalan" });

      const current = game.players[game.turnIndex];
      if (!current || current.socketId !== socket.id) return callback?.({ ok: false, message: "Belum giliran kamu" });
      if (game.isValidating) return callback?.({ ok: false, message: "Kata sedang divalidasi" });

      const normalized = String(word || "").trim().toLowerCase();
      game.isValidating = true;
      game.validatingWord = normalized;
      emitGameState(io, game);

      try {
        if (!/^[a-z]([a-z-]*[a-z])?$/.test(normalized)) {
          await penalizeCurrentPlayer(io, game, "Kata hanya boleh mengandung huruf a-z dan tanda hubung");
          return callback?.({ ok: false, message: "Kata hanya boleh mengandung huruf a-z dan tanda hubung" });
        }

        if (game.wordsUsed.includes(normalized)) {
          await penalizeCurrentPlayer(io, game, "Kata sudah pernah digunakan");
          return callback?.({ ok: false, message: "Kata sudah pernah digunakan" });
        }

        const kbbiResult = await validateWord(normalized, game.currentLetter);
        if (!kbbiResult.isValid) {
          game.wordEvents.push({ word: normalized, userId: current.userId, isValid: false });
          await penalizeCurrentPlayer(io, game, kbbiResult.reason);
          return callback?.({ ok: false, message: kbbiResult.reason });
        }

        if (game.settings.categoryChallenge) {
          const categoryResult = await validateCategory(normalized, game.currentCategory);
          if (!categoryResult.isValid) {
            game.wordEvents.push({ word: normalized, userId: current.userId, isValid: false });
            await penalizeCurrentPlayer(io, game, categoryResult.reason);
            return callback?.({ ok: false, message: categoryResult.reason });
          }
        }

        game.wordEvents.push({ word: normalized, userId: current.userId, isValid: true });
        game.wordsUsed.push(normalized);
        game.currentLetter = normalized.at(-1);
        if (game.settings.categoryChallenge) game.currentCategory = randomCategory();
        game.secondsLeft = game.settings.timer;
        io.to(game.roomCode).emit("game:word_valid", {
          playerId: playerKey(current),
          username: current.username,
          word: normalized,
          nextLetter: game.currentLetter,
          nextCategory: game.currentCategory
        });

        await moveTurn(io, game);
        callback?.({ ok: true, state: statePayload(game) });
      } finally {
        game.isValidating = false;
        game.validatingWord = "";
        emitGameState(io, game);
      }
    });

    socket.on("disconnect", async () => {
      const lobbies = await Lobby.find({ "players.socketId": socket.id, status: "waiting" });
      await Promise.all(
        lobbies.map(async (lobby) => {
          const leaving = lobby.players.find((player) => player.socketId === socket.id);
          lobby.players = lobby.players.filter((player) => player.socketId !== socket.id);
          if (lobby.players.length === 0) {
            await Lobby.deleteOne({ roomCode: lobby.roomCode });
            return;
          }
          if (leaving?.isHost && lobby.players[0]) {
            lobby.players[0].isHost = true;
            lobby.players[0].ready = true;
          }
          await lobby.save();
          await emitLobby(io, lobby.roomCode);
        })
      );
    });
  });
};
