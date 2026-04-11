'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { Dictionary } from '@/app/[lang]/dictionaries'

export default function HeatmapView({ 
  src, 
  intensity, 
  isLoading,
  dict
}: { 
  src: string, 
  intensity: number, 
  isLoading: boolean,
  dict: Dictionary
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawSimulatedHeatmap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    // Current intensity scale
    const alpha = intensity / 100
    
    // Create random hotspots for simulation (using fixed seeds for consistency in demo)
    const centers = [
      { x: width * 0.45, y: height * 0.42, r: width * 0.2, color: 'rgba(255, 0, 0, 0.9)' },
      { x: width * 0.62, y: height * 0.58, r: width * 0.15, color: 'rgba(255, 50, 0, 0.8)' },
      { x: width * 0.35, y: height * 0.65, r: width * 0.12, color: 'rgba(255, 100, 0, 0.7)' },
      { x: width * 0.55, y: height * 0.35, r: width * 0.1, color: 'rgba(255, 150, 0, 0.6)' }
    ]

    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = alpha

    centers.forEach(c => {
      const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
      gradient.addColorStop(0, c.color)
      gradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.2)')
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()
    })
    
    ctx.restore()
  }, [])

  useEffect(() => {
    if (!src || isLoading || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = src
    img.onload = () => {
      // Set canvas size to match image aspect ratio but limit for performance
      const maxWidth = 800
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Draw simulated heatmap
      drawSimulatedHeatmap(ctx, canvas.width, canvas.height, intensity)
    }
  }, [src, intensity, isLoading, drawSimulatedHeatmap])


  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-3xl overflow-hidden border-2 border-zinc-100 dark:border-slate-800 bg-black aspect-square flex items-center justify-center">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-900/60 backdrop-blur-md z-10">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
              <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-white text-sm font-bold tracking-widest uppercase animate-pulse">{dict.screening.analyzing}</p>
          </div>
        ) : null}
        
        {src ? (
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-zinc-500 text-sm italic">Image not loaded</div>
        )}
      </div>
      
      {!isLoading && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{dict.screening.tune_heatmap}</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
              {intensity}%
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={intensity} 
            onChange={() => {}} // Controlled by parent
            readOnly // Managed by parent via intensity prop
            className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[10px] text-zinc-400">Soft</span>
            <span className="text-[10px] text-zinc-400">Intense</span>
          </div>
        </div>
      )}
    </div>
  )
}
