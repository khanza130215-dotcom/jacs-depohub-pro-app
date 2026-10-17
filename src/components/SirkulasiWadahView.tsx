import React from 'react';
import { SirkulasiGalonView, ContainerFilterType } from './SirkulasiGalonView';
import { GallonStock } from '../types';

export interface SirkulasiWadahViewProps {
  gallonCirculation: GallonStock[];
  onUpdateGallonCirculation?: (updated: GallonStock[]) => void;
}

export const SirkulasiWadahView: React.FC<SirkulasiWadahViewProps> = (props) => {
  return <SirkulasiGalonView {...props} />;
};

export { SirkulasiGalonView };
export type { ContainerFilterType };
export default SirkulasiWadahView;
