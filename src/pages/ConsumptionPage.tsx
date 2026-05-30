import MultiIndicatorPage from "./MultiIndicatorPage";

export default function ConsumptionPage() {
  return (
    <MultiIndicatorPage
      title="消费就业"
      description="消费就业指标反映居民消费状况和就业市场变化，是判断内需和民生状况的重要依据。"
      indicators={[
        { key: "retail_sales", name: "社零同比", desc: "社会消费品零售总额同比增速，直接衡量居民消费活跃程度。" },
        { key: "unemployment", name: "城镇调查失业率", desc: "城镇调查失业率，反映就业市场供需状况，与居民收入和消费密切相关。" },
      ]}
    />
  );
}
