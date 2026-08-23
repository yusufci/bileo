/**
 * Bileo Bespoke SVG Icon Design System
 * 100% Zero-dependency, artisanal vector icon library tailored for multimodal transit.
 */

export * from './types';
export * from './BileoIcons';
export * from './BileoTransportIcons';

// Semantic convenience aliases for transport modalities
export {
  BileoBusIcon as BileoBus,
  BileoPlaneIcon as BileoPlane,
  BileoPlaneIcon as BileoFlight,
  BileoPlaneIcon as BileoFlightIcon,
  BileoTrainIcon as BileoTrain,
  BileoFerryIcon as BileoFerry,
  BileoMaleIcon as BileoMale,
  BileoFemaleIcon as BileoFemale,
  BileoCheckIcon as BileoCheckMark,
} from './BileoTransportIcons';
