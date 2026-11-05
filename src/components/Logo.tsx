import { SvgXml } from 'react-native-svg';

import { claimXml, signetXml, starXml, wordmarkXml } from '@/theme/logos';

const RATIO = { wordmark: 198.43 / 51.02, star: 130.39 / 96.38, claim: 121.89 / 102.05, signet: 48.19 / 51.02 };
const XML = { wordmark: wordmarkXml, star: starXml, claim: claimXml, signet: signetXml };

type Kind = keyof typeof XML;

/** White Tecspace logos only (as requested). Size by width. */
export function Logo({ kind = 'wordmark', width = 140 }: { kind?: Kind; width?: number }) {
  return (
    <SvgXml
      xml={XML[kind]}
      width={width}
      height={width / RATIO[kind]}
      accessibilityLabel="Tecspaze Logo"
      accessibilityRole="image"
    />
  );
}
