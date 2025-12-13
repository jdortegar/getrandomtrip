'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const PACKAGE_TYPES = [
  { value: 'couple', label: 'Pareja' },
  { value: 'family', label: 'Familia' },
  { value: 'group', label: 'Grupo' },
  { value: 'solo', label: 'Solo' },
  { value: 'honeymoon', label: 'Luna de Miel' },
  { value: 'paws', label: 'Con Mascotas' },
] as const;

const PACKAGE_LEVELS = [
  { value: 'essenza', label: 'Essenza' },
  { value: 'modo-explora', label: 'Modo Explora' },
  { value: 'explora-plus', label: 'Explora Plus' },
  { value: 'bivouac', label: 'Bivouac' },
  { value: 'atelier-getaway', label: 'Atelier Getaway' },
] as const;

const PACKAGE_STATUSES = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ARCHIVED', label: 'Archivado' },
] as const;

interface PackageFormData {
  // Required fields
  type: string;
  level: string;
  title: string;
  destinationCountry: string;
  destinationCity: string;

  // Optional basic info
  teaser: string;
  description: string;
  heroImage: string;
  excuseKey: string;

  // Capacity
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;

  // Arrays
  tags: string[];
  highlights: string[];

  // Pricing
  basePriceUsd: number;
  displayPrice: string;

  // JSON fields (simplified for now)
  hotels: any;
  activities: any;
  itinerary: any;
  inclusions: any;
  exclusions: any;

  // Visibility
  isActive: boolean;
  isFeatured: boolean;

  // Status
  status: string;
}

function PackageEditContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');

  const packageId = params?.id?.toString() ?? '';

  const [formData, setFormData] = useState<PackageFormData>({
    type: 'couple',
    level: 'essenza',
    title: '',
    destinationCountry: '',
    destinationCity: '',
    teaser: '',
    description: '',
    heroImage: '',
    excuseKey: '',
    minNights: 1,
    maxNights: 7,
    minPax: 1,
    maxPax: 8,
    tags: [],
    highlights: [],
    basePriceUsd: 0,
    displayPrice: '',
    hotels: null,
    activities: null,
    itinerary: null,
    inclusions: null,
    exclusions: null,
    isActive: true,
    isFeatured: false,
    status: 'DRAFT',
  });

  // Load package data
  useEffect(() => {
    async function fetchPackage() {
      if (!session?.user?.id || !packageId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/tripper/packages/${packageId}`);
        const data = await response.json();

        if (response.ok && data.package) {
          const pkg = data.package;
          setFormData({
            type: pkg.type || 'couple',
            level: pkg.level || 'essenza',
            title: pkg.title || '',
            destinationCountry: pkg.destinationCountry || '',
            destinationCity: pkg.destinationCity || '',
            teaser: pkg.teaser || '',
            description: pkg.description || '',
            heroImage: pkg.heroImage || '',
            excuseKey: pkg.excuseKey || '',
            minNights: pkg.minNights || 1,
            maxNights: pkg.maxNights || 7,
            minPax: pkg.minPax || 1,
            maxPax: pkg.maxPax || 8,
            tags: pkg.tags || [],
            highlights: pkg.highlights || [],
            basePriceUsd: pkg.basePriceUsd || 0,
            displayPrice: pkg.displayPrice || '',
            hotels: pkg.hotels || null,
            activities: pkg.activities || null,
            itinerary: pkg.itinerary || null,
            inclusions: pkg.inclusions || null,
            exclusions: pkg.exclusions || null,
            isActive: pkg.isActive ?? true,
            isFeatured: pkg.isFeatured ?? false,
            status: pkg.status || 'DRAFT',
          });
        } else {
          toast.error(data.error || 'Error al cargar el paquete');
        }
      } catch (error) {
        console.error('Error fetching package:', error);
        toast.error('Error al cargar el paquete');
      } finally {
        setLoading(false);
      }
    }

    fetchPackage();
  }, [session?.user?.id, packageId]);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const addHighlight = () => {
    if (
      highlightInput.trim() &&
      !formData.highlights.includes(highlightInput.trim())
    ) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, highlightInput.trim()],
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight: string) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((h) => h !== highlight),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/tripper/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Paquete actualizado exitosamente');
        router.push('/dashboard/tripper/packages');
      } else {
        toast.error(data.error || 'Error al actualizar el paquete');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Error al actualizar el paquete');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/tripper/packages');
  };

  if (loading) {
    return (
      <>
        <Hero
          content={{
            title: 'Cargando Paquete',
            subtitle: 'Obteniendo información del paquete...',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">Cargando...</div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Hero
        content={{
          title: formData.title || 'Editar Paquete',
          subtitle: 'Modifica la información de tu paquete de viaje',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: formData.heroImage || '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/tripper/packages"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Paquetes
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Información Básica
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Título <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Ej: Aventura Urbana Misteriosa"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Tipo <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          required
                        >
                          {PACKAGE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Nivel <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.level}
                          onChange={(e) =>
                            setFormData({ ...formData, level: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          required
                        >
                          {PACKAGE_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {PACKAGE_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Teaser (Descripción corta)
                      </label>
                      <Input
                        type="text"
                        value={formData.teaser}
                        onChange={(e) =>
                          setFormData({ ...formData, teaser: e.target.value })
                        }
                        placeholder="Una descripción breve que aparecerá en las tarjetas"
                        maxLength={150}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Descripción Completa
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe tu paquete en detalle..."
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Destination */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Destino
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        País <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.destinationCountry}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            destinationCountry: e.target.value,
                          })
                        }
                        placeholder="Ej: Argentina"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.destinationCity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            destinationCity: e.target.value,
                          })
                        }
                        placeholder="Ej: Buenos Aires"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Excuse Key (Opcional)
                    </label>
                    <Input
                      type="text"
                      value={formData.excuseKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          excuseKey: e.target.value,
                        })
                      }
                      placeholder="Ej: romantic-getaway, solo-adventure"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Capacity */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Capacidad
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Noches Mínimas
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.minNights}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minNights: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Noches Máximas
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.maxNights}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxNights: parseInt(e.target.value) || 7,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Pax Mínimos
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.minPax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minPax: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Pax Máximos
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.maxPax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxPax: parseInt(e.target.value) || 8,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Pricing */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Precio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Precio Base (USD)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basePriceUsd}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basePriceUsd: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Precio de Visualización
                      </label>
                      <Input
                        type="text"
                        value={formData.displayPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayPrice: e.target.value,
                          })
                        }
                        placeholder="Ej: USD 450, Desde $1200 ARS"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Tags */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Tags
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Agregar tag (presiona Enter)"
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Highlights */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Highlights
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="text"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addHighlight();
                        }
                      }}
                      placeholder="Agregar highlight (presiona Enter)"
                    />
                    <Button
                      type="button"
                      onClick={addHighlight}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {highlight}
                        <button
                          type="button"
                          onClick={() => removeHighlight(highlight)}
                          className="hover:text-green-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Media */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Media
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Imagen Hero (URL)
                    </label>
                    <Input
                      type="url"
                      value={formData.heroImage}
                      onChange={(e) =>
                        setFormData({ ...formData, heroImage: e.target.value })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Visibility */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Visibilidad
                  </h2>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-neutral-700">
                        Paquete Activo
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isFeatured: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-neutral-700">
                        Destacado
                      </span>
                    </label>
                  </div>
                </div>
              </GlassCard>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Section>
    </>
  );
}

function PackageEditPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <PackageEditContent />
    </SecureRoute>
  );
}

export default PackageEditPage;
