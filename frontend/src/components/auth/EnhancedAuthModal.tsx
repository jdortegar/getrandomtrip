'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useUserStore } from '@/store/userStore';
import type { TravelerType, BudgetLevel } from '@/store/userStore';
import GlassCard from '@/components/ui/GlassCard';
import { Eye, EyeOff, Mail, Lock, User, Calendar, MapPin } from 'lucide-react';

type Step = 0 | 1 | 2 | 3; // 0: auth, 1: preferences, 2: review, 3: complete

const ALL_INTERESTS = [
  'playa',
  'montaña',
  'gastronomía',
  'vida-nocturna',
  'cultura',
  'naturaleza',
  'ciudad',
  'pueblos',
];

const ALL_DISLIKES = ['frío', 'calor-extremo', 'multitudes', 'madrugar'];

export default function EnhancedAuthModal() {
  const { isAuthed, user, closeAuth, upsertPrefs, authModalOpen } =
    useUserStore();

  const open = authModalOpen;

  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [step, setStep] = useState<Step>(0);
  const [travelerType, setTravelerType] = useState<TravelerType | ''>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [budget, setBudget] = useState<BudgetLevel | ''>('');

  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setAuthError('');
      setTravelerType('');
      setInterests([]);
      setDislikes([]);
      setBudget('');
    } else {
      setStep(isAuthed ? 1 : 0);
      // Hydrate from user if exists
      setTravelerType((user?.prefs?.travelerType as TravelerType) ?? '');
      setInterests(user?.prefs?.interests ?? []);
      setDislikes(user?.prefs?.dislikes ?? []);
      setBudget((user?.prefs?.budget as BudgetLevel) ?? '');
    }
  }, [open, isAuthed, user]);

  // Close modal handlers
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    const onClick = (e: MouseEvent) => {
      if (!dialogRef.current) return;
      if (!dialogRef.current.contains(e.target as Node)) closeAuth();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, closeAuth]);

  // Global event listener
  useEffect(() => {
    const h = () => {
      const { openAuth } = useUserStore.getState();
      if (typeof openAuth === 'function') openAuth();
    };
    window.addEventListener('open-auth', h);
    return () => window.removeEventListener('open-auth', h);
  }, []);

  if (!open) return null;

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError('Credenciales inválidas');
      } else {
        // Check if we should redirect immediately or go to preferences
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');

        if (returnTo) {
          // Redirect immediately to returnTo URL
          window.location.href = decodeURIComponent(returnTo);
        } else {
          // Go to preferences step
          setStep(1);
        }
      }
    } catch (error) {
      setAuthError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Get returnTo from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');
      const callbackUrl = returnTo
        ? decodeURIComponent(returnTo)
        : '/dashboard';

      await signIn('google', { callbackUrl });
    } catch (error) {
      setAuthError('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    if (password !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        // Auto sign in after successful signup
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (!result?.error) {
          // Check if we should redirect immediately or go to preferences
          const urlParams = new URLSearchParams(window.location.search);
          const returnTo = urlParams.get('returnTo');

          if (returnTo) {
            // Redirect immediately to returnTo URL
            window.location.href = decodeURIComponent(returnTo);
          } else {
            // Go to preferences step
            setStep(1);
          }
        }
      } else {
        const error = await response.json();
        setAuthError(error.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      setAuthError('Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  // Preferences handlers
  const toggleInterest = (value: string) =>
    setInterests((curr) =>
      curr.includes(value) ? curr.filter((i) => i !== value) : [...curr, value],
    );

  const toggleDislike = (value: string) =>
    setDislikes((curr) =>
      curr.includes(value) ? curr.filter((i) => i !== value) : [...curr, value],
    );

  const savePreferences = () => {
    upsertPrefs?.({
      travelerType: travelerType || undefined,
      interests,
      dislikes,
      budget: (budget || undefined) as any,
    });
    setStep(2);
  };

  const finish = () => {
    closeAuth();

    // Redirect to returnTo URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo');
    if (returnTo) {
      window.location.href = decodeURIComponent(returnTo);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={dialogRef} className="w-full max-w-lg">
        <GlassCard>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                {step === 0 && (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
                {step === 1 && 'Cuéntanos sobre ti'}
                {step === 2 && '¡Todo listo!'}
                {step === 3 && 'Bienvenido/a'}
              </h2>
              <button
                aria-label="Cerrar"
                onClick={closeAuth}
                className="rounded-lg p-2 hover:bg-neutral-100 text-neutral-500"
              >
                ✕
              </button>
            </div>

            {/* Step 0: Authentication */}
            {step === 0 && (
              <div className="space-y-6">
                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-neutral-500">o</span>
                  </div>
                </div>

                {/* Auth Form */}
                <form
                  onSubmit={isSignUp ? handleSignUp : handleSignIn}
                  className="space-y-4"
                >
                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Nombre completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isSignUp}
                          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-12 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={isSignUp}
                          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {authError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? 'Cargando...'
                      : isSignUp
                      ? 'Crear cuenta'
                      : 'Iniciar sesión'}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {isSignUp
                      ? '¿Ya tienes cuenta? Inicia sesión'
                      : '¿No tienes cuenta? Crear una'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Preferences */}
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-neutral-600">
                  Ayúdanos a personalizar tu experiencia de viaje
                </p>

                {/* Traveler Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Tipo de viajero
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ['solo', 'pareja', 'familia', 'amigos'] as TravelerType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTravelerType(type)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          travelerType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {type === 'solo' && 'Solo'}
                        {type === 'pareja' && 'Pareja'}
                        {type === 'familia' && 'Familia'}
                        {type === 'amigos' && 'Amigos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Intereses (selecciona varios)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          interests.includes(interest)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dislikes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Evitar (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_DISLIKES.map((dislike) => (
                      <button
                        key={dislike}
                        onClick={() => toggleDislike(dislike)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          dislikes.includes(dislike)
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {dislike}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Presupuesto promedio por viaje
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'mid', 'high'] as BudgetLevel[]).map(
                      (budgetType) => (
                        <button
                          key={budgetType}
                          onClick={() => setBudget(budgetType)}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            budget === budgetType
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {budgetType === 'low' && '$500-1,500'}
                          {budgetType === 'mid' && '$1,500-3,000'}
                          {budgetType === 'high' && '$3,000+'}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={savePreferences}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    ¡Perfecto!
                  </h3>
                  <p className="text-neutral-600">
                    Hemos guardado tus preferencias. Ya puedes empezar a
                    planificar tu próximo viaje.
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tipo de viajero:</span>
                    <span className="font-medium">{travelerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Intereses:</span>
                    <span className="font-medium">{interests.join(', ')}</span>
                  </div>
                  {dislikes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Evitar:</span>
                      <span className="font-medium">{dislikes.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Presupuesto:</span>
                    <span className="font-medium">
                      {budget === 'low' && '$500-1,500'}
                      {budget === 'mid' && '$1,500-3,000'}
                      {budget === 'high' && '$3,000+'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={finish}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ¡Empezar a viajar!
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
