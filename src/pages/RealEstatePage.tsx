import MultiIndicatorPage from "./MultiIndicatorPage";

export default function RealEstatePage() {
  return (
    <MultiIndicatorPage
      title="房地产"
      description="房地产相关指标反映固定资产投资和资金面状况，是经济周期的重要观察窗口。"
      indicators={[
        { key: "fixed_asset_investment", name: "固投累计同比", desc: "固定资产投资累计同比，包含房地产开发投资，是房地产景气的重要参考。" },
        { key: "m2", name: "M2同比增速", desc: "广义货币增速与房地产价格走势高度相关，流动性宽松往往带动地产回暖。" },
      ]}
    />
  );
}
