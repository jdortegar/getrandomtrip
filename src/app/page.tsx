import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle,
  Star,
  Users,
  Sparkles,
  Compass,
  ArrowRight,
  ChevronRight,
  Mail,
  Zap,
  Palmtree,
  Building2,
  Camera,
  Hotel,
  Globe2,
  Route,
  Eye,
  Globe,
  Calendar,
  Plane,
  Crown,
  Award,
  Trophy,
  Gift,
  MapPin,
  Bed,
  DollarSign,
  Heart,
  Phone,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section - Black Tomato Luxury Style */}
      <section className="relative pt-20 min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury travel landscape"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left text-white">
              <div className="flex items-center mb-4">
                <Sparkles className="h-6 w-6 text-yellow-400 mr-2" />
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  Expertos en Viajes de Lujo
                </Badge>
              </div>
              <h1 className="text-6xl lg:text-7xl font-light mb-8 leading-tight tracking-wide font-roboto">
                Pon El Mundo
                <br />
                <span className="font-normal">En Tus Manos</span>
              </h1>
              <p className="text-xl text-gray-200 mb-12 font-light leading-relaxed max-w-lg font-roboto">
                El mundo es vasto, lleno de maravillas. Pero la información nos
                abruma. Ve esto, haz aquello, no te pierdas esto. Parece que
                cuanto más opciones hay, más abrumados nos sentimos.
              </p>
              <div className="flex space-x-4">
                <Button className="bg-white text-black px-8 py-4 font-light tracking-wide hover:bg-gray-100 transition-all duration-200 font-roboto shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300">
                  <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                  Inspírame
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white px-8 py-4 font-light tracking-wide hover:bg-white hover:text-black transition-all duration-200 font-roboto shadow-lg hover:shadow-xl border-2"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ponte en Contacto
                </Button>
              </div>
            </div>

            <div className="relative">
              <Card className="max-w-md mx-auto shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-light text-gray-900 tracking-wide font-roboto flex items-center gap-2">
                    <Compass className="h-5 w-5 text-yellow-500" />
                    Comienza tu Viaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide font-roboto flex items-center gap-1">
                      <Users className="h-4 w-4 text-yellow-500" />
                      Por Viajero
                    </label>
                    <Select>
                      <SelectTrigger className="font-light border-gray-200 hover:border-gray-300 focus:border-black transition-all duration-200 shadow-sm hover:shadow-md w-full">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">👨‍👩‍👧‍👦 Familia</SelectItem>
                        <SelectItem value="couples">💑 Parejas</SelectItem>
                        <SelectItem value="groups">👥 Grupos</SelectItem>
                        <SelectItem value="honeymoon">
                          💕 Luna de Miel
                        </SelectItem>
                        <SelectItem value="solo">🧳 Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide font-roboto flex items-center gap-1">
                      <Globe className="h-4 w-4 text-yellow-500" />
                      Más Popular
                    </label>
                    <Select>
                      <SelectTrigger className="font-light border-gray-200 hover:border-gray-300 focus:border-black transition-all duration-200 shadow-sm hover:shadow-md w-full">
                        <SelectValue placeholder="Selecciona destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="italy">🇮🇹 Italia</SelectItem>
                        <SelectItem value="morocco">🇲🇦 Marruecos</SelectItem>
                        <SelectItem value="india">🇮🇳 India</SelectItem>
                        <SelectItem value="japan">🇯🇵 Japón</SelectItem>
                        <SelectItem value="iceland">🇮🇸 Islandia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide font-roboto flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-yellow-500" />
                      Por Mes
                    </label>
                    <Select>
                      <SelectTrigger className="font-light border-gray-200 hover:border-gray-300 focus:border-black transition-all duration-200 shadow-sm hover:shadow-md w-full">
                        <SelectValue placeholder="Selecciona mes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">❄️ Enero</SelectItem>
                        <SelectItem value="february">🌹 Febrero</SelectItem>
                        <SelectItem value="march">🌸 Marzo</SelectItem>
                        <SelectItem value="april">🌷 Abril</SelectItem>
                        <SelectItem value="may">🌺 Mayo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full bg-black text-white py-4 font-light tracking-wide hover:bg-gray-800 transition-all duration-200 font-roboto shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                    <Plane className="h-4 w-4 mr-2" />
                    Llévame Allí
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The luxury travel experts Section - Black Tomato Style */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-5xl font-light text-gray-900 mb-8 tracking-wide font-roboto">
                Los expertos en viajes de lujo
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed font-roboto">
              El mundo es vasto, lleno de maravillas. Pero la información nos
              abruma. Ve esto, haz aquello, no te pierdas esto. Parece que
              cuanto más opciones hay, más abrumados nos sentimos. Además, nunca
              te preguntan
              <em>cómo quieres sentirte</em>. De hecho, raramente te preguntan
              algo. Ese no somos nosotros.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <p className="text-lg text-gray-700 font-light leading-relaxed mb-8 font-roboto">
                Somos personas. Personas que valoran la conexión humana y
                prosperan conectándote con nuestro vasto mundo. Una empresa de
                personas reconocidas por planificar experiencias de viaje
                notables y lujosas.
              </p>
              <p className="text-lg text-gray-700 font-light leading-relaxed mb-8 font-roboto">
                Así que comencemos. Hagamos algo notable.
              </p>
              <Button className="bg-black text-white px-8 py-4 font-light tracking-wide hover:bg-gray-800 transition-all duration-200 font-roboto shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ponte en Contacto
              </Button>
            </div>

            <div className="relative h-96 rounded-lg overflow-hidden bg-gray-200">
              <Image
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                alt="Luxury travel experience"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Black Tomato Style */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;Sin duda fue la experiencia más increíble que nuestra
                  familia ha vivido&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Brett, Oriente Medio
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;Hemos explorado lugares increíbles y tenido aventuras
                  únicas que solo hubieran sido posibles con la guía de
                  GetRandomTrip&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Ike y Alexa, Italia
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;Maravilloso, maravilloso, maravilloso. GetRandomTrip es
                  de primera clase – no te decepcionarás&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Wendy, Marruecos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;GetRandomTrip entregó una experiencia única en la vida
                  que mi familia y yo atesoraremos para siempre&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Adrienne, Italia
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;GetRandomTrip cambiará la forma en que viajas&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Micah, Egipto
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700 mb-4 font-light leading-relaxed font-roboto italic">
                  &ldquo;Glamping, senderismo, icebergs, comida gourmet. No
                  estoy seguro de cómo mi viaje podría haber sido mejor&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-light font-roboto">
                  Jimmy, Groenlandia
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Awards Section - Black Tomato Style */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-light text-gray-900 mb-8 tracking-wide font-roboto">
              Viajes de lujo galardonados
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Award className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-sm text-gray-600 font-light font-roboto">
                UNO DE NUESTROS EXPERTOS EN VIAJES VOTADO COMO MAESTRO DE VIAJES
                DE ROBB REPORT EN 2024
              </p>
            </div>

            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-sm text-gray-600 font-light font-roboto">
                TOP 10 OPERADOR TURÍSTICO EN LOS PREMIOS MUNDIALES DE TRAVEL +
                LEISURE 2024
              </p>
            </div>

            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-sm text-gray-600 font-light font-roboto">
                TOP 3 MEJORES ESPECIALISTAS EN VIAJES EN LOS PREMIOS DE LECTORES
                DE CONDÉ NAST TRAVELLER
              </p>
            </div>

            <div className="text-center">
              <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-sm text-gray-600 font-light font-roboto">
                GALARDONADO POR LOS MEJORES ITINERARIOS A MEDIDA EN LOS PREMIOS
                DE VIAJES DE MEN&apos;S JOURNAL 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Types Section - Waynabox Structure with Black Tomato Style */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
              Otros viajes GetRandomTrip
            </h2>
            <h3 className="text-2xl font-light text-gray-700 mb-8 tracking-wide font-roboto">
              Descubre todos los viajes sorpresa
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <Palmtree className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                  <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                    Isla sorpresa
                  </h4>
                  <p className="text-gray-600 font-light font-roboto mb-6">
                    Descubre las mejores islas donde perderte
                  </p>
                  <ChevronRight className="h-6 w-6 text-gray-400 mx-auto group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                  <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                    Sorpresa en Europa
                  </h4>
                  <p className="text-gray-600 font-light font-roboto mb-6">
                    Descubre tu destino 2 días antes de viajar
                  </p>
                  <ChevronRight className="h-6 w-6 text-gray-400 mx-auto group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <Globe2 className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                  <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                    Sorpresa en América
                  </h4>
                  <p className="text-gray-600 font-light font-roboto mb-6">
                    Las mejores ciudades al otro lado del Atlántico
                  </p>
                  <ChevronRight className="h-6 w-6 text-gray-400 mx-auto group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <Gift className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                  <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                    Regala GetRandomTrip
                  </h4>
                  <p className="text-gray-600 font-light font-roboto mb-6">
                    Caducidad ilimitada
                  </p>
                  <ChevronRight className="h-6 w-6 text-gray-400 mx-auto group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="font-light tracking-wide font-roboto border-2 border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Ver todos los viajes <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section - Waynabox Structure with Black Tomato Style */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
              Paso a paso
            </h2>
            <h3 className="text-2xl font-light text-gray-700 mb-8 tracking-wide font-roboto">
              ¿Cómo funciona GetRandomTrip?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-10">
                <div className="text-6xl mb-8 font-light text-gray-300">1</div>
                <Compass className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-2xl font-light text-gray-900 mb-6 tracking-wide font-roboto">
                  Elige una experiencia
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Elige la aventura sorpresa que prefieras. Viaje en avión o en
                  coche… ¡tú decides!
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-10">
                <div className="text-6xl mb-8 font-light text-gray-300">2</div>
                <Calendar className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-2xl font-light text-gray-900 mb-6 tracking-wide font-roboto">
                  Personaliza tu reserva
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Selecciona las fechas y elige los detalles de tu experiencia.
                  ¡La emoción está garantizada desde el primer momento!
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-10">
                <div className="text-6xl mb-8 font-light text-gray-300">3</div>
                <Eye className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-2xl font-light text-gray-900 mb-6 tracking-wide font-roboto">
                  ¡Sorpresa!
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Descubrirás tu aventura 48h antes de viajar!
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="font-light tracking-wide font-roboto border-2 border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Saber más <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* What to Expect Section - Waynabox Structure with Black Tomato Style */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
              ¿QUÉ ESPERAR DE UN VIAJE GETRANDOMTRIP?
            </h2>
            <h3 className="text-2xl font-light text-gray-700 mb-8 tracking-wide font-roboto">
              Emoción, sorpresa y diversión
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-8">
                <MapPin className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                  Destinos únicos
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Siempre volarás sin escalas a destinos especiales. Puedes
                  descartar los que no te interesan y evitar repetir si ya
                  viajaste con nosotros.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-8">
                <Bed className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                  Alojamiento de calidad
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Dormirás en hoteles, apartamentos o casas rurales con buena
                  ubicación, comunicación y valoración en TripAdvisor.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-8">
                <DollarSign className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                  Precios imbatibles
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Al no revelar el destino, podemos negociar condiciones
                  especiales con alojamientos y proveedores.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <CardContent className="p-8">
                <MessageCircle className="h-16 w-16 mx-auto mb-6 text-yellow-500" />
                <h4 className="text-xl font-light text-gray-900 mb-4 tracking-wide font-roboto">
                  Atención personalizada
                </h4>
                <p className="text-gray-600 font-light font-roboto leading-relaxed">
                  Nuestro equipo de Atención al Cliente resolverá todas tus
                  dudas antes, durante y después del viaje.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button className="bg-black text-white px-8 py-4 font-light tracking-wide hover:bg-gray-800 transition-all duration-200 font-roboto shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
              <Sparkles className="h-4 w-4 mr-2" />
              Empezar
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Black Tomato Style */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light mb-6 tracking-wide font-roboto">
            Pon el mundo en tu palma
          </h2>
          <p className="text-xl mb-10 font-light leading-relaxed font-roboto opacity-90">
            Suscríbete a la inspiración semanal curada por nuestros Expertos en
            Viajes – directamente a tu bandeja de entrada, directamente desde el
            mundo de GetRandomTrip.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu dirección de email"
              className="flex-1 px-6 py-4 rounded-none text-gray-900 font-light font-roboto border-0 focus:ring-2 focus:ring-white focus:outline-none shadow-sm hover:shadow-md transition-all duration-200 bg-white/90 backdrop-blur-sm w-full"
            />
            <Button className="bg-white text-black px-8 py-4 font-light tracking-wide hover:bg-gray-100 transition-all duration-200 font-roboto rounded-none shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
              <Mail className="h-4 w-4 mr-2" />
              Suscribirse
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics Section - Black Tomato Style */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-5xl font-light mb-4 font-roboto">
                220.603
              </div>
              <p className="text-gray-300 font-light font-roboto uppercase tracking-wide flex items-center justify-center gap-2">
                <Hotel className="h-4 w-4 text-yellow-500" />
                noches de hotel
              </p>
            </div>
            <div>
              <div className="text-5xl font-light mb-4 font-roboto">
                832.765
              </div>
              <p className="text-gray-300 font-light font-roboto uppercase tracking-wide flex items-center justify-center gap-2">
                <Plane className="h-4 w-4 text-yellow-500" />
                horas de vuelo
              </p>
            </div>
            <div>
              <div className="text-5xl font-light mb-4 font-roboto">90.877</div>
              <p className="text-gray-300 font-light font-roboto uppercase tracking-wide flex items-center justify-center gap-2">
                <Camera className="h-4 w-4 text-yellow-500" />
                selfies viajeros
              </p>
            </div>
            <div>
              <div className="text-5xl font-light mb-4 font-roboto">
                45.802.794
              </div>
              <p className="text-gray-300 font-light font-roboto uppercase tracking-wide flex items-center justify-center gap-2">
                <Route className="h-4 w-4 text-yellow-500" />
                km recorridos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Black Tomato Style */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light mb-8 tracking-wide font-roboto">
            ¿Entonces, listo para empezar?
          </h2>
          <Button className="bg-black text-white px-12 py-6 font-light tracking-wide hover:bg-gray-800 transition-all duration-200 font-roboto text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
            <Heart className="h-5 w-5 mr-2" />
            Ponte en Contacto
          </Button>
        </div>
      </section>

      {/* Footer - Black Tomato Style */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-xl font-light mb-6 tracking-wide font-roboto flex items-center gap-2">
                <Globe className="h-5 w-5 text-yellow-500" />
                GetRandomTrip
              </h3>
              <ul className="space-y-3 text-gray-400 font-light font-roboto">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4 text-yellow-500" />
                    Habla con un Experto
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-yellow-500" />
                    Consultas de Medios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-yellow-500" />
                    Ponte en Contacto
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-light mb-6 tracking-wide font-roboto">
                Información Útil
              </h4>
              <ul className="space-y-3 text-gray-400 font-light font-roboto">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Condiciones de reserva
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carreras
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-light mb-6 tracking-wide font-roboto">
                Destinos populares
              </h4>
              <ul className="space-y-3 text-gray-400 font-light font-roboto">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Italia
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Marruecos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Japón
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Islandia
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Perú
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-light mb-6 tracking-wide font-roboto">
                Quién
              </h4>
              <ul className="space-y-3 text-gray-400 font-light font-roboto">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Parejas
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Familia
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Grupo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Lunas de Miel
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Individual
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400 font-light font-roboto">
            <p className="mb-2">
              Albert House, 256-260 Old Street, London EC1V 9DD
            </p>
            <p className="mb-4 flex items-center justify-center gap-2">
              <Phone className="h-4 w-4 text-yellow-500" />
              +34 688 862 945
            </p>
            <p className="text-sm">
              © 2025 GetRandomTrip. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
