import type { CountryCopy } from "./types";
import argentina from "./argentina";
import peru from "./peru";
import chile from "./chile";
import mexico from "./mexico";
import colombia from "./colombia";
import bolivia from "./bolivia";
import costaRica from "./costa-rica";
import venezuela from "./venezuela";
import elSalvador from "./el-salvador";
import canada from "./canada";
import usa from "./estados-unidos";
import belize from "./belice";
import guatemala from "./guatemala";
import honduras from "./honduras";
import nicaragua from "./nicaragua";
import panama from "./panama";
import brazil from "./brasil";
import ecuador from "./ecuador";
import guyana from "./guyana";
import paraguay from "./paraguay";
import suriname from "./surinam";
import antiguaAndBarbuda from "./antigua-barbuda";
import bahamas from "./bahamas";
import barbados from "./barbados";
import cuba from "./cuba";
import dominica from "./dominica";
import grenada from "./granada";
import haiti from "./haiti";
import jamaica from "./jamaica";
import dominicanRepublic from "./republica-dominicana";
import stKittsAndNevis from "./san-cristobal-nieves";
import stVincentAndTheGrenadines from "./san-vicente-granadinas";
import stLucia from "./santa-lucia";
import trinidadAndTobago from "./trinidad-tobago";
import puertoRico from "./puerto-rico";
import greenland from "./groenlandia";
import usVirginIslands from "./islas-virgenes-eeuu";
import caymanIslands from "./islas-caiman";
import turksAndCaicos from "./islas-turcas-caicos";
import aruba from "./aruba";
import frenchGuiana from "./guayana-francesa";
import martinique from "./martinique";

export const COUNTRIES: CountryCopy[] = [
    argentina,
    peru,
    chile,
    mexico,
    colombia,
    bolivia,
    costaRica,
    venezuela,
    elSalvador,
    canada,
    usa,
    belize,
    guatemala,
    honduras,
    nicaragua,
    panama,
    brazil,
    ecuador,
    guyana,
    paraguay,
    suriname,
    antiguaAndBarbuda,
    bahamas,
    barbados,
    cuba,
    dominica,
    grenada,
    haiti,
    jamaica,
    dominicanRepublic,
    stKittsAndNevis,
    stVincentAndTheGrenadines,
    stLucia,
    trinidadAndTobago,
    puertoRico,
    greenland,
    usVirginIslands,
    caymanIslands,
    turksAndCaicos,
    aruba,
    frenchGuiana,
    martinique
];

export const bySlug = (slug: string) => COUNTRIES.find(c => c.slug === slug);