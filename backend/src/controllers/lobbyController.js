import Lobby from "../models/Lobby.js";

const serializeLobby = (lobby) => {
  const host = lobby.players.find((player) => player.isHost) || lobby.players[0];

  return {
    roomCode: lobby.roomCode,
    name: lobby.name,
    playerCount: lobby.players.length,
    maxPlayers: lobby.settings.maxPlayers,
    timer: lobby.settings.timer,
    hp: lobby.settings.hp,
    categoryChallenge: Boolean(lobby.settings.categoryChallenge),
    hostName: host?.username || "Host",
    updatedAt: lobby.updatedAt
  };
};

export const listPublicLobbies = async (_req, res) => {
  try {
    const lobbies = await Lobby.find({ status: "waiting", "settings.isPublic": true })
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({ lobbies: lobbies.map(serializeLobby) });
  } catch (_error) {
    res.status(500).json({ message: "Gagal memuat lobby" });
  }
};
