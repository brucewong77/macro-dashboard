import { useState, useMemo, useCallback } from 'react';

const MIN_YEAR = 2010;
const MAX_YEAR = 2026;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

export function useChartDateRange(defaultStartYear = 2025, defaultStartMonth = 5, defaultEndYear = 2026, defaultEndMonth = 4) {
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endYear, setEndYear] = useState(defaultEndYear);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);

  const startStr = useMemo(() => `${startYear}-${String(startMonth).padStart(2, '0')}`, [startYear, startMonth]);
  const endStr = useMemo(() => `${endYear}-${String(endMonth).padStart(2, '0')}`, [endYear, endMonth]);

  const presets = [
    { label: '近1年', sy: 2025, sm: 5, ey: 2026, em: 4 },
    { label: '近3年', sy: 2023, sm: 5, ey: 2026, em: 4 },
    { label: '近5年', sy: 2021, sm: 5, ey: 2026, em: 4 },
    { label: '近10年', sy: 2016, sm: 5, ey: 2026, em: 4 },
    { label: '全部', sy: 2010, sm: 1, ey: 2026, em: 4 },
  ];

  const applyPreset = useCallback((label: string) => {
    const p = presets.find(pr => pr.label === label);
    if (p) {
      setStartYear(p.sy);
      setStartMonth(p.sm);
      setEndYear(p.ey);
      setEndMonth(p.em);
    }
  }, []);

  const isPresetActive = useCallback((label: string) => {
    const p = presets.find(pr => pr.label === label);
    return p ? startYear === p.sy && startMonth === p.sm && endYear === p.ey && endMonth === p.em : false;
  }, [startYear, startMonth, endYear, endMonth]);

  const getRange = useCallback((monthsArr: string[]): [number, number] => {
    let s = monthsArr.findIndex(m => m >= startStr);
    let e = monthsArr.findIndex(m => m > endStr) - 1;
    if (s === -1) s = 0;
    if (e < s) e = monthsArr.length - 1;
    return [s, e + 1];
  }, [startStr, endStr]);

  // 从 "YYYY-MM" 字符串直接设置起始/结束
  const setStartStr = useCallback((v: string) => {
    const [y, m] = v.split('-').map(Number);
    if (y) setStartYear(y);
    if (m) setStartMonth(m);
  }, []);

  const setEndStr = useCallback((v: string) => {
    const [y, m] = v.split('-').map(Number);
    if (y) setEndYear(y);
    if (m) setEndMonth(m);
  }, []);

  return {
    startYear, startMonth, endYear, endMonth,
    setStartYear, setStartMonth, setEndYear, setEndMonth,
    setStartStr, setEndStr,
    startStr, endStr,
    years: YEARS, monthsList: MONTHS,
    presets, applyPreset, isPresetActive,
    getRange,
  };
}
