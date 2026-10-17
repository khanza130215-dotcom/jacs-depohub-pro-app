import React from 'react';
import { MasterDataModule, MasterDataModuleProps } from './master/MasterDataModule';

export const MasterDataView: React.FC<MasterDataModuleProps> = (props) => {
  return <MasterDataModule {...props} />;
};

export default MasterDataView;
