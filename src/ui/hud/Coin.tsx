import { publicAsset } from '../../assets/publicAsset';

export function Coin({ className='' }: { className?: string }) {
  return <span className={`coin ${className}`} aria-hidden="true"><img src={publicAsset('/assets/ui/figma/coin.webp')} alt=""/></span>;
}
