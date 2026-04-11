import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Simulate model inference delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Generate randomized but realistic results for the demo
    // We'll favor "Moderate DR" (2) as it's a common screening result
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
    const probabilities = raw.map(v => v / sum);

    return NextResponse.json({
      prediction,
      probabilities
    });
  } catch (error) {
    console.error('Inference error:', error);
    return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
  }
}
