"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
} from "@/src/lib/firebase";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { Scan, ScreeningResult, ScanStatus } from "@/src/types";
import {
  HiOutlineClock,
  HiOutlineDatabase,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";
import AnalysisResults from "./AnalysisResults";
import LoadingSpinner from "./LoadingSpinner";
import ConfirmationModal from "./ConfirmationModal";

export default function HistoryInterface({ dict }: { dict: Dictionary }) {
  const { user } = useAuth();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedScan) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedScan]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedScan(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "scans"),
      where("ownerId", "==", user.uid),
      where("isDeleted", "!=", true), // Filter out soft-deleted scans
      orderBy("isDeleted"), // Required for inequality index
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: data.ownerId as string,
            fileName: data.fileName as string,
            url: data.url as string,
            status: data.status as ScanStatus,
            result: data.result as ScreeningResult | null,
            storagePath: data.storagePath as string | undefined,
            createdAt: data.createdAt as Timestamp,
          } satisfies Scan;
        });

        setScans(docs);
        setLoading(false);
      },
      (err: unknown) => {
        const error = err as Error;
        console.error("Error fetching history:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleRescan = async (scanId: string) => {
    try {
      const docRef = doc(db, "scans", scanId);
      await updateDoc(docRef, {
        status: "processing",
        result: null,
      });

      // Simulate AI analysis again
      setTimeout(async () => {
        const classesCount = 5;
        const randomIdx = Math.floor(Math.random() * classesCount);
        const rawProbs = Array.from(
          { length: classesCount },
          () => Math.random() * 0.2,
        );
        rawProbs[randomIdx] += 0.8;
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
      }, 5000);
    } catch (err) {
      console.error("Rescan failed:", err);
    }
  };

  const handleDelete = (scanId: string) => {
    setPendingDeleteId(scanId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setDeletingId(pendingDeleteId);
      const docRef = doc(db, "scans", pendingDeleteId);
      await updateDoc(docRef, {
        isDeleted: true,
      });
      setSelectedScan(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl animate-in font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
            {dict.navigation.history}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg max-w-lg">
            {dict.history.subtitle}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {dict.auth.anonymous}
            </div>
            <div className="text-sm font-black text-zinc-900 dark:text-white">
              {user?.displayName || user?.email?.split("@")[0]}
            </div>
          </div>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-3xl p-24 text-center">
          <div className="w-24 h-24 bg-zinc-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 opacity-50">
            <HiOutlineDatabase className="w-12 h-12 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-black mb-3">
            {dict.history.empty_title}
          </h3>
          <p className="text-zinc-500 max-w-xs mx-auto mb-10 font-medium">
            {dict.history.empty_desc}
          </p>
          <a
            href={`/`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            {dict.history.start_new}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => setSelectedScan(scan)}
              className="bg-white dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-blue-500/50 transition-all group flex flex-col cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={scan.url}
                  alt={scan.fileName}
                  fill
                  className="object-cover transition-transform duration-700"
                  unoptimized
                />
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${
                      scan.status === "completed" || scan.status === "done"
                        ? "bg-emerald-500/90 border-emerald-400 text-white"
                        : scan.status === "processing" ||
                            scan.status === "analyzing"
                          ? "bg-blue-500/90 border-blue-400 text-white"
                          : "bg-zinc-800/90 border-zinc-700 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {(scan.status === "processing" ||
                        scan.status === "analyzing") && (
                        <LoadingSpinner size="sm" color="white" />
                      )}
                      {scan.status === "completed" || scan.status === "done"
                        ? dict.history.status_completed
                        : scan.status === "processing" ||
                            scan.status === "analyzing"
                          ? dict.history.status_processing
                          : scan.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white truncate max-w-35 mb-0.5">
                        {scan.fileName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <HiOutlineClock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {scan.createdAt instanceof Timestamp
                            ? new Intl.DateTimeFormat(lang, {
                                dateStyle: "medium",
                              }).format(scan.createdAt.toDate())
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                    {scan.result && (
                      <div className="text-right">
                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
                          {dict.history.prediction_label}
                        </div>
                        <div className="font-black text-lg text-zinc-900 dark:text-white leading-none">
                          {scan.result.prediction}
                        </div>
                      </div>
                    )}
                  </div>

                  {scan.result ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        <span>{dict.history.confidence_label}</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {(
                            Math.max(...scan.result.probabilities) * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.max(...scan.result.probabilities) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center justify-center bg-zinc-50 dark:bg-slate-950/50 rounded-2xl border border-zinc-100 dark:border-slate-800">
                      <LoadingSpinner size="md" color="primary" className="mb-2" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        {dict.history.analyzing}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedScan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedScan(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-500 relative cursor-default premium-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedScan(null)}
              className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-slate-800 rounded-xl hover:bg-rose-500 hover:text-white transition-all z-10"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 dark:bg-slate-950 border dark:border-slate-800 shadow-inner">
                    <Image
                      src={selectedScan.url}
                      alt={selectedScan.fileName}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      {dict.history.scan_metadata}
                    </h3>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                      {selectedScan.fileName}
                    </h2>
                    <p className="text-zinc-500 font-medium text-sm">
                      {dict.history.processed_on}{" "}
                      {selectedScan.createdAt instanceof Timestamp
                        ? new Intl.DateTimeFormat(lang, {
                            dateStyle: "medium",
                            timeStyle: "medium",
                          }).format(selectedScan.createdAt.toDate())
                        : "Unknown Date"}
                    </p>
                  </div>

                  {selectedScan.result && (
                    <AnalysisResults
                      prediction={selectedScan.result.prediction}
                      probabilities={selectedScan.result.probabilities}
                      dict={dict}
                    />
                  )}

                  <div className="pt-8 border-t dark:border-slate-800 flex items-center gap-4">
                    <button
                      onClick={() => {
                        handleRescan(selectedScan.id);
                        setSelectedScan(null);
                      }}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      {dict.screening.rescan}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedScan.id)}
                      disabled={deletingId === selectedScan.id}
                      className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <HiOutlineTrash
                        className={`w-6 h-6 ${deletingId === selectedScan.id ? "animate-pulse" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={dict.common.confirm_title}
        message={dict.common.confirm_permanent_delete}
        confirmText={dict.common.action_confirm}
        cancelText={dict.common.action_cancel}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
