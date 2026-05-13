/**
 * 数据 API 层
 * 优先从远程加载最新数据，失败时自动回退到本地内置数据
 */

import fallbackData from "../../public/data/macro_data.json";

const DATA_URL = "/data/macro_data.json";

export interface IndicatorData {
  value: number | null;
  prev: number | null;
  change: number | null;
  change_pct: number | null;
  date: string | null;
  name: string;
  unit: string;
  history: Array<{ date: string; value: number | null }>;
}

export interface CalendarItem {
  name: string;
  expected_day: number;
  status: string;
}

export interface MacroData {
  update_time: string;
  indicators: Record<string, IndicatorData>;
  calendar: CalendarItem[];
}

/**
 * 加载宏观经济数据
 * 1. 尝试从远程获取（加时间戳防止缓存）
 * 2. 失败后回退到本地 JSON
 */
export async function loadMacroData(): Promise<MacroData> {
  const ts = Date.now();
  const url = `${DATA_URL}?t=${ts}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超时

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MacroData = await response.json();
    console.log("[MacroData] 远程数据加载成功", data.update_time);
    return data;
  } catch (err) {
    console.warn("[MacroData] 远程数据加载失败，使用本地回退数据", err);
    // 使用 vite 的 ?raw 或直接 import json
    return fallbackData as unknown as MacroData;
  }
}

/**
 * 格式化数值显示
 */
export function formatValue(
  value: number | null,
  unit: string = "",
  digits: number = 1
): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(digits)}${unit}`;
}

/**
 * 格式化环比变化（带箭头和颜色标记）
 */
export function formatChange(
  change: number | null,
  changePct: number | null,
  reverse: boolean = false
): { text: string; type: "up" | "down" | "neutral" } {
  if (change === null) {
    return { text: "—", type: "neutral" };
  }

  const sign = change > 0 ? "+" : "";
  const pctStr = changePct !== null ? `(${sign}${changePct}%)` : "";
  const text = `${sign}${change.toFixed(2)}${pctStr}`;

  // 有些指标（如失业率、PMI<50）越高越不好，可通过 reverse 参数控制
  const isGood = reverse ? change < 0 : change > 0;
  return {
    text,
    type: isGood ? "up" : "down",
  };
}
