import { story } from "../content/story";
import { ProblemManager } from "./ProblemManager";
import type { Progress } from "./types";
import { introNode, type DialogueEvent } from "../content/dialogues";
import {tutorialQuestion} from '../content/questions';
function applyDialogueEvent(
  s: Progress,
  event: DialogueEvent,
  next?: string,
): Progress {
  if (event === "SHOW_CITY") return { ...s, phase: "OVERVIEW" };
  if (event === "SHOW_TUTORIAL") return {...s,phase:'TUTORIAL_QUESTION'};
  if (event === "SHOW_QUESTION") return { ...s, phase: "QUESTION" };
  if (event === "RETURN_CITY") return { ...s, phase: "RETURNING" };
  return next
    ? {
        ...s,
        dialogueNodeId: next,
        introIndex: Math.min(s.introIndex + 1, story.intro.length - 1),
      }
    : s;
}
export const NarrativeManager = {
  choose(s: Progress, choiceId: string): Progress {
    if(s.phase==='TUTORIAL_QUESTION'){
      const answer=tutorialQuestion.alternatives.find(a=>a.id===choiceId);
      return answer?{...s,tutorialAnswerId:answer.id,phase:'TUTORIAL_RESULT'}:s;
    }
    if (s.phase !== "INTRO") return s;
    const choice = introNode(s).choices?.find((c) => c.id === choiceId);
    return choice ? applyDialogueEvent(s, choice.event, choice.next) : s;
  },
  next(s: Progress): Progress {
    switch (s.phase) {
      case 'TUTORIAL_RESULT':
        return tutorialQuestion.alternatives.find(a=>a.id===s.tutorialAnswerId)?.effectiveness==='COMPLETE'
          ?{...s,tutorialCompleted:true,phase:'OVERVIEW'}:{...s,tutorialAnswerId:undefined,phase:'TUTORIAL_QUESTION'};
      case "INTRO": {
        const node = introNode(s);
        return node.choices
          ? NarrativeManager.choose(s, node.choices[0].id)
          : applyDialogueEvent(s, node.event ?? "NEXT_LINE", node.next);
      }
      case 'COMMENT':
        return {...s,phase:'CONTEXT'};
      case "CONTEXT":
        return { ...s, phase: "QUESTION" };
      case "RESULT":
        return { ...s, phase: "RETURNING" };
      default:
        return s;
    }
  },
  cameraArrived(s: Progress): Progress {
    return s.phase === "FOCUSING"
      ? { ...s, phase: "COMMENT" }
      : s.phase === "RETURNING"
        ? ProblemManager.advance(s)
        : s;
  },
};
