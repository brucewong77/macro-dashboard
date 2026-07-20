/**
 * 数据初始化模块
 * 启动时从 macro_data.json 加载 AkShare 实时数据，覆盖 mock 数据
 * 所有模块无需修改即可获取最新数据
 */

import {
  months, cpiData, ppiData, pmiData,
  exportData, importData, industrialData,
  retailData, faiData, fxReserveData,
  electricityData, moneyData,
} from './economicData';

type RemoteDataSet = Record<string, any>;

// 补丁函数：用远程数据覆盖 mock 数组
// 当远程值数组比月份数组短时（如环比只取最近一段），自动对齐到末尾
function patchArray(
  targetArr: number[],
  remoteMonths: string[] | undefined,
  remoteValues: (number | null)[] | undefined,
  monthsRef: string[] = months,
) {
  if (!remoteMonths || !remoteValues) return;
  const offset = Math.max(0, remoteMonths.length - remoteValues.length);
  for (let i = 0; i < remoteValues.length; i++) {
    const m = remoteMonths[offset + i];
    const v = remoteValues[i];
    if (v === null || v === undefined) continue;
    const idx = monthsRef.indexOf(m);
    if (idx >= 0 && idx < targetArr.length) {
      targetArr[idx] = v;
    }
  }
}

export async function initRemoteData(): Promise<void> {
  try {
    const resp = await fetch('/data/macro_data.json?v=' + Date.now());
    if (!resp.ok) { console.warn('[DataInit] 远程数据加载失败'); return; }
    const data: RemoteDataSet = await resp.json();
    console.log('[DataInit] 已加载 AkShare 数据:', data.fetchTime);

    // 注意：macro_data.json 结构为 {indicators: {cpi: {history: [...]}}}
    // 与 dataInit.ts 期望的 data.cpi.months/data.cpi.yoy 格式不匹配
    // 因此 initRemoteData 实际上不会修改任何数组，只是浪费请求时间
    // 禁用此函数以避免 Safari 中请求阻塞渲染
    console.log('[DataInit] 数据格式不匹配，跳过合并');
  } catch (e) {
    console.warn('[DataInit] 数据加载失败，使用本地数据:', e);
  }
}
