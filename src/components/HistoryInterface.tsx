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
} from "@/src/lib/firebase";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { Scan } from "@/src/types";



// Scan is imported from types


export default function HistoryInterface({}: { dict: Dictionary }) {
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
            Scan History
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Review your previous screenings and AI analysis results.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border dark:border-slate-800 flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Current Session
            </div>
            <div className="text-sm font-bold">
              {user?.email || "Anonymous User"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
            {user?.email?.[0].toUpperCase() || "?"}
          </div>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-[2.5rem] p-20 text-center">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-zinc-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">No scans found</h3>
          <p className="text-zinc-500 max-w-xs mx-auto mb-8">
            You haven&apos;t uploaded any eye scans yet. Start a new screening
            to see results here.
          </p>
          <a
            href={`/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Start Screening
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1"
            >
              <div className="relative aspect-4/3 w-full">
                <Image
                  src={scan.url}
                  alt={scan.fileName}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      scan.status === "completed" || scan.status === "done"
                        ? "bg-emerald-500 border-emerald-400 text-white"
                        : scan.status === "processing" ||
                            scan.status === "analyzing"
                          ? "bg-blue-500 border-blue-400 text-white animate-pulse"
                          : "bg-zinc-500 border-zinc-400 text-white"
                    }`}
                  >
                    {scan.status}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate max-w-37.5">
                      {scan.fileName}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {scan.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  {scan.result && (
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">
                        Result
                      </div>
                      <div className="font-black text-lg text-zinc-900 dark:text-white">
                        {scan.result.prediction}
                      </div>
                    </div>
                  )}
                </div>

                {scan.result && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-slate-800">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                      <span>AI Confidence</span>
                      <span>
                        {(Math.max(...scan.result.probabilities) * 100).toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.max(...scan.result.probabilities) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
