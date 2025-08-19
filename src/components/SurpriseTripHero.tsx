'use client';

import { useState } from 'react';
import { Calendar, Gift, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  type TripType,
  type CityOption,
  type TravelersOption,
  type TripTypeOption,
} from '@/lib/types';
import { tripTypes as defaultTripTypes, travelersOptions } from '@/lib/data';
import { getTravelersLabel } from '@/lib/utils/helpers';

interface SurpriseTripHeroProps {
  backgroundUrl: string;
  defaultCity?: string;
  cities: CityOption[];
  tripTypes?: TripTypeOption[];
  defaultTravelers?: TravelersOption;
  onStart: (payload: {
    mode: 'reservar' | 'regalar';
    tripType: TripType;
    fromCity: string;
    travelers: TravelersOption;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function SurpriseTripHero({
  backgroundUrl,
  defaultCity = 'lisboa',
  cities,
  tripTypes = defaultTripTypes,
  defaultTravelers = 2,
  onStart,
  isSubmitting = false,
  className,
}: SurpriseTripHeroProps) {
  const [activeTab, setActiveTab] = useState<'reservar' | 'regalar'>(
    'reservar',
  );
  const [tripType, setTripType] = useState<TripType>('vuelo_hotel');
  const [fromCity, setFromCity] = useState(defaultCity);
  const [travelers, setTravelers] = useState<TravelersOption>(defaultTravelers);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

  const selectedCity = cities.find((city) => city.code === fromCity);

  const handleStart = () => {
    onStart({
      mode: activeTab,
      tripType,
      fromCity,
      travelers,
    });
  };

  return (
    <section className={cn('py-16', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* Booking card with background image */}
          <Card className="relative overflow-hidden rounded-2xl shadow-xl w-full p-10">
            {/* Background Image */}
            <div className="absolute inset-0">
              <div
                className="bg-center bg-cover bg-no-repeat h-full w-full"
                style={{ backgroundImage: `url(${backgroundUrl})` }}
              />
              {/* Dark gradient overlay */}
              <div className="absolute bg-gradient-to-r from-black/60 via-black/40 to-black/20 inset-0" />
            </div>

            {/* Card content */}
            <CardHeader className="pb-4 relative z-10 text-white">
              <div className="text-left mb-6">
                <h1 className="font-bold leading-tight mb-4 text-3xl sm:text-4xl lg:text-5xl tracking-wide">
                  {activeTab === 'reservar'
                    ? 'LA EMOCIÓN DE UN VIAJE SORPRESA'
                    : 'REGALA UN VIAJE COMPLETO'}
                </h1>
                <p className="font-light leading-relaxed  text-lg">
                  {activeTab === 'reservar'
                    ? 'Más de 250K viajeros ya confiaron en nosotros. ¿Te unes?'
                    : 'Compra un viaje sorpresa para otra persona'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 ">
              {/* Tabs */}
              <Tabs
                defaultValue="reservar"
                onValueChange={(value: string) =>
                  setActiveTab(value as 'reservar' | 'regalar')
                }
                value={activeTab}
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger
                    className="flex gap-2 items-center"
                    value="reservar"
                  >
                    <Calendar className="h-4 w-4" />
                    RESERVAR
                  </TabsTrigger>
                  <TabsTrigger
                    className="flex gap-2 items-center"
                    value="regalar"
                  >
                    <Gift className="h-4 w-4" />
                    REGALAR
                  </TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-4" value="reservar">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end bg-white/95 backdrop-blur-sm p-10 rounded-2xl">
                    <div className="flex flex-1 flex-col gap-4 md:flex-row">
                      {/* Trip Type */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="trip-type"
                        >
                          Tipo de viaje sorpresa
                        </label>
                        <Select
                          onValueChange={(value) =>
                            setTripType(value as TripType)
                          }
                          value={tripType}
                        >
                          <SelectTrigger
                            className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md shadow-sm transition-all w-full"
                            id="trip-type"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tripTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* From City */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="from-city"
                        >
                          Desde
                        </label>
                        <Popover
                          onOpenChange={setCityPopoverOpen}
                          open={cityPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              aria-expanded={cityPopoverOpen}
                              className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md justify-between shadow-sm transition-all w-full"
                              id="from-city"
                              variant="outline"
                            >
                              <span className="flex gap-2 items-center">
                                <MapPin className="h-4 w-4" />
                                {selectedCity?.label || 'Selecciona ciudad'}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="p-0 w-[300px]"
                          >
                            <Command>
                              <CommandInput placeholder="Buscar ciudad..." />
                              <CommandList>
                                <CommandEmpty>
                                  No se encontraron ciudades.
                                </CommandEmpty>
                                <CommandGroup>
                                  {cities.map((city) => (
                                    <CommandItem
                                      key={city.code}
                                      onSelect={() => {
                                        setFromCity(city.code);
                                        setCityPopoverOpen(false);
                                      }}
                                    >
                                      <MapPin className="h-4 mr-2 w-4" />
                                      <span>{city.label}</span>
                                      {city.country && (
                                        <span className="ml-2 text-gray-500">
                                          ({city.country})
                                        </span>
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Travelers */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="travelers"
                        >
                          ¿Cuántos sois?
                        </label>
                        <Select
                          onValueChange={(value) =>
                            setTravelers(parseInt(value) as TravelersOption)
                          }
                          value={travelers.toString()}
                        >
                          <SelectTrigger
                            className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md shadow-sm transition-all w-full"
                            id="travelers"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {travelersOptions.map((count) => (
                              <SelectItem key={count} value={count.toString()}>
                                <span className="flex gap-2 items-center">
                                  <Users className="h-4 w-4" />
                                  {getTravelersLabel(count)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="bg-pink-500 duration-200 font-medium hover:bg-pink-600 hover:shadow-xl px-8 py-4 shadow-lg text-white tracking-wide transition-all w-full md:w-auto"
                      disabled={isSubmitting}
                      onClick={handleStart}
                    >
                      {isSubmitting ? 'Procesando...' : 'Empezar'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-4" value="regalar">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end bg-white/95 backdrop-blur-sm p-10 rounded-2xl">
                    <div className="flex flex-1 flex-col gap-4 md:flex-row">
                      {/* Trip Type */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="gift-trip-type"
                        >
                          Tipo de regalo
                        </label>
                        <Select
                          onValueChange={(value) =>
                            setTripType(value as TripType)
                          }
                          value={tripType}
                        >
                          <SelectTrigger
                            className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md shadow-sm transition-all w-full"
                            id="gift-trip-type"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tripTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* From City */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="gift-from-city"
                        >
                          Desde
                        </label>
                        <Popover
                          onOpenChange={setCityPopoverOpen}
                          open={cityPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              aria-expanded={cityPopoverOpen}
                              className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md justify-between shadow-sm transition-all w-full"
                              id="gift-from-city"
                              variant="outline"
                            >
                              <span className="flex gap-2 items-center">
                                <MapPin className="h-4 w-4" />
                                {selectedCity?.label || 'Selecciona ciudad'}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="p-0 w-[300px]"
                          >
                            <Command>
                              <CommandInput placeholder="Buscar ciudad..." />
                              <CommandList>
                                <CommandEmpty>
                                  No se encontraron ciudades.
                                </CommandEmpty>
                                <CommandGroup>
                                  {cities.map((city) => (
                                    <CommandItem
                                      key={city.code}
                                      onSelect={() => {
                                        setFromCity(city.code);
                                        setCityPopoverOpen(false);
                                      }}
                                    >
                                      <MapPin className="h-4 mr-2 w-4" />
                                      <span>{city.label}</span>
                                      {city.country && (
                                        <span className="ml-2 text-gray-500">
                                          ({city.country})
                                        </span>
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Travelers */}
                      <div className="space-y-2 md:w-1/3">
                        <label
                          className="block font-medium text-gray-700 text-sm tracking-wide"
                          htmlFor="gift-travelers"
                        >
                          Número de viajeros
                        </label>
                        <Select
                          onValueChange={(value) =>
                            setTravelers(parseInt(value) as TravelersOption)
                          }
                          value={travelers.toString()}
                        >
                          <SelectTrigger
                            className="border-gray-200 duration-200 font-light focus:border-black hover:border-gray-300 hover:shadow-md shadow-sm transition-all w-full"
                            id="gift-travelers"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {travelersOptions.map((count) => (
                              <SelectItem key={count} value={count.toString()}>
                                <span className="flex gap-2 items-center">
                                  <Users className="h-4 w-4" />
                                  {getTravelersLabel(count)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="bg-pink-500 duration-200 font-medium hover:bg-pink-600 hover:shadow-xl px-8 py-4 shadow-lg text-white tracking-wide transition-all w-full md:w-auto"
                      disabled={isSubmitting}
                      onClick={handleStart}
                    >
                      {isSubmitting ? 'Procesando...' : 'Regalar'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
