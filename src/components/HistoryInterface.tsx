"use client";

import React, { useEffect, useState } from "react";
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
} from "@/src/lib/firebase";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { Scan, ScreeningResult } from "@/src/types";
import {
  HiOutlineRefresh,
  HiOutlineDatabase,
  HiOutlineClock,
  HiOutlineTrash,
} from "react-icons/hi";

export default function HistoryInterface({ dict }: { dict: Dictionary }) {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "scans"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown[] as Scan[];

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
        const mockResult: ScreeningResult = {
          prediction: Math.random() > 0.6 ? "Referable DR" : "No DR",
          probabilities: [0.89, 0.11],
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-4xl shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            {user?.displayName?.[0] || user?.email?.[0].toUpperCase() || "?"}
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
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-[3rem] p-24 text-center">
          <div className="w-24 h-24 bg-zinc-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 opacity-50">
            <HiOutlineDatabase className="w-12 h-12 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-black mb-3">{dict.history.empty_title}</h3>
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
              className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-zinc-200/40 dark:shadow-none hover:shadow-2xl transition-all group hover:-translate-y-2 flex flex-col"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={scan.url}
                  alt={scan.fileName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
                <div className="absolute top-5 right-5">
                  <div
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md ${
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
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {scan.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate max-w-40 mb-1">
                        {scan.fileName}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <HiOutlineClock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {scan.createdAt
                            ? scan.createdAt.toDate().toLocaleDateString()
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                    {scan.result && (
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                          {dict.history.prediction_label}
                        </div>
                        <div className="font-black text-xl text-zinc-900 dark:text-white leading-none">
                          {scan.result.prediction}
                        </div>
                      </div>
                    )}
                  </div>

                  {scan.result ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <span>{dict.history.confidence_label}</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {(
                            Math.max(...scan.result.probabilities) * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.max(...scan.result.probabilities) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center bg-zinc-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-slate-800">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {dict.history.analyzing}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-slate-800 flex items-center justify-between gap-4">
                  {(scan.status === "completed" || scan.status === "done") && (
                    <button
                      onClick={() => handleRescan(scan.id)}
                      className="flex-1 py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <HiOutlineRefresh className="w-4 h-4" />
                      {dict.screening.rescan}
                    </button>
                  )}
                  <button className="p-3 text-zinc-400 hover:text-rose-500 transition-colors">
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
