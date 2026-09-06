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
  return (
    <div
      className={`choice-list ${narrative ? "narrative-choices" : ""}`}
      aria-label={narrative ? "Respostas narrativas" : "Soluções disponíveis"}
    >
      {choices.map((choice, i) => (
        <button
          className={`choice ${narrative ? "" : "alternative"}`}
          key={choice.id}
          data-choice-id={choice.id}
          disabled={choice.disabled}
          onClick={() => onChoose(choice.id)}
        >
          <span className="choice-index">{String.fromCharCode(65 + i)}</span>
          <span className="choice-text">
            {choice.text}
            {choice.hint && <small>{choice.hint}</small>}
          </span>
          {choice.cost !== undefined ? (
            <span className="choice-cost">
              <i>✦</i> {choice.cost.toLocaleString("pt-BR")}
            </span>
          ) : (
            <span aria-hidden="true">↗</span>
          )}
        </button>
      ))}
    </div>
  );
}
