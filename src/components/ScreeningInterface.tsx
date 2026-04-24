"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import ImageUpload from "./ImageUpload";
import ConfirmationModal from "./ConfirmationModal";
import LoadingSpinner from "./LoadingSpinner";
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
import { analysisService } from "@/src/services/AnalysisService";
import AnalysisResults from "./AnalysisResults";
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
  const [inboxItems, setInboxItems] = useState<PendingItem[]>([]);
  const [resultItems, setResultItems] = useState<PendingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: "inbox" | "results";
    index: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadKey, setUploadKey] = useState<number>(0);
  const [pendingAction, setPendingAction] = useState<{
    type: "remove" | "clear";
    index?: number;
  } | null>(null);

  /**
   * Listen for updates on submitted scans
   */
  React.useEffect(() => {
    if (!user || resultItems.length === 0) return;

    const unsubscribers = resultItems.map((item) => {
      if (!item.scanId) return () => {};

      return onSnapshot(doc(db, "scans", item.scanId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const result = data.result as ScreeningResult | null;
          const status = data.status as ScanStatus;

          setResultItems((prev) =>
            prev.map((it) =>
              it.scanId === snapshot.id ? { ...it, status, result } : it,
            ),
          );
        }
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [resultItems.map((it) => it.scanId).join(","), user]);

  /**
   * Run the actual image analysis using the FastAPI backend
   */
  const performAnalysis = async (scanId: string, file: File) => {
    try {
      const docRef = doc(db, "scans", scanId);
      
      // Use the centralized analysis service
      const result = await analysisService.analyzeImage(file);

      // Update Firestore with the real ensemble results
      await updateDoc(docRef, {
        status: "completed",
        result: result,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Analysis failed:", error);
      
      // Mark as error in Firestore
      const docRef = doc(db, "scans", scanId);
      await updateDoc(docRef, { 
        status: "error"
      });
    }
  };

  /**
   * Handle image selections (Local only)
   */
  const handleUpload = (uploadedFiles: File[]) => {
    setInboxItems((prev) => {
      // Re-use objects for stable previews
      const newList: PendingItem[] = uploadedFiles.map((file) => {
        const existing = prev.find(
          (it) =>
            it.file.name === file.name &&
            it.file.size === file.size &&
            it.file.lastModified === file.lastModified,
        );
        if (existing) return existing;

        return {
          file,
          previewUrl: URL.createObjectURL(file),
          status: "pending",
          progress: 0,
        };
      });

      // Cleanup revoked URLs
      prev.forEach((it) => {
        if (!newList.some((n) => n.previewUrl === it.previewUrl)) {
          URL.revokeObjectURL(it.previewUrl);
        }
      });

      return newList;
    });

    setSelectedItem((prev) => {
      if (!prev || prev.type === "inbox") {
        return { type: "inbox", index: Math.max(0, uploadedFiles.length - 1) };
      }
      return prev;
    });
  };

  /**
   * Remove item from local queue
   */
  const removeItem = (index: number) => {
    // This removeItem is only for resultItems (bottom queue)
    setPendingAction({ type: "remove", index });
  };

  const confirmRemoveItem = async (index: number) => {
    const item = resultItems[index];

    if (item.scanId) {
      try {
        const docRef = doc(db, "scans", item.scanId);
        await updateDoc(docRef, { isDeleted: true });
      } catch (err) {
        console.error("Failed to soft-delete scan from Firestore:", err);
      }
    }

    setResultItems((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });

    setSelectedItem((prev) => {
      if (prev?.type === "results") {
        return {
          type: "results",
          index: Math.max(0, resultItems.length - 2),
        };
      }
      return prev;
    });
    setPendingAction(null);
  };

  const handleReset = () => {
    inboxItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    resultItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setInboxItems([]);
    setResultItems([]);
    setSelectedItem(null);
    setUploadKey((prev) => prev + 1);
  };

  const clearIncomingQueue = () => {
    inboxItems.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setInboxItems([]);
    if (selectedItem?.type === "inbox") setSelectedItem(null);
    setUploadKey((prev) => prev + 1);
  };

  const confirmClearIncomingQueue = () => {
    // Unused in current architecture for Inbox
    setPendingAction(null);
  };

  const startScanning = async () => {
    if (!user || inboxItems.length === 0) return;
    setIsProcessing(true);

    try {
      const uploadPromises = inboxItems.map(async (item, idx) => {
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

        // 3. Trigger real analysis via FastAPI
        performAnalysis(scanDoc.id, item.file);

        return {
          ...item,
          scanId: scanDoc.id,
          status: "processing" as ScanStatus,
        };
      });

      const processedResults = await Promise.all(uploadPromises);

      // Move from inbox to results
      setResultItems((prev) => [...prev, ...processedResults]);
      setInboxItems([]);
      setSelectedItem({
        type: "results",
        index: resultItems.length,
      });

      // Reset the upload UI after starting all scans
      setUploadKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to start scanning queue:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentItem =
    selectedItem?.type === "inbox"
      ? inboxItems[selectedItem.index]
      : selectedItem?.type === "results"
        ? resultItems[selectedItem.index]
        : null;

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
            {inboxItems.length > 0 && (
              <button
                onClick={clearIncomingQueue}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors"
              >
                {dict.screening_ui.clear_queue}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <ImageUpload
              key={uploadKey}
              files={inboxItems.map((it) => ({
                file: it.file,
                preview: it.previewUrl,
                id: it.file.name + it.file.size,
              }))}
              dict={dict}
              onUpload={handleUpload}
              onReset={clearIncomingQueue}
            />
          </div>

          {inboxItems.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="p-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl flex items-center justify-between">
                <div>
                  <p className="text-xl font-black">
                    {inboxItems.length} {dict.screening.batch_count}
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
                    <LoadingSpinner size="sm" color="white" />
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

        {resultItems.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4 px-2">
              {dict.screening_ui.queue_preview}
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 px-2">
              {resultItems.map((item, idx) => (
                <div
                  key={item.scanId || idx}
                  onClick={() => setSelectedItem({ type: "results", index: idx })}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group cursor-pointer ${
                    selectedItem?.type === "results" && selectedItem.index === idx
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(idx);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all z-10 shadow-lg"
                  >
                    <HiOutlineTrash className="w-3 h-3" />
                  </button>
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

            <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 dark:bg-slate-950 border dark:border-slate-800">
              <Image
                src={currentItem.previewUrl}
                alt="Current Selection"
                fill
                className="object-contain"
                unoptimized
                priority
              />
              {currentItem.status === "processing" && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <LoadingSpinner size="lg" color="primary" />
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

            {currentItem.status === "completed" && currentItem.result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AnalysisResults
                  prediction={currentItem.result.prediction}
                  probabilities={currentItem.result.probabilities}
                  dict={dict}
                />
              </div>
            )}

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
        <ConfirmationModal
        isOpen={!!pendingAction}
        title={dict.common.confirm_title}
        message={
          pendingAction?.type === "clear"
            ? dict.common.confirm_clear_all
            : dict.common.confirm_delete_item
        }
        confirmText={dict.common.action_confirm}
        cancelText={dict.common.action_cancel}
        onConfirm={() => {
          if (pendingAction?.type === "clear") {
            confirmClearIncomingQueue();
          } else if (
            pendingAction?.type === "remove" &&
            typeof pendingAction.index === "number"
          ) {
            confirmRemoveItem(pendingAction.index);
          }
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
    </div>
  );
}
