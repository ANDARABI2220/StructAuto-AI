/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Global Unit Conversion Context (Metric SI <-> Imperial US Customary)
 * Provides seamless unit conversion across all panels, 3D viewer, and reports.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UnitSystemType = 'metric' | 'imperial';

export interface UnitContextValue {
  unitSystem: UnitSystemType;
  setUnitSystem: (system: UnitSystemType) => void;
  toggleUnitSystem: () => void;
  // Conversion helper functions
  convertLength: (meters: number) => { value: number; unit: string };
  convertDimensionMm: (mm: number) => { value: number; unit: string };
  convertForceKn: (kn: number) => { value: number; unit: string };
  convertMomentKnM: (knM: number) => { value: number; unit: string };
  convertStressMpa: (mpa: number) => { value: number; unit: string };
  convertVolumeM3: (m3: number) => { value: number; unit: string };
  convertWeightTon: (ton: number) => { value: number; unit: string };
  formatLength: (meters: number) => string;
  formatDimension: (mm: number) => string;
  formatForce: (kn: number) => string;
  formatMoment: (knM: number) => string;
  formatVolume: (m3: number) => string;
  formatWeight: (ton: number) => string;
}

const UnitContext = createContext<UnitContextValue | undefined>(undefined);

export const UnitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystemType>('metric');

  const toggleUnitSystem = () => {
    setUnitSystem((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const convertLength = (meters: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((meters * 3.28084).toFixed(2)), unit: 'ft' };
    }
    return { value: Number(meters.toFixed(2)), unit: 'm' };
  };

  const convertDimensionMm = (mm: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((mm / 25.4).toFixed(1)), unit: 'in' };
    }
    return { value: Number((mm / 10).toFixed(1)), unit: 'cm' }; // Default cm in structural display
  };

  const convertForceKn = (kn: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((kn * 0.224809).toFixed(1)), unit: 'kips' };
    }
    return { value: Number(kn.toFixed(1)), unit: 'kN' };
  };

  const convertMomentKnM = (knM: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((knM * 0.737562).toFixed(1)), unit: 'kip·ft' };
    }
    return { value: Number(knM.toFixed(1)), unit: 'kN·m' };
  };

  const convertStressMpa = (mpa: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((mpa * 0.145038).toFixed(2)), unit: 'ksi' };
    }
    return { value: Number(mpa.toFixed(1)), unit: 'MPa' };
  };

  const convertVolumeM3 = (m3: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((m3 * 1.30795).toFixed(1)), unit: 'yd³' };
    }
    return { value: Number(m3.toFixed(1)), unit: 'm³' };
  };

  const convertWeightTon = (ton: number) => {
    if (unitSystem === 'imperial') {
      return { value: Number((ton * 1.10231).toFixed(1)), unit: 'US Ton' };
    }
    return { value: Number(ton.toFixed(1)), unit: 'Ton' };
  };

  const formatLength = (meters: number) => {
    const { value, unit } = convertLength(meters);
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatDimension = (mm: number) => {
    const { value, unit } = convertDimensionMm(mm);
    return `${value} ${unit}`;
  };

  const formatForce = (kn: number) => {
    const { value, unit } = convertForceKn(kn);
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatMoment = (knM: number) => {
    const { value, unit } = convertMomentKnM(knM);
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatVolume = (m3: number) => {
    const { value, unit } = convertVolumeM3(m3);
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatWeight = (ton: number) => {
    const { value, unit } = convertWeightTon(ton);
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <UnitContext.Provider
      value={{
        unitSystem,
        setUnitSystem,
        toggleUnitSystem,
        convertLength,
        convertDimensionMm,
        convertForceKn,
        convertMomentKnM,
        convertStressMpa,
        convertVolumeM3,
        convertWeightTon,
        formatLength,
        formatDimension,
        formatForce,
        formatMoment,
        formatVolume,
        formatWeight,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
};

export const useUnits = (): UnitContextValue => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};
