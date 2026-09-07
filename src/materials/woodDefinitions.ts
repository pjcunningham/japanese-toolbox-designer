export interface WoodDefinition {
  id: string;
  name: string;
  description: string;
  displayColour: string;
  roughness: number;
}

export const DEFAULT_WOOD_ID = 'pine';
export const CUSTOM_WOOD_ID = 'custom';

/**
 * Illustrative disclaimer:
 * Material colours and roughness are approximate visual representations for design identification,
 * not calibrated colour samples of timber. Actual timber appearance varies by individual board,
 * age, finish, lighting, heartwood/sapwood balance, and screen calibration.
 */
export const MATERIAL_DISCLAIMER =
  'Approximate visual representation for design identification, not a calibrated colour sample of the timber.';

export const WOOD_DEFINITIONS: readonly WoodDefinition[] = Object.freeze([
  {
    id: 'hinoki',
    name: 'Hinoki / Japanese Cypress',
    description:
      'Light, fine-grained sacred softwood with a pale cream tone and soft satin luster.',
    displayColour: '#f0e5cb',
    roughness: 0.72,
  },
  {
    id: 'japanese-cedar',
    name: 'Japanese Cedar (Sugi)',
    description:
      'Warm reddish-tan softwood traditionally prized for fragrant, lightweight storage chests.',
    displayColour: '#bd7351',
    roughness: 0.76,
  },
  {
    id: 'pine',
    name: 'Pine',
    description: 'Light yellow-tan traditional utility softwood with balanced grain.',
    displayColour: '#d2a775',
    roughness: 0.75,
  },
  {
    id: 'douglas-fir',
    name: 'Douglas Fir',
    description: 'Warm orange-brown straight-grained structural timber with distinct figure.',
    displayColour: '#c47d48',
    roughness: 0.7,
  },
  {
    id: 'paulownia',
    name: 'Paulownia (Kiri)',
    description:
      'Extremely lightweight, pale silvery-tan timber traditionally used for fine heirloom storage boxes.',
    displayColour: '#dfd5c2',
    roughness: 0.82,
  },
  {
    id: 'ash',
    name: 'Ash',
    description: 'Pale beige, resilient and tough hardwood with pronounced open grain.',
    displayColour: '#dcd0b8',
    roughness: 0.68,
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Medium golden-brown dense hardwood offering high strength and durability.',
    displayColour: '#9c6d44',
    roughness: 0.72,
  },
  {
    id: 'beech',
    name: 'Beech',
    description: 'Light warm pink-tan hardwood with a close, uniform texture.',
    displayColour: '#c89980',
    roughness: 0.7,
  },
  {
    id: 'custom',
    name: 'Other / Custom',
    description: 'Neutral medium-light timber tone for custom or unlisted wood species.',
    displayColour: '#c2a688',
    roughness: 0.75,
  },
]);

/**
 * Returns all available built-in wood definitions.
 */
export function getWoodDefinitions(): readonly WoodDefinition[] {
  return WOOD_DEFINITIONS;
}

/**
 * Retrieves a WoodDefinition by ID. If not found, falls back safely to 'custom' (or default definition)
 * without crashing or throwing.
 */
export function getWoodDefinition(id: string): WoodDefinition {
  const match = WOOD_DEFINITIONS.find((wood) => wood.id === id);
  if (match) {
    return match;
  }
  const customFallback = WOOD_DEFINITIONS.find((wood) => wood.id === CUSTOM_WOOD_ID);
  if (customFallback) {
    return customFallback;
  }
  return WOOD_DEFINITIONS[0]!;
}
