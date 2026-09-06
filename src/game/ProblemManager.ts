import { problems, problemById } from "../content/problems";
import { questions } from "../content/questions";
import { spend } from "./economy";
import type { Progress } from "./types";
export const ProblemManager = {
  revisit(state: Progress, id: string): Progress {
    if (
      state.phase !== "OVERVIEW" ||
      state.problemStates[id] !== "TEMPORARILY_SOLVED"
    )
      return state;
    return ProblemManager.select(
      {
        ...state,
        problemStates: { ...state.problemStates, [id]: "AVAILABLE" },
      },
      id,
    );
  },
  leave(state: Progress): Progress {
    if (
      !["COMMENT", "CONTEXT", "QUESTION"].includes(state.phase) ||
      !state.selectedProblem
    )
      return state;
    return {
      ...state,
      problemStates: {
        ...state.problemStates,
        [state.selectedProblem]: "AVAILABLE",
      },
      phase: "RETURNING",
    };
  },
  select(state: Progress, id: string): Progress {
    if (state.phase !== "OVERVIEW" || !state.tutorialCompleted || state.problemStates[id] !== "AVAILABLE")
      return state;
    return {
      ...state,
      selectedProblem: id,
      problemStates: { ...state.problemStates, [id]: "ACTIVE" },
      phase: "FOCUSING",
    };
  },
  decide(state: Progress, alternativeId: string): Progress {
    if (state.phase !== "QUESTION" || !state.selectedProblem) return state;
    const p = problemById[state.selectedProblem];
    const answer = questions[p.questionId].alternatives.find(
      (a) => a.id === alternativeId,
    );
    if (!answer) return state;
    const coins = spend(state.coins, answer.cost);
    const reward =
      answer.effectiveness === "COMPLETE" && !state.rewarded.includes(p.id);
    return {
      ...state,
      coins: coins + (reward ? p.rewards : 0),
      rewarded: reward ? [...state.rewarded, p.id] : state.rewarded,
      problemStates: { ...state.problemStates, [p.id]: answer.resultState },
      decisions: [
        ...state.decisions,
        {
          problemId: p.id,
          alternativeId,
          effectiveness: answer.effectiveness,
          cost: answer.cost,
          turn: state.decisions.length + 1,
        },
      ],
      phase: "RESULT",
    };
  },
  advance(state: Progress): Progress {
    const states = { ...state.problemStates };
    for (const p of problems) {
      const latest = state.decisions.findLast((d) => d.problemId === p.id);
      if (
        states[p.id] === "TEMPORARILY_SOLVED" &&
        latest &&
        state.decisions.length > latest.turn
      )
        states[p.id] = "AVAILABLE";
      const explicitlyRevealed = new Set(state.decisions.map(d=>d.problemId)).size >= p.unlockAfter;
      if (
        (states[p.id] === "HIDDEN" || states[p.id] === "LOCKED") &&
        explicitlyRevealed
      ) {
        states[p.id] = p.unlockConditions.every((id) =>
          state.decisions.some((d) => d.problemId === id),
        )
          ? "AVAILABLE"
          : "LOCKED";
      }
    }
    return {
      ...state,
      problemStates: states,
      selectedProblem: null,
      tutorialCompleted: state.tutorialCompleted,
      phase: "OVERVIEW",
    };
  },
};
