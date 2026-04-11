"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import ImageUpload from "./ImageUpload";
import HeatmapView from "./HeatmapView";
import AnalysisResults from "./AnalysisResults";

interface ScreeningItem {
  file: File;
  url: string;
  result: { prediction: number; probabilities: number[] } | null;
  status: "idle" | "analyzing" | "done" | "error";
}

export default function ScreeningInterface({ dict }: { dict: Dictionary }) {
  const [items, setItems] = useState<ScreeningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState(60);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [items]);

  const handleUpload = (uploadedFiles: File[]) => {
    const newItems: ScreeningItem[] = uploadedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      result: null,
      status: "idle",
    }));
    setItems(newItems);
    setCurrentIndex(0);
  };

  const handleReset = () => {
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setItems([]);
    setCurrentIndex(0);
    setIsBatchAnalyzing(false);
  };

  const runScreeningForFile = async (index: number) => {
    const item = items[index];
    if (!item || item.status === "done") return;

    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], status: "analyzing" };
      return newItems;
    });

    const formData = new FormData();
    formData.append("image", item.file);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], status: "done", result: data };
        return newItems;
      });
    } catch (err) {
      console.error(err);
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], status: "error" };
        return newItems;
      });
    }
  };

  const runBatchScreening = async () => {
    setIsBatchAnalyzing(true);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "done") {
        await runScreeningForFile(i);
      }
    }
    setIsBatchAnalyzing(false);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200 dark:shadow-none">
              1
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {dict.screening.source_material}
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-4 shadow-sm">
            <ImageUpload
              dict={dict}
              onUpload={handleUpload}
              onReset={handleReset}
            />
          </div>

          {items.length > 0 &&
            !isBatchAnalyzing &&
            items.some((i) => i.status !== "done") && (
              <button
                onClick={runBatchScreening}
                className="mt-10 w-full py-5 bg-blue-600 text-white rounded-4xl font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3 group active:scale-[0.98]"
              >
                <svg
                  className="w-6 h-6 group-hover:animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {items.length > 1
                  ? dict.screening.batch_process
                  : dict.screening.analyze}
              </button>
            )}

          {isBatchAnalyzing && (
            <div className="mt-10 w-full py-5 bg-zinc-100 text-zinc-400 rounded-4xl font-bold text-xl flex items-center justify-center gap-3 cursor-not-allowed dark:bg-slate-900 border dark:border-slate-800">
              <div className="w-6 h-6 border-3 border-zinc-200 border-t-zinc-400 rounded-full animate-spin" />
              {dict.screening.analyzing}
            </div>
          )}
        </section>

        {items.length > 1 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 px-2">
              {dict.screening.selection_mode}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    currentIndex === idx
                      ? "border-blue-600 scale-105 shadow-lg shadow-blue-100 dark:shadow-none"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={`Selection ${idx}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {item.status === "analyzing" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <svg
                        className="w-2 h-2 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentItem?.result && (
          <section className="animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200 dark:shadow-none">
                2
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {dict.screening.heatmap_title}
              </h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-4 shadow-sm">
              <HeatmapView
                src={currentItem.url}
                intensity={heatmapIntensity}
                isLoading={currentItem.status === "analyzing"}
                dict={dict}
              />
              <div className="mt-6 px-4 pb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {dict.screening.visualization_engine}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                    {dict.screening.active_overlay}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={heatmapIntensity}
                  onChange={(e) =>
                    setHeatmapIntensity(parseInt(e.target.value))
                  }
                  className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="lg:sticky lg:top-24">
        {currentItem?.result ? (
          <AnalysisResults
            prediction={currentItem.result.prediction}
            probabilities={currentItem.result.probabilities}
            dict={dict}
          />
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-125 border-3 border-dashed border-zinc-200 rounded-[3rem] text-zinc-400 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-6 dark:bg-slate-800 opacity-50">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">
              {dict.screening.results}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
