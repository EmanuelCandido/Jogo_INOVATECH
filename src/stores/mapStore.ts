import { create } from "zustand";
export type MapCommand = "in" | "out" | "reset" | "left" | "right" | "up" | "down";
// View controls are transient: exploring never changes the saved story state.
export const useMap = create<{
  command: { type: MapCommand; sequence: number } | null;
  zoom: number; ready: boolean;
  send: (type: MapCommand) => void;
  report: (zoom: number, ready: boolean) => void;
}>((set) => ({
  command: null, zoom: 1, ready: false,
  send: type => set(s => ({command:{type,sequence:(s.command?.sequence??0)+1}})),
  report: (zoom,ready) => set({zoom,ready}),
}));
