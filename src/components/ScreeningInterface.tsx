"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import ImageUpload from "./ImageUpload";
import { useAuth } from "@/src/context/AuthContext";
import {
  storage,
  db,
  ref,
  uploadBytes,
  getDownloadURL,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "@/src/lib/firebase";
import { ScreeningResult, ScanStatus } from "@/src/types";
import {
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineInformationCircle,
  HiOutlineMail,
} from "react-icons/hi";
import AnalysisResults from "./AnalysisResults";
import HeatmapView from "./HeatmapView";
import { onSnapshot } from "firebase/firestore";

interface PendingItem {
  file: File;
  previewUrl: string;
  status: ScanStatus;
  progress: number;
  scanId?: string;
  result?: ScreeningResult | null;
}

export default function ScreeningInterface({ dict }: { dict: Dictionary }) {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /**
   * Listen for updates on submitted scans
   */
  React.useEffect(() => {
    if (!user || pendingItems.length === 0) return;

    const submittedItems = pendingItems.filter((it) => it.scanId);
    if (submittedItems.length === 0) return;

    // We only create one listener for all currently processing items in the local state
    const unsubscribers = submittedItems.map((item) => {
      if (!item.scanId) return () => {};

      return onSnapshot(doc(db, "scans", item.scanId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const result = data.result as ScreeningResult | null;
          const status = data.status as ScanStatus;

          setPendingItems((prev) =>
            prev.map((it) =>
              it.scanId === snapshot.id ? { ...it, status, result } : it,
            ),
          );
        }
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [pendingItems, user]); // Only re-run if the set of scanIds changes

  /**
   * Run a mock screening process for the started scan
   * This updates the status in Firestore so History picks it up
   */
  const triggerMockAnalysis = async (scanId: string) => {
    // In a real app, a Cloud Function would trigger on write.
    // For this prototype, we simulate the backend picking it up.
    setTimeout(
      async () => {
        try {
          const docRef = doc(db, "scans", scanId);

          // Generate 5 probabilities for the 5 severity classes
          const classesCount = 5;
          const randomIdx = Math.floor(Math.random() * classesCount);
          const rawProbs = Array.from(
            { length: classesCount },
            () => Math.random() * 0.2,
          );
          rawProbs[randomIdx] += 0.8; // Boost the "prediction" class
          const sum = rawProbs.reduce((a, b) => a + b, 0);
          const probabilities = rawProbs.map((p) => p / sum);

          const mockResult: ScreeningResult = {
            prediction: randomIdx,
            probabilities: probabilities,
          };

          await updateDoc(docRef, {
            status: "completed",
            result: mockResult,
          });
        } catch (err: unknown) {
          const error = err as Error;
          console.error("Mock analysis failed:", error);
        }
      },
      3000 + Math.random() * 2000,
    );
  };

  /**
   * Handle image selections (Local only)
   */
  const handleUpload = (uploadedFiles: File[]) => {
    const newItems: PendingItem[] = uploadedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));
    setPendingItems((prev) => [...prev, ...newItems]);
  };

  /**
   * Remove item from local queue
   */
  const removeItem = (index: number) => {
    setPendingItems((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
    if (currentIndex >= pendingItems.length - 1) {
      setCurrentIndex(Math.max(0, pendingItems.length - 2));
    }
  };

  const handleReset = () => {
    pendingItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingItems([]);
    setCurrentIndex(0);
  };

  /**
   * Commit the local queue to Firestore and Start Scan
   */
  const startScanning = async () => {
    if (!user || pendingItems.length === 0) return;
    setIsProcessing(true);

    try {
      const uploadPromises = pendingItems.map(async (item, idx) => {
        // 1. Upload to Storage
        const storagePath = `uploads/${user.uid}/${Date.now()}_${idx}_${item.file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, item.file);
        const downloadUrl = await getDownloadURL(storageRef);

        // 2. Create Firestore Doc with 'processing' status
        const scanDoc = await addDoc(collection(db, "scans"), {
          ownerId: user.uid,
          fileName: item.file.name,
          storagePath,
          url: downloadUrl,
          status: "processing",
          result: null,
          createdAt: serverTimestamp(),
          isDeleted: false,
        });

        // 3. Trigger mock background analysis
        triggerMockAnalysis(scanDoc.id);

        // Update local state with scanId immediately
        setPendingItems((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            scanId: scanDoc.id,
            status: "processing",
          };
          return next;
        });

        return scanDoc.id;
      });

      await Promise.all(uploadPromises);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to start scanning queue:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentItem = pendingItems[currentIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-700">
      <div className="space-y-12">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200 dark:shadow-none">
                1
              </div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                {dict.screening.source_material}
              </h2>
            </div>
            {pendingItems.length > 0 && (
              <button
                onClick={handleReset}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors"
              >
                {dict.screening_ui.clear_queue}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <ImageUpload
              dict={dict}
              onUpload={handleUpload}
              onReset={handleReset}
            />
          </div>

          {pendingItems.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="p-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl flex items-center justify-between">
                <div>
                  <p className="text-xl font-black">
                    {pendingItems.length} {dict.screening.batch_count}
                  </p>
                  <p className="text-xs font-medium opacity-60 italic">
                    {dict.screening.batch_ready}
                  </p>
                </div>
                <button
                  onClick={startScanning}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <HiOutlinePlay className="w-6 h-6" />
                  )}
                  {dict.screening.start_scan}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex gap-3">
                <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                  {dict.screening_ui.background_note}
                </p>
              </div>
            </div>
          )}
        </section>

        {pendingItems.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4 px-2">
              {dict.screening_ui.queue_preview}
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 px-2">
              {pendingItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group cursor-pointer ${
                    currentIndex === idx
                      ? "border-blue-600 scale-105 shadow-xl shadow-blue-100 dark:shadow-none"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={item.previewUrl}
                    alt={`Preview ${idx}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(idx);
                      }}
                      className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <HiOutlineTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="lg:sticky lg:top-24">
        {currentItem ? (
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-8 lg:p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1 truncate max-w-50">
                  {currentItem.file.name}
                </h3>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  {Math.round(currentItem.file.size / 1024)} KB •{" "}
                  {currentItem.scanId
                    ? "Cloud Scan"
                    : dict.screening_ui.local_draft}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  currentItem.status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : currentItem.status === "processing"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-600"
                      : "bg-zinc-100 dark:bg-slate-800 border-transparent text-zinc-500"
                }`}
              >
                {currentItem.status}
              </div>
            </div>

            {currentItem.status === "completed" && currentItem.result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <HeatmapView
                  src={currentItem.previewUrl}
                  intensity={60}
                  isLoading={false}
                  dict={dict}
                />
                <AnalysisResults
                  prediction={currentItem.result.prediction}
                  probabilities={currentItem.result.probabilities}
                  dict={dict}
                />
              </div>
            ) : (
              <>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 dark:bg-slate-950 border dark:border-slate-800">
                  <Image
                    src={currentItem.previewUrl}
                    alt="Current Selection"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  {currentItem.status === "processing" && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                        Analyzing...
                      </p>
                    </div>
                  )}
                  {!currentItem.scanId && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {dict.screening.pending_upload}
                    </div>
                  )}
                </div>

                {!currentItem.scanId && (
                  <div className="pt-6 border-t dark:border-slate-800">
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                      {dict.screening_ui.local_queue_label.replace(
                        "{start_btn}",
                        dict.screening.start_scan,
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-125 border-3 border-dashed border-zinc-200 dark:border-slate-800 rounded-2xl text-zinc-400 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-slate-800 flex items-center justify-center mb-6 opacity-50">
              <HiOutlineMail className="w-10 h-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              {dict.screening.queue_empty}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
