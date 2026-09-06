import { useState } from "react";
import { useGame } from "../../stores/gameStore";
import { categories, problems } from "../../content/problems";
import {story} from '../../content/story';
export function QuestPanel({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, select, revisit } = useGame();
  const [open, setOpen] = useState(true);
  const available = problems.filter(
    (p) => !["HIDDEN", "LOCKED"].includes(s.problemStates[p.id]),
  );
  return (
    <aside className={`quest-panel ${open ? "open" : ""}`}>
      <button
        className="quest-header"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>◇</span> NOSSA JORNADA <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="quest-body">
          <small>CAPÍTULO 01 · {problems.filter(p=>s.problemStates[p.id]==='SOLVED').length} / 10 SOLUÇÕES COMPLETAS</small>
          <h2>Uma cidade para todos</h2>
          {available.map((p) => (
            <button
              className="quest-item"
              key={p.id}
              disabled={
                !sceneReady || s.phase !== "OVERVIEW" ||
                !["AVAILABLE", "TEMPORARILY_SOLVED"].includes(
                  s.problemStates[p.id],
                )
              }
              onClick={() =>
                s.problemStates[p.id] === "TEMPORARILY_SOLVED"
                  ? revisit(p.id)
                  : select(p.id)
              }
            >
              <span>
                {s.problemStates[p.id] === "SOLVED"
                  ? "✓"
                  : p.markerIcon}
              </span>
              <span>
                <b>{p.title}</b>
                <small>
                  {s.problemStates[p.id] === "SOLVED"
                    ? "Transformação permanente"
                    : s.problemStates[p.id] === "TEMPORARILY_SOLVED"
                      ? "Melhoria provisória · reavaliar"
                      : categories[p.category].label}
                </small>
              </span>
            </button>
          ))}
          <div className="quest-footer">
            {problems.every(p=>s.problemStates[p.id]==='SOLVED')?story.complete:s.tutorialCompleted?'Observe. Entenda. Escolha.':'Observe a cidade antes de decidir.'}
          </div>
        </div>
      )}
    </aside>
  );
}
