import MultiIndicatorPage from "./MultiIndicatorPage";

export default function TradePage() {
  return (
    <MultiIndicatorPage
      title="贸易投资"
      description="贸易投资指标反映进出口贸易状况和固定资产投资情况，是判断外需和内需投资需求的重要依据。"
      indicators={[
        { key: "export", name: "出口同比", desc: "出口总额同比增速（以美元计），反映外需变化趋势。" },
        { key: "fixed_asset_investment", name: "固投累计同比", desc: "固定资产投资累计同比增速，反映基础设施和制造业投资需求。" },
      ]}
    />
  );
}
