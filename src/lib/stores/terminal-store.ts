import { create } from "zustand";

interface TerminalSession {
  id: string;
  name: string;
}

interface TerminalStore {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  isVisible: boolean;
  addSession: (session: TerminalSession) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  isVisible: false,
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    })),
  removeSession: (id) =>
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      const activeSessionId =
        state.activeSessionId === id
          ? sessions[sessions.length - 1]?.id ?? null
          : state.activeSessionId;
      return { sessions, activeSessionId };
    }),
  setActiveSession: (activeSessionId) => set({ activeSessionId }),
  setVisible: (isVisible) => set({ isVisible }),
  toggleVisible: () => set((state) => ({ isVisible: !state.isVisible })),
}));
