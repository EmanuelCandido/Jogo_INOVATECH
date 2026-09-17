import {publicAsset} from '../../assets/publicAsset';
import {useEffect, useRef, useState, type CSSProperties} from 'react';

// Let the reveal settle and absorb the second tap of a double tap, including
// when reduced motion is enabled. Animation events must not control input.
const choiceReadyDelay = 650;
export interface ChoiceView {
  id: string;
  text: string;
  cost?: number;
  disabled?: boolean;
  hint?: string;
}
export function ChoiceList({
  choices,
  onChoose,
  narrative = false,
}: {
  choices: ChoiceView[];
  onChoose: (id: string) => void;
  narrative?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const gesture = useRef<{id: string; pointerId: number; x: number; y: number} | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), choiceReadyDelay);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={`choice-list ${narrative ? "narrative-choices" : ""}`}
      aria-label={narrative ? "Respostas narrativas" : "Soluções disponíveis"}
    >
      {choices.map((choice, index) => (
        <button
          className={`choice ${narrative ? "" : "alternative"}`}
          key={choice.id}
          style={{'--choice-index': index} as CSSProperties}
          data-choice-id={choice.id}
          data-unavailable={choice.disabled || undefined}
          disabled={!ready || choice.disabled}
          onPointerDown={event => {
            gesture.current = ready && !choice.disabled && event.isPrimary && event.button === 0
              ? {id: choice.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY} : null;
          }}
          onPointerMove={event => {
            const start = gesture.current;
            if (start && (start.pointerId !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10)) gesture.current = null;
          }}
          onPointerCancel={() => { gesture.current = null; }}
          onKeyDown={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}
          onClick={event => {
            const start = gesture.current;
            gesture.current = null;
            // Pointer clicks require a fresh press on this enabled choice.
            // Keyboard and assistive activation have detail 0 and stay usable.
            if (!ready || choice.disabled || (event.detail !== 0 && (event.detail > 1 || start?.id !== choice.id))) {
              event.preventDefault();
              return;
            }
            onChoose(choice.id);
          }}
        >
          <span className="choice-text">
            {choice.text}
            {choice.hint && <small>{choice.hint}</small>}
          </span>
          {choice.cost !== undefined ? (
            <span className="choice-cost" aria-label={`${choice.cost} moedas`}>
              <span aria-hidden="true">{choice.cost > 0 ? '-' : ''}{choice.cost.toLocaleString("pt-BR")}</span>
              <span className="coin" aria-hidden="true"><img src={publicAsset('/assets/ui/figma/coin.webp')} alt="" /></span>
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
