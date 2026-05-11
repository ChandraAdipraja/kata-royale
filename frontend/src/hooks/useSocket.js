import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext.jsx";

export const useSocket = () => {
  const socket = useSocketContext();

  useEffect(() => {
    if (!socket || socket.connected) return;
    socket.connect();
  }, [socket]);

  return socket;
};
