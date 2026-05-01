import { useSocketContext } from "../context/SocketContext.jsx";

export const useSocket = () => {
  return useSocketContext();
};
