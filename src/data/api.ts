/**
 * 宏观经济数据API层
 *
 * 支持两种数据源：
 * 1. 实时API模式：从远程JSON文件或API获取最新数据
 * 2. 本地模式：使用内置的模拟数据（fallback）
 *
 * 在GitHub Actions自动更新后，public/data/macro_data.json 会被最新数据覆盖
 */

import {
  ppiData as mockPpi,
  cpiData as mockCpi,
  pmiData as mockPmi,
  industrialData as mockIndustrial,
  electricityData as mockElectricity,
  fxReserveData as mockFx,
  exportData as mockExport,
  importData as mockImport,
  retailData as mockRetail,
  incomeData as mockIncome,
  unemploymentData as mockUnemployment,
  faiData as mockFai,
  realestateData as mockRealEstate,
  socialFinancingData as mockSocialFinancing,
  creditData as mockCredit,
  rateData as mockRate,
  moneyData as mockMoney,
  depositData as mockDeposit,
  months as defaultMonths,
} from './economicData';

// 数据缓存
let cachedData: MacroData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

export interface MacroData {
  fetchTime: string;
  dataSource: string;
  cpi?: { months: string[]; yoy: number[]; mom: number[]; lastUpdate: string | null; analysis?: string };
  ppi?: { months: string[]; yoy: number[]; mom: number[]; lastUpdate: string | null; analysis?: string };
  pmi?: { months: string[]; pmi: number[]; lastUpdate: string | null; analysis?: string };
  fxReserve?: { months: string[]; amount: number[]; lastUpdate: string | null; analysis?: string };
  moneySupply?: { months: string[]; m0: number[]; m1: number[]; m2: number[]; lastUpdate: string | null; analysis?: string };
  gdp?: { quarters: string[]; values: number[]; yoy: number[]; lastUpdate: string | null; analysis?: string };
  industrial?: { months: string[]; yoy: number[]; lastUpdate: string | null; analysis?: string };
  retail?: { months: string[]; yoy: number[]; lastUpdate: string | null; analysis?: string };
  unemployment?: { months: string[]; rate: number[]; lastUpdate: string | null; analysis?: string };
  lpr?: { dates: string[]; lpr1y: number[]; lpr5y: number[]; lastUpdate: string | null; analysis?: string };
}

/**
 * 获取宏观经济数据
 * 优先从远程JSON加载，失败则使用本地模拟数据
 */
export async function fetchMacroData(): Promise<MacroData | null> {
  // 检查缓存
  if (cachedData && Date.now() - lastFetchTime < CACHE_TTL) {
    return cachedData;
  }

  try {
    // 尝试从 public/data/macro_data.json 加载
    const response = await fetch('/data/macro_data.json?v=' + Date.now());
    if (response.ok) {
      const data = (await response.json()) as MacroData;
      cachedData = data;
      lastFetchTime = Date.now();
      console.log('[MacroAPI] 已加载远程数据:', data.fetchTime);
      return data;
    }
  } catch (e) {
    console.warn('[MacroAPI] 远程数据加载失败，使用本地数据:', e);
  }

  // 返回null，让调用方使用mock数据
  return null;
}

/**
 * 获取CPI数据（自动merge远程+本地）
 */
export async function getCpiData() {
  const remote = await fetchMacroData();
  if (!remote) return mockCpi;
  const cpi = remote.cpi;
  if (cpi && cpi.months.length > 0) {
    return {
      ...mockCpi,
      yoy: cpi.months.map((m: string, i: number) => ({ month: m, value: cpi.yoy[i] ?? 0 })),
      mom: cpi.months.map((m: string, i: number) => ({ month: m, value: cpi.mom[i] ?? 0 })),
      remoteAnalysis: cpi.analysis,
    };
  }
  return mockCpi;
}

/**
 * 获取PPI数据
 */
export async function getPpiData() {
  const remote = await fetchMacroData();
  if (!remote) return mockPpi;
  const ppi = remote.ppi;
  if (ppi && ppi.months.length > 0) {
    return {
      ...mockPpi,
      yoy: ppi.months.map((m: string, i: number) => ({ month: m, value: ppi.yoy[i] ?? 0 })),
      mom: ppi.months.map((m: string, i: number) => ({ month: m, value: ppi.mom[i] ?? 0 })),
      remoteAnalysis: ppi.analysis,
    };
  }
  return mockPpi;
}

/**
 * 获取PMI数据
 */
export async function getPmiData() {
  const remote = await fetchMacroData();
  if (!remote) return mockPmi;
  const pmi = remote.pmi;
  if (pmi && pmi.months.length > 0) {
    const updatedManufacturing = { ...mockPmi.manufacturing };
    const pmiValues = pmi.pmi;
    const pmiMonths = pmi.months;

    const byYear: Record<string, (number | null)[]> = {};
    pmiMonths.forEach((m: string, i: number) => {
      const year = m.split('-')[0];
      if (!byYear[year]) byYear[year] = new Array(12).fill(0);
      const monthIdx = parseInt(m.split('-')[1]) - 1;
      byYear[year][monthIdx] = pmiValues[i];
    });

    Object.keys(byYear).forEach(year => {
      const arr = byYear[year];
      while (arr.length < 34) arr.push(0);
      updatedManufacturing[year as keyof typeof updatedManufacturing] = arr as any;
    });

    return {
      ...mockPmi,
      manufacturing: updatedManufacturing,
      remoteAnalysis: pmi.analysis,
    };
  }
  return mockPmi;
}

/**
 * 获取GDP数据
 */
export async function getGdpData() {
  const remote = await fetchMacroData();
  if (!remote) return null;
  if (remote.gdp && remote.gdp.quarters.length > 0) {
    return {
      quarters: remote.gdp.quarters,
      values: remote.gdp.values,
      yoy: remote.gdp.yoy,
    };
  }
  return null;
}

/**
 * 获取工业增加值数据
 */
export async function getIndustrialData() {
  const remote = await fetchMacroData();
  if (!remote) return mockIndustrial;
  const ind = remote.industrial;
  if (ind && ind.months.length > 0) {
    return {
      ...mockIndustrial,
      yoy: ind.months.map((m: string, i: number) => ({ month: m, value: ind.yoy[i] ?? 0 })),
    };
  }
  return mockIndustrial;
}

/**
 * 获取社零数据
 */
export async function getRetailData() {
  const remote = await fetchMacroData();
  if (!remote) return mockRetail;
  const r = remote.retail;
  if (r && r.months.length > 0) {
    return {
      ...mockRetail,
      yoy: r.months.map((m: string, i: number) => ({ month: m, value: r.yoy[i] ?? 0 })),
    };
  }
  return mockRetail;
}

/**
 * 获取失业率数据
 */
export async function getUnemploymentData() {
  const remote = await fetchMacroData();
  if (!remote) return mockUnemployment;
  const u = remote.unemployment;
  if (u && u.months.length > 0) {
    return {
      ...mockUnemployment,
      national: u.months.map((m: string, i: number) => ({ month: m, value: u.rate[i] ?? 0 })),
    };
  }
  return mockUnemployment;
}

/**
 * 获取外汇储备数据
 */
export async function getFxReserveData() {
  const remote = await fetchMacroData();
  if (!remote) return mockFx;
  const fx = remote.fxReserve;
  if (fx && fx.months.length > 0) {
    return {
      ...mockFx,
      amount: fx.months.map((m: string, i: number) => ({ month: m, value: fx.amount[i] ?? 0 })),
    };
  }
  return mockFx;
}

/**
 * 获取货币供应量数据
 */
export async function getMoneySupplyData() {
  const remote = await fetchMacroData();
  if (!remote) return mockMoney;
  const m = remote.moneySupply;
  if (m && m.months.length > 0) {
    return {
      ...mockMoney,
      m0: m.months.map((month: string, i: number) => ({ month, value: m.m0[i] ?? 0 })),
      m1: m.months.map((month: string, i: number) => ({ month, value: m.m1[i] ?? 0 })),
      m2: m.months.map((month: string, i: number) => ({ month, value: m.m2[i] ?? 0 })),
    };
  }
  return mockMoney;
}

/**
 * 获取LPR数据
 */
export async function getLprData() {
  const remote = await fetchMacroData();
  if (!remote) return null;
  if (remote.lpr && remote.lpr.dates.length > 0) {
    return remote.lpr;
  }
  return null;
}

// ===== 以下数据暂无公开免费API，使用本地模拟数据 =====

export function getExportData() { return mockExport; }
export function getImportData() { return mockImport; }
export function getIncomeData() { return mockIncome; }
export function getFaiData() { return mockFai; }
export function getRealEstateData() { return mockRealEstate; }
export function getSocialFinancingData() { return mockSocialFinancing; }
export function getCreditData() { return mockCredit; }
export function getRateData() { return mockRate; }
export function getDepositData() { return mockDeposit; }
export function getElectricityData() { return mockElectricity; }
export function getNonMfgPmiData() { return mockPmi.nonManufacturing; }
export function getCaixinPmiData() { return mockPmi.caixin; }
export function getPmiHeatmapItems() { return mockPpi.heatmapItems; }
export function getPmiHeatmapData() { return mockPpi.heatmapData; }

export { defaultMonths as months };
