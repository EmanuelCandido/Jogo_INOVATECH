import { problems, problemById } from "../content/problems";
import { questions } from "../content/questions";
import { spend } from "./economy";
import type { Progress } from "./types";
/** Coins spent on attempts that did not solve a problem and not yet returned. */
export function refundableAttempts(state: Progress) {
  const spent = state.decisions
    .filter((d) => d.effectiveness !== "COMPLETE")
    .reduce((sum, d) => sum + d.cost, 0);
  return Math.max(0, spent - (state.attemptRefunds ?? 0));
}
/**
 * A player who opens a situation without coins for its complete solution gets
 * back what they spent on earlier attempts, up to that price. The city never
 * creates coins this way, it only returns them, so it cannot be farmed.
 */
export function retryRefund(state: Progress, id: string) {
  const complete = questions[problemById[id].questionId].alternatives.find(
    (a) => a.effectiveness === "COMPLETE",
  )!;
  return Math.min(
    Math.max(0, complete.cost - state.coins),
    refundableAttempts(state),
  );
}
/**
 * Alternatives already tried for a situation without solving it. They stay
 * locked, so each new attempt is a different choice.
 */
export function triedAlternatives(state: Progress, id: string) {
  return new Set(
    state.decisions
      .filter((d) => d.problemId === id && d.effectiveness !== "COMPLETE")
      .map((d) => d.alternativeId),
  );
}
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
      !["FOCUSING", "COMMENT", "CONTEXT", "QUESTION", "RESULT"].includes(state.phase) ||
      !state.selectedProblem
    )
      return state;
    // A completed decision is kept when leaving its result screen.
    if (state.phase === "RESULT") return { ...state, phase: "RETURNING" };
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
    const refund = retryRefund(state, id);
    return {
      ...state,
      coins: state.coins + refund,
      attemptRefunds: (state.attemptRefunds ?? 0) + refund,
      retryHelp: refund || undefined,
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
    if (!answer || triedAlternatives(state, p.id).has(answer.id)) return state;
    const coins = spend(state.coins, answer.cost);
    const reward =
      answer.effectiveness === "COMPLETE" && !state.rewarded.includes(p.id);
    return {
      ...state,
      retryHelp: undefined,
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
