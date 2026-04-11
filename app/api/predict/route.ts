import { NextRequest, NextResponse } from 'next/server';
import { ScreeningResult } from '@/src/services/StorageService';

/**
 * Interface for the Prediction Request
 */
interface PredictRequest {
  gcsKey: string;
}

/**
 * Interface for Error Response
 */
interface ErrorResponse {
  error: string;
}

/**
 * POST /api/predict
 * Receives a GCS key and returns a simulated screening result.
 * In a real-world scenario, this would download the file from GCS and run a model.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScreeningResult | ErrorResponse>> {
  try {
    const body = await request.json() as PredictRequest;
    const { gcsKey } = body;

    if (!gcsKey) {
      return NextResponse.json({ error: 'No GCS key provided' }, { status: 400 });
    }

    // Simulate model inference delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Generate randomized but realistic results for the demo
    const seed = Math.random();
    let prediction = 0;
    if (seed < 0.2) prediction = 0;
    else if (seed < 0.4) prediction = 1;
    else if (seed < 0.7) prediction = 2;
    else if (seed < 0.9) prediction = 3;
    else prediction = 4;
    
    // Generate 5 probabilities that sum to 1
    const raw = Array.from({ length: 5 }, () => Math.random() * 0.5);
    // Significantly boost the predicted class
    raw[prediction] = 1.0 + Math.random();
    
    const sum = raw.reduce((a, b) => a + b, 0);
    const probabilities = raw.map((v) => v / sum);

    return NextResponse.json({
      prediction,
      probabilities
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Inference failed";
    console.error('Inference error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
