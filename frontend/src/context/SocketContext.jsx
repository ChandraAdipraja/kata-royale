import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, guestName, guestId } = useAuth();
  const socket = useMemo(() => io(API_URL, { autoConnect: false }), []);

  useEffect(() => {
    socket.auth = { token, guestName, guestId };
    if (socket.connected) socket.disconnect();
    socket.connect();
  }, [socket, token, guestName, guestId]);

  useEffect(() => () => socket.disconnect(), [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => useContext(SocketContext);
