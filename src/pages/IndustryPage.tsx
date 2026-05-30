import MultiIndicatorPage from "./MultiIndicatorPage";

export default function IndustryPage() {
  return (
    <MultiIndicatorPage
      title="工业能源"
      description="工业生产指标反映制造业和工业整体运行状况，PMI 和 PPI 是重要的先行指标。"
      indicators={[
        { key: "pmi", name: "制造业PMI", desc: "制造业采购经理指数，荣枯线为50，高于50表示制造业扩张，低于50表示收缩。" },
        { key: "ppi", name: "PPI同比", desc: "工业品出厂价格同比，反映工业生产端的通胀压力，与企业利润密切相关。" },
      ]}
    />
  );
}
