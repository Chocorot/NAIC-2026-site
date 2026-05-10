export const modelConfig = {
  name: "ConvNextSmall + EfficientNet-b3 + Rank Fusion Ensemble",
  version: "1.0.0",
  lastUpdated: "2026-04-24",
  inputSize: "224x224 px",
  numClasses: 5,
  performance: {
    accuracy: 0.8360323886639676,
    recall: 0.7641677035754796,
    f1: 0.7439349224626471,
    precision: 0.7363689921774677,
    roc_auc: 0.9306918043258635,
  },
  confusionMatrix: [
    [
      439,
      8,
      1,
      0,
      0
    ],
    [
      13,
      70,
      17,
      1,
      4
    ],
    [
      10,
      28,
      204,
      20,
      15
    ],
    [
      0,
      0,
      10,
      32,
      2
    ],
    [
      0,
      5,
      14,
      14,
      81
    ]
  ]
};
