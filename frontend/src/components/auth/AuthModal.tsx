'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/userStore'
import GlassCard from '@/components/ui/GlassCard'
import { X } from 'lucide-react'

export default function AuthModal() {
  const { authModalOpen, authModalStep, openAuth, closeAuth, signInDemo, upsertPrefs, user } = useUserStore()
  const [currentStep, setCurrentStep] = useState(authModalStep)

  useEffect(() => {
    setCurrentStep(authModalStep)
  }, [authModalStep])

  useEffect(() => {
    const h = () => openAuth()
    window.addEventListener('open-auth', h as any)
    return () => window.removeEventListener('open-auth', h as any)
  }, [openAuth])

  if (!authModalOpen) return null

  const handleNext = () => {
    if (currentStep === 'signin') {
      setCurrentStep('onboarding')
    } else if (currentStep === 'onboarding') {
      setCurrentStep('review')
    }
  }

  const handleBack = () => {
    if (currentStep === 'onboarding') {
      setCurrentStep('signin')
    } else if (currentStep === 'review') {
      setCurrentStep('onboarding')
    }
  }

  const handleSignInDemo = (email?: string) => {
    signInDemo(email)
    setCurrentStep('onboarding') // Move to onboarding after demo sign-in
  }

  const handleSaveAndContinue = () => {
    closeAuth()
    // Optionally show a toast here if on basic-config page
    if (window.location.pathname === '/journey/basic-config') {
      // Dummy toast for now, replace with actual toast implementation
      alert('¡Listo! Preferencias guardadas 👌')
    }
  }

  // Onboarding state
  const [travelerType, setTravelerType] = useState(user?.prefs.travelerType || '')
  const [interests, setInterests] = useState<string[]>(user?.prefs.interests || [])
  const [dislikes, setDislikes] = useState<string[]>(user?.prefs.dislikes || [])
  const [budget, setBudget] = useState(user?.prefs.budget || '')

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const toggleDislike = (dislike: string) => {
    setDislikes(prev =>
      prev.includes(dislike) ? prev.filter(d => d !== dislike) : [...prev, dislike]
    )
  }

  const handleOnboardingSave = () => {
    upsertPrefs({
      travelerType: travelerType as any,
      interests,
      dislikes,
      budget: budget as any,
    })
    handleNext()
  }

  const commonChipClasses = "px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors"
  const selectedChipClasses = "bg-violet-600 text-white"
  const unselectedChipClasses = "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="relative w-full max-w-md p-6 rounded-xl shadow-lg">
        <button onClick={closeAuth} className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700">
          <X size={24} />
        </button>

        {/* Stepper Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-neutral-900">
            {currentStep === 'signin' && 'Bienvenido a Randomtrip'}
            {currentStep === 'onboarding' && 'Cuéntanos sobre ti'}
            {currentStep === 'review' && 'Revisa tus preferencias'}
          </h2>
          <p className="text-sm text-neutral-600">
            Paso {currentStep === 'signin' ? 1 : currentStep === 'onboarding' ? 2 : 3} de 3
          </p>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          {currentStep === 'signin' && (
            <div className="text-center">
              <p className="text-neutral-700 mb-4">Inicia sesión o regístrate para continuar.</p>
              <button
                onClick={() => handleSignInDemo('google@example.com')}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2"
              >
                Continuar con Google
              </button>
              <button
                onClick={() => handleSignInDemo('apple@example.com')}
                className="w-full py-2 px-4 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 mb-2"
              >
                Continuar con Apple
              </button>
              <button
                onClick={() => handleSignInDemo('facebook@example.com')}
                className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 mb-4"
              >
                Continuar con Facebook
              </button>
              <div className="flex items-center my-4">
                <hr className="flex-grow border-t border-neutral-300" />
                <span className="px-2 text-neutral-500">o</span>
                <hr className="flex-grow border-t border-neutral-300" />
              </div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border border-neutral-300 rounded-lg mb-2"
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full p-2 border border-neutral-300 rounded-lg mb-4"
              />
              <button
                onClick={() => handleSignInDemo()}
                className="w-full py-2 px-4 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Iniciar sesión / Registrarse
              </button>
            </div>
          )}

          {currentStep === 'onboarding' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">¿Cómo viajás normalmente?</h3>
                <div className="flex flex-wrap gap-2">
                  {[ 'solo', 'pareja', 'familia', 'amigos', 'empresa'].map(type => (
                    <span
                      key={type}
                      onClick={() => setTravelerType(type)}
                      className={`${commonChipClasses} ${travelerType === type ? selectedChipClasses : unselectedChipClasses}`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">¿Qué te gusta?</h3>
                <div className="flex flex-wrap gap-2">
                  {[ 'playa', 'montaña', 'gastronomía', 'vida-nocturna', 'cultura', 'naturaleza', 'ciudad', 'pueblos'].map(interest => (
                    <span
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`${commonChipClasses} ${interests.includes(interest) ? selectedChipClasses : unselectedChipClasses}`}
                    >
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">¿Qué evitás?</h3>
                <div className="flex flex-wrap gap-2">
                  {[ 'frío', 'calor-extremo', 'multitudes', 'madrugar'].map(dislike => (
                    <span
                      key={dislike}
                      onClick={() => toggleDislike(dislike)}
                      className={`${commonChipClasses} ${dislikes.includes(dislike) ? selectedChipClasses : unselectedChipClasses}`}
                    >
                      {dislike.charAt(0).toUpperCase() + dislike.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Presupuesto típico</h3>
                <div className="flex flex-wrap gap-2">
                  {[ 'low', 'mid', 'high'].map(b => (
                    <span
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`${commonChipClasses} ${budget === b ? selectedChipClasses : unselectedChipClasses}`}
                    >
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Resumen de tus preferencias</h3>
              <p className="text-neutral-700">
                <strong>Tipo de viajero:</strong> {user?.prefs.travelerType || 'No especificado'}
              </p>
              <p className="text-neutral-700">
                <strong>Intereses:</strong> {user?.prefs.interests.length ? user.prefs.interests.join(', ') : 'Ninguno'}
              </p>
              <p className="text-neutral-700">
                <strong>Evitar:</strong> {user?.prefs.dislikes.length ? user.prefs.dislikes.join(', ') : 'Ninguno'}
              </p>
              <p className="text-neutral-700">
                <strong>Presupuesto:</strong> {user?.prefs.budget || 'No especificado'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          {currentStep !== 'signin' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
            >
              Atrás
            </button>
          )}

          {currentStep === 'signin' && <div /> /* Placeholder to keep justify-between working */}

          {currentStep === 'onboarding' && (
            <button
              onClick={handleOnboardingSave}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              Continuar
            </button>
          )}

          {currentStep === 'review' && (
            <button
              onClick={handleSaveAndContinue}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              Guardar y continuar
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
