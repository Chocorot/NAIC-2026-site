export const modelConfig = {
  name: "EfficientNet-B7",
  version: "1.2.0",
  lastUpdated: "2026-04-10",
  inputSize: "600x600 px",
  numClasses: 5,
  performance: {
    accuracy: 0.942,
    recall: 0.915,
    f1: 0.928,
    precision: 0.931,
  },
  confusionMatrix: [
    [450, 20, 5, 0, 0],   // No DR
    [15, 380, 25, 5, 0],  // Mild
    [2, 30, 420, 18, 5],  // Moderate
    [0, 5, 20, 150, 10],  // Severe
    [0, 0, 8, 12, 120]    // Proliferative
  ]
};
