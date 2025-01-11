'use client'

import { Timeline } from "@/components/Timeline"
import { Logo } from "@/components/Logo"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1A1B1E] relative">
      <div className="absolute top-0 left-0">
        <Logo />
      </div>
      <div className="container mx-auto pt-24">
        <Timeline />
      </div>
    </main>
  )
}