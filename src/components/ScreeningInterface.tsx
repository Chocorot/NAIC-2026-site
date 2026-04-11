"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import ImageUpload from "./ImageUpload";
import HeatmapView from "./HeatmapView";
import AnalysisResults from "./AnalysisResults";
import {
  storageService,
  PersistedScreeningItem,
  ScreeningResult,
} from "@/src/services/StorageService";
import { UploadResponse } from "@/app/api/upload/route";

/**
 * Local interface for items during the screening process
 */
interface ScreeningItem extends PersistedScreeningItem {
  isUploading?: boolean;
}

export default function ScreeningInterface({ dict }: { dict: Dictionary }) {
  const [items, setItems] = useState<ScreeningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState<boolean>(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string>("");

  /**
   * Initialize or retrieve Session ID
   */
  useEffect(() => {
    let id = localStorage.getItem("NAIC_SESSION_ID");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("NAIC_SESSION_ID", id);
    }
    setSessionId(id);
  }, []);

  /**
   * Run screening for a specific file index
   */
  const runScreeningForFile = useCallback(
    async (index: number, currentItems: ScreeningItem[]) => {
      const item = currentItems[index];
      if (!item || item.status === "done" || item.status === "analyzing")
        return;

      setItems((prev) => {
        const newItems = [...prev];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], status: "analyzing" };
        }
        return newItems;
      });

      const formData = new FormData();
      formData.append("gcsKey", item.key);

      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          body: JSON.stringify({ gcsKey: item.key }),
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Prediction failed");

        const data = (await response.json()) as ScreeningResult;

        setItems((prev) => {
          const newItems = [...prev];
          if (newItems[index]) {
            newItems[index] = {
              ...newItems[index],
              status: "done",
              result: data,
            };
          }
          return newItems;
        });
      } catch (err) {
        console.error("Screening error:", err);
        setItems((prev) => {
          const newItems = [...prev];
          if (newItems[index]) {
            newItems[index] = { ...newItems[index], status: "error" };
          }
          return newItems;
        });
      }
    },
    [],
  );

  /**
   * Load session on mount
   */
  useEffect(() => {
    const load = async () => {
      if (storageService) {
        const persistedItems = storageService.loadSession();
        if (persistedItems.length > 0) {
          const castItems = persistedItems as ScreeningItem[];
          setItems(castItems);

          // Resume any analyzing items
          const analyzingIndices = castItems
            .map((item, idx) => (item.status === "analyzing" ? idx : -1))
            .filter((idx) => idx !== -1);

          if (analyzingIndices.length > 0) {
            analyzingIndices.forEach((idx) =>
              runScreeningForFile(idx, castItems),
            );
          }
        }
      }
      setIsRefreshing(false);
    };
    load();
  }, [runScreeningForFile]);

  /**
   * Save session when items change
   */
  useEffect(() => {
    if (isRefreshing) return;
    if (storageService) {
      // Cast items back to PersistedScreeningItem to avoid saving 'isUploading'
      const itemsToSave: PersistedScreeningItem[] = items.map(
        ({ ...rest }) => rest,
      );
      storageService.saveSession(itemsToSave);
    }
  }, [items, isRefreshing]);

  /**
   * Handle image uploads
   */
  const handleUpload = async (uploadedFiles: File[]) => {
    if (!sessionId) return;

    // Create placeholders
    const placeholders: ScreeningItem[] = uploadedFiles.map((file) => ({
      key: "",
      url: URL.createObjectURL(file), // Temporary local preview
      fileName: file.name,
      result: null,
      status: "idle",
      isUploading: true,
    }));

    const startIndex = items.length;
    setItems((prev) => [...prev, ...placeholders]);

    // Upload each to GCS
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as UploadResponse;

        if (data.success) {
          setItems((prev) => {
            const next = [...prev];
            const targetIndex = startIndex + i;
            if (next[targetIndex]) {
              next[targetIndex] = {
                ...next[targetIndex],
                key: data.key,
                url: data.url,
                isUploading: false,
              };
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Upload failed for file:", file.name, err);
        setItems((prev) => {
          const next = [...prev];
          const targetIndex = startIndex + i;
          if (next[targetIndex]) {
            next[targetIndex] = {
              ...next[targetIndex],
              status: "error",
              isUploading: false,
            };
          }
          return next;
        });
      }
    }
  };

  /**
   * Reset the screening interface
   */
  const handleReset = () => {
    setItems([]);
    setCurrentIndex(0);
    setIsBatchAnalyzing(false);
    storageService?.clearSession();
  };

  /**
   * Run batch screening
   */
  const runBatchScreening = async () => {
    setIsBatchAnalyzing(true);
    // Use fresh items state for the loop
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "done") {
        await runScreeningForFile(i, items);
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
            items.some((i) => i.status !== "done" && !i.isUploading) && (
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
                  {(item.status === "analyzing" || item.isUploading) && (
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
