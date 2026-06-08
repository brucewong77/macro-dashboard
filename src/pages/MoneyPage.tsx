import MultiIndicatorPage from "./MultiIndicatorPage";

export default function MoneyPage() {
  return (
    <MultiIndicatorPage
      title="货币金融"
      description="货币金融指标反映货币供应量、利率水平和社会融资状况，是判断货币政策松紧程度的重要依据。"
      indicators={[
        { key: "m2", name: "M2同比增速", desc: "广义货币供应量（M2）同比增速，反映流动性和社会总需求变化。" },
        { key: "lpr", name: "LPR(1年期)", desc: "贷款市场报价利率（1年期），是银行对最优质客户的贷款利率基准，直接影响实体融资成本。" },
        { key: "shrzgm", name: "社融存量增速", desc: "社会融资规模存量同比增速，反映实体经济获得融资的整体状况。" },
      ]}
    />
  );
}
