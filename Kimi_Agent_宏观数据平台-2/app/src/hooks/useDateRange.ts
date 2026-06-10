import { useState, useMemo, useCallback } from 'react';
import { ALL_MONTHS } from '../App';

// 默认范围：最近5年
const DEFAULT_START = '2021-01';
const DEFAULT_END = '2026-03';
const MIN_MONTH = '2010-01';
const MAX_MONTH = '2026-03';

export function useDateRange(initialStart = DEFAULT_START, initialEnd = DEFAULT_END) {
  const [startMonth, setStartMonth] = useState(initialStart);
  const [endMonth, setEndMonth] = useState(initialEnd);

  // 生成可选月份列表
  const monthOptions = useMemo(() => ALL_MONTHS, []);

  // 过滤函数：根据时间段筛选数据
  const filterByRange = useCallback(<T extends { month?: string; date?: string }>(
    data: T[]
  ): T[] => {
    return data.filter(d => {
      const key = d.month || d.date || '';
      return key >= startMonth && key <= endMonth;
    });
  }, [startMonth, endMonth]);

  // 过滤月份标签
  const filterMonths = useCallback((months: string[]): string[] => {
    return months.filter(m => m >= startMonth && m <= endMonth);
  }, [startMonth, endMonth]);

  // 获取数据索引范围（用于数组切片）
  const getIndexRange = useCallback((months: string[]): [number, number] => {
    let startIdx = months.findIndex(m => m >= startMonth);
    let endIdx = months.findIndex(m => m > endMonth) - 1;
    if (startIdx === -1) startIdx = 0;
    if (endIdx < startIdx) endIdx = months.length - 1;
    return [startIdx, endIdx + 1];
  }, [startMonth, endMonth]);

  // 快捷选项
  const presets = [
    { label: '近1年', start: '2025-04', end: MAX_MONTH },
    { label: '近3年', start: '2023-04', end: MAX_MONTH },
    { label: '近5年', start: '2021-04', end: MAX_MONTH },
    { label: '近10年', start: '2016-04', end: MAX_MONTH },
    { label: '全部', start: MIN_MONTH, end: MAX_MONTH },
  ];

  const applyPreset = useCallback((label: string) => {
    const p = presets.find(pr => pr.label === label);
    if (p) {
      setStartMonth(p.start);
      setEndMonth(p.end);
    }
  }, []);

  return {
    startMonth,
    endMonth,
    setStartMonth,
    setEndMonth,
    monthOptions,
    filterByRange,
    filterMonths,
    getIndexRange,
    presets,
    applyPreset,
    minMonth: MIN_MONTH,
    maxMonth: MAX_MONTH,
  };
}
