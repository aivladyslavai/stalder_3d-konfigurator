import React from 'react'

import Scene from './components/Scene'
import Header from './ui/Header'
import Stepper from './ui/Stepper'
import WizardPanel from './ui/WizardPanel'

/**
 * STALDER Pool Konfigurator – Layout:
 *  Kopfzeile oben, darunter: Stepper (links) · Schritt-Panel (Mitte) · 3D-Vorschau (rechts).
 *  Auf Mobilgeräten wird die 3D-Vorschau oben gestapelt.
 */
export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      <Header />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stepper */}
        <Stepper />

        {/* Schritt-Inhalt */}
        <main className="flex min-h-0 flex-col border-gray-100 lg:w-[480px] lg:flex-none lg:border-r">
          <WizardPanel />
        </main>

        {/* Live-3D-Vorschau */}
        <div className="relative min-h-[40vh] flex-1 bg-gradient-to-b from-sky-100 to-sky-200 lg:min-h-0">
          <Scene />
        </div>
      </div>
    </div>
  )
}
