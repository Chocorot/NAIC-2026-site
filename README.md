# NAIC 2026 - DR Screening Prototype

This is a high-performance, AI-aided Diabetic Retinopathy (DR) screening interface built with Next.js 14, featuring a premium design and advanced visualization capabilities.

## Key Features

- **Batch Upload**: Process multiple retinal fundus images simultaneously.
- **AI-Aided Analysis**: Preliminary classification of DR severity (No DR to Proliferative DR).
- **Interactive Heatmaps**: Visual assessment overlays with adjustable intensity to identify areas of concern.
- **Multilingual Support**: Fully localized interface (EN, ZH, MS, JA, DE).
- **Responsive & Dark Mode**: Premium, fluid UI that adapts to all devices and lighting preferences.

## Batch Upload Workflow

1. **Upload**: Drag and drop multiple images or click the upload zone in the "Source Material" section.
2. **Review Batch**: View the gallery of selected images. You can add more or remove individual files.
3. **Analyze**: Click "Run Batch Screening" to process all images sequentially.
4. **View Results**: Click on any thumbnail in the batch tray to switch between results, confidence scores, and visual heatmaps.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

## Cloud Storage Setup

This project uses Google Cloud Storage for persisting screening sessions.

1. **Service Account**: Create a Google Cloud Service Account with "Storage Object Admin" permissions.
2. **Key**: Generate a JSON key for the service account and place it in the project root as `service-account.json` (this file is ignored by Git).
3. **Environment Variables**: Create a `.env.local` file with:
   ```env
   GCS_BUCKET_NAME=your-bucket-name
   GCS_KEY_PATH=service-account.json
   ```

## Development Architecture

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS with modern modules
- **Icons**: React Icons
- **Deployment**: Optimized for Vercel

---
*Disclaimer: This is a prototype screening result and should not be used as a final medical diagnosis. Always consult with a qualified ophthalmologist.*
