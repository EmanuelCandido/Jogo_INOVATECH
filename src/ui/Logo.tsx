export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`eco-logo${compact ? " compact" : ""}`} aria-label="Eco City!" role="img">
      <span aria-hidden="true">ECO</span>
      <span aria-hidden="true">CITY!</span>
    </span>
  );
}
