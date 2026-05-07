export const modelConfig = {
  name: "ConvNextSmall + EfficientNet-b3 + ECA Ensemble",
  version: "1.0.0",
  lastUpdated: "2026-04-24",
  inputSize: "224x224 px",
  numClasses: 5,
  performance: {
    accuracy: 0.8370445344129555,
    recall: 0.765922089540392,
    f1: 0.7453858907251565,
    precision: 0.7374457174448894,
    roc_auc: 0.9326554425904865,
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
          13,
          14,
          82
        ]
  ]
};
