import { create } from 'zustand'

type AppState = {
  heading: string
  setHeading: (heading: string) => void
}

const useApp = create<AppState>((set) => ({
  heading: "",
  setHeading: (heading: string) => set({ heading }),
}))

export default useApp;