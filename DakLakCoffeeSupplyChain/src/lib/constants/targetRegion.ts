export const TARGET_REGIONS = [
  "Buôn Ma Thuột",
  "Buôn Hồ", 
  "Ea H'leo",
  "Ea Súp",
  "Krông Ana",
  "Krông Bông",
  "Krông Búk",
  "Krông Năng",
  "Krông Pắk",
  "Krông Pơ",
  "Lắk",
  "M'Đrắk",
  "Cư Kuin",
  "Cư M'gar",
  "Ea Kar"
] as const;

export type TargetRegion = typeof TARGET_REGIONS[number];

export const getTargetRegionLabel = (region: TargetRegion): string => {
  return region;
};

export const getTargetRegionOptions = () => {
  return TARGET_REGIONS.map(region => ({
    value: region,
    label: region
  }));
};
