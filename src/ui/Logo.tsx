import {publicAsset} from '../assets/publicAsset';
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img className={`eco-logo${compact ? " compact" : ""}`} src={publicAsset('/assets/ui/figma/logo.svg')} alt="Eco City!" width="454" height="315" />
  );
}
