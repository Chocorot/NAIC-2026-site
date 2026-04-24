import { ScreeningResult } from "@/src/types";

class AnalysisService {

  /**
   * Sends an image file to the FastAPI backend for analysis
   */
  async analyzeImage(file: File): Promise<ScreeningResult> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const formData = new FormData();
    formData.append("file", file);

    console.log(`Analyzing image at: ${apiUrl}/predict`);
    const response = await fetch(`${apiUrl}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      prediction: result.prediction,
      probabilities: result.probabilities,
    };
  }

  /**
   * Fetches an image from a URL and sends it for analysis
   */
  async analyzeImageUrl(url: string, fileName: string = "image.jpg"): Promise<ScreeningResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      
      return await this.analyzeImage(file);
    } catch (error) {
      console.error("Error analyzing image from URL:", error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();
