import { useState } from "react";
import { useGame } from "../stores/gameStore";
import { story } from "../content/story";
import { DialogueStage } from "./dialogue/DialogueStage";
import { QuestPanel } from "./hud/QuestPanel";
import { SettingsPanel } from "./menus/SettingsPanel";
import { MapControls } from "./hud/MapControls";
import {PerformanceReadout} from './hud/PerformanceReadout';
export function GameUI({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, notice } = useGame();
  const [menu, setMenu] = useState(false);
  return (
    <div className="interface">
      <header className="topbar">
        <a className="brand" href="./" aria-label="EcoQuest início">
          <span className="brand-icon">❧</span>
          <span>
            EcoQuest<small>HISTÓRIAS QUE TRANSFORMAM</small>
          </span>
        </a>
        <div className="chapter-badge">
          <span>01</span>
          <div>
            VILA ESPERANÇA<small>O começo da mudança</small>
          </div>
        </div>
        <div className="header-actions">
          <div className="balance" aria-label={s.coins + " Moedas da Cidade"}>
            <span className="coin">✦</span>
            <div>
              <b>{s.coins.toLocaleString("pt-BR")}</b>
              <small>MOEDAS DA CIDADE</small>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={() => setMenu(!menu)}
            aria-label="Configurações"
            aria-expanded={menu}
          >
            ☰
          </button>
        </div>
      </header>
      {menu ? (
        <SettingsPanel close={() => setMenu(false)} />
      ) : (
        <>
          <QuestPanel sceneReady={sceneReady} />
          {s.phase === "OVERVIEW" && (
            <>
              <MapControls />
              <section className="map-title">
                <div className="eyebrow">UM NOVO CAPÍTULO</div>
                <h1>
                  O futuro começa
                  <br />
                  com um novo olhar.
                </h1>
                <p>{story.chapter.subtitle}</p>
              </section>
              <div className="map-instruction">
                <span>♧</span>
                <div>
                  <b>
                    {s.tutorialCompleted
                      ? "A cidade guarda novas histórias."
                      : "Um lugar precisa de você."}
                  </b>
                  <p>
                    {s.tutorialCompleted
                      ? story.overview
                      : story.tutorial.marker}
                  </p>
                </div>
              </div>
              <div className="map-compass" aria-hidden="true">
                <span>N</span>✧<small>VILA ESPERANÇA</small>
              </div>
            </>
          )}
          <DialogueStage sceneReady={sceneReady} />
          {["FOCUSING", "RETURNING"].includes(s.phase) && (
            <div className="camera-status" role="status">
              {s.phase === "FOCUSING"
                ? "Vamos olhar mais de perto…"
                : "Voltando à cidade…"}
            </div>
          )}
        </>
      )}
      {notice && (
        <div className="notice" role="alert">
          {notice}
        </div>
      )}
      <footer className="footer">
        <span>CADA ESCOLHA DEIXA UMA MARCA.</span>
        <span>{notice ? "○ Verifique o aviso" : "✓ Progresso automático"}</span>
      </footer>
      <PerformanceReadout/>
    </div>
  );
}
