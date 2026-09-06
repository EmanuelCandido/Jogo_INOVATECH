import { problems, problemById } from "../content/problems";
import { questions,tutorialQuestion } from "../content/questions";
import { story } from "../content/story";
import type { Progress } from "./types";
import {defaultGraphicsSettings,normalizeGraphicsSettings,qualityOptions} from '../config/graphics';
import {
  dialogueEntry,
  dialogueNodes,
  legacyIntroNodes,
} from "../content/dialogues";
export interface SaveAdapter {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}
export const SAVE_KEY = "ecoquest.save.v1";
export const browserSave: SaveAdapter = {
  read: () => localStorage.getItem(SAVE_KEY),
  write: (v) => localStorage.setItem(SAVE_KEY, v),
  clear: () => localStorage.removeItem(SAVE_KEY),
};
export function initialProgress(): Progress {
  return {
    contentVersion:2,
    dialogueNodeId: dialogueEntry,
    coins: story.chapter.initialCoins,
    currentChapter: story.chapter.id,
    problemStates: Object.fromEntries(
      problems.map((p) => [p.id, p.initialState]),
    ),
    decisions: [],
    tutorialCompleted: false,
    settings: {
      ...defaultGraphicsSettings,
      quality: "AUTO",
      reducedMotion:
        typeof matchMedia !== "undefined" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    selectedProblem: null,
    phase: "INTRO",
    introIndex: 0,
    rewarded: [],
  };
}
export function decodeSave(raw: string): Progress {
  const parsed = JSON.parse(raw);
  const s = parsed.data as Progress;
  if (
    parsed.version !== 1 ||
    !s ||
    s.contentVersion!==2 ||
    !Number.isSafeInteger(s.coins) ||
    s.coins < 0 ||
    s.currentChapter !== story.chapter.id ||
    typeof s.tutorialCompleted !== "boolean" ||
    !Number.isInteger(s.introIndex) ||
    s.introIndex < 0 ||
    s.introIndex >= story.intro.length
  )
    throw new Error("Save incompatível");
  const states = [
    "HIDDEN",
    "LOCKED",
    "AVAILABLE",
    "ACTIVE",
    "TEMPORARILY_SOLVED",
    "SOLVED",
  ];
  if (
    !s.problemStates ||
    problems.some((p) => !states.includes(s.problemStates[p.id])) ||
    ![
      "INTRO",
      "TUTORIAL_QUESTION",
      "TUTORIAL_RESULT",
      "OVERVIEW",
      "FOCUSING",
      "CONTEXT",
      "COMMENT",
      "QUESTION",
      "RESULT",
      "RETURNING",
    ].includes(s.phase)
  )
    throw new Error("Estado inválido");
  if (
    !s.settings ||
    !qualityOptions.includes(s.settings.quality) ||
    typeof s.settings.reducedMotion !== "boolean" ||
    !Array.isArray(s.rewarded) ||
    s.rewarded.some((id) => !problemById[id]) ||
    !Array.isArray(s.decisions)
  )
    throw new Error("Configuração inválida");
  if (
    s.decisions.some((d, i) => {
      const p = problemById[d.problemId];
      const a =
        p &&
        questions[p.questionId].alternatives.find(
          (a) => a.id === d.alternativeId,
        );
      return (
        !a ||
        a.cost !== d.cost ||
        a.effectiveness !== d.effectiveness ||
        d.turn !== i + 1
      );
    })
  )
    throw new Error("Decisão inválida");
  const focused = [
    "FOCUSING",
    "CONTEXT",
    "COMMENT",
    "QUESTION",
    "RESULT",
    "RETURNING",
  ].includes(s.phase);
  if (focused && (!s.selectedProblem || !problemById[s.selectedProblem]))
    throw new Error("Seleção inválida");
  if (
    ["FOCUSING", "COMMENT", "CONTEXT", "QUESTION"].includes(s.phase) &&
    s.problemStates[s.selectedProblem!] !== "ACTIVE"
  )
    throw new Error("Problema inativo");
  if (
    s.phase === "RESULT" &&
    s.decisions.at(-1)?.problemId !== s.selectedProblem
  )
    throw new Error("Resultado ausente");
  if (
    !focused &&
    (s.selectedProblem !== null ||
      Object.values(s.problemStates).includes("ACTIVE"))
  )
    throw new Error("Seleção inconsistente");
  if (s.dialogueNodeId !== undefined && !dialogueNodes[s.dialogueNodeId])
    throw new Error("Diálogo inválido");
  if(s.tutorialAnswerId!==undefined&&!tutorialQuestion.alternatives.some(a=>a.id===s.tutorialAnswerId))throw new Error('Resposta tutorial inválida');
  if(s.phase==='TUTORIAL_RESULT'&&!s.tutorialAnswerId)throw new Error('Resultado tutorial ausente');
  return {
    ...s,
    settings:normalizeGraphicsSettings(s.settings),
    dialogueNodeId: s.dialogueNodeId ?? legacyIntroNodes[s.introIndex],
  };
}
export function loadProgress(adapter: SaveAdapter): {
  data: Progress;
  warning: string | null;
} {
  try {
    const raw = adapter.read();
    return { data: raw ? decodeSave(raw) : initialProgress(), warning: null };
  } catch {
    return {
      data: initialProgress(),
      warning:
        "Não foi possível recuperar o progresso salvo. Uma nova partida foi iniciada.",
    };
  }
}
export function saveProgress(adapter: SaveAdapter, data: Progress) {
  adapter.write(JSON.stringify({ version: 1, data }));
}
