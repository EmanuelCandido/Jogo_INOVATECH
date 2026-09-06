export type Vec3 = [number, number, number];
export type Category =
  "ACCESSIBILITY" | "POLLUTION" | "SECURITY" | "NATURE" | "HEALTH";
export type ProblemState =
  | "HIDDEN"
  | "LOCKED"
  | "AVAILABLE"
  | "ACTIVE"
  | "TEMPORARILY_SOLVED"
  | "SOLVED";
export type Effectiveness = "COMPLETE" | "TEMPORARY" | "NONE";
export type CharacterPose = "character_intro" | "character_thinking" | "character_alert" | "character_success" | "character_failure";
export type Phase =
  | "INTRO"
  | "TUTORIAL_QUESTION"
  | "TUTORIAL_RESULT"
  | "OVERVIEW"
  | "FOCUSING"
  | "CONTEXT"
  | "COMMENT"
  | "QUESTION"
  | "RESULT"
  | "RETURNING";
export type GraphicsTier = "MINIMUM" | "LOW" | "MEDIUM" | "HIGH" | "ULTRA";
export type Quality = "AUTO" | GraphicsTier;
export interface GameSettings {
  quality: Quality;
  reducedMotion: boolean;
  renderScale: number;
  shadows: "PRESET" | "OFF" | "SOFT" | "DETAILED";
  ambientAnimation: boolean;
  showPerformance: boolean;
}
export interface CameraShot {
  position: Vec3;
  target: Vec3;
  zoom: number;
  duration: number;
}
export interface Alternative {
  id: string;
  text: string;
  cost: number;
  effectiveness: Effectiveness;
  explanation: string;
  consequence: string;
  resultState: ProblemState;
}
export interface Question {
  id: string;
  text: string;
  alternatives: [Alternative, Alternative, Alternative];
}
export interface Placement {
  asset: string;
  position: Vec3;
  scale?: Vec3;
  rotation?: Vec3;
}
export interface Problem {
  id: string;
  category: Category;
  regionId: string;
  regionName: string;
  characterId: string;
  title: string;
  description: string;
  comment: string;
  markerIcon: string;
  characterPose: CharacterPose;
  unlockAfter: number;
  questionId: string;
  initialState: ProblemState;
  worldPosition: Vec3;
  markerPosition: Vec3;
  camera: CameraShot;
  visualStates: {
    initialAssets: Placement[];
    temporaryAssets: Placement[];
    solvedAssets: Placement[];
  };
  unlockConditions: string[];
  nextProblems: string[];
  rewards: number;
}
export interface Decision {
  problemId: string;
  alternativeId: string;
  effectiveness: Effectiveness;
  cost: number;
  turn: number;
}
export interface Progress {
  contentVersion: 2;
  tutorialAnswerId?: string;
  dialogueNodeId?: string;
  coins: number;
  currentChapter: string;
  problemStates: Record<string, ProblemState>;
  decisions: Decision[];
  tutorialCompleted: boolean;
  settings: GameSettings;
  selectedProblem: string | null;
  phase: Phase;
  introIndex: number;
  rewarded: string[];
}
