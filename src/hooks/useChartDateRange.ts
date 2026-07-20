import { useState, useMemo, useCallback } from 'react';

const MIN_YEAR = 2010;
const MAX_YEAR = 2026;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

/** 计算当前月份的上一个月 */
function getPrevMonth(): { year: number; month: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  let py = y, pm = m - 1;
  if (pm <= 0) { py--; pm = 12; }
  return { year: py, month: pm };
}

function computePresets(ey: number, em: number) {
  // 往前推 N-1 个月
  const sub = (ey: number, em: number, n: number) => {
    let y = ey, m = em - (n - 1);
    while (m <= 0) { y--; m += 12; }
    return { year: y, month: m };
  };
  const near1 = sub(ey, em, 12);
  const near3 = sub(ey, em, 36);
  const near5 = sub(ey, em, 60);
  const near10 = sub(ey, em, 120);
  return [
    { label: '近1年', sy: near1.year, sm: near1.month, ey, em },
    { label: '近3年', sy: near3.year, sm: near3.month, ey, em },
    { label: '近5年', sy: near5.year, sm: near5.month, ey, em },
    { label: '近10年', sy: near10.year, sm: near10.month, ey, em },
    { label: '全部', sy: 2010, sm: 1, ey, em },
  ];
}

export function useChartDateRange(
  defaultStartYear?: number,
  defaultStartMonth?: number,
  defaultEndYear?: number,
  defaultEndMonth?: number
) {
  const prev = useMemo(() => getPrevMonth(), []);

  const [startYear, setStartYear] = useState(defaultStartYear ?? 2025);
  const [startMonth, setStartMonth] = useState(defaultStartMonth ?? 1);
  const [endYear, setEndYear] = useState(defaultEndYear ?? prev.year);
  const [endMonth, setEndMonth] = useState(defaultEndMonth ?? prev.month);

  const startStr = useMemo(() => `${startYear}-${String(startMonth).padStart(2, '0')}`, [startYear, startMonth]);
  const endStr = useMemo(() => `${endYear}-${String(endMonth).padStart(2, '0')}`, [endYear, endMonth]);

  const presets = useMemo(() => computePresets(endYear, endMonth), [endYear, endMonth]);

  const applyPreset = useCallback((label: string) => {
    const p = presets.find(pr => pr.label === label);
    if (p) {
      setStartYear(p.sy);
      setStartMonth(p.sm);
      setEndYear(p.ey);
      setEndMonth(p.em);
    }
  }, [presets]);

  const isPresetActive = useCallback((label: string) => {
    const p = presets.find(pr => pr.label === label);
    return p ? startYear === p.sy && startMonth === p.sm && endYear === p.ey && endMonth === p.em : false;
  }, [startYear, startMonth, endYear, endMonth, presets]);

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
