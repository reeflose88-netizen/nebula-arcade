import { GameMetadata, GameConfig } from './types';

const DEFAULT_CONFIG: GameConfig = {
  physics: { gravity: 9.8, friction: 0.1, bounce: 0.5 },
  player: { 
    id: 'player',
    name: 'Hero',
    type: 'box',
    position: [0, 0, 0],
    scale: 1, 
    color: '#00ffff',
    material: { metalness: 0.5, roughness: 0.2, transmission: 0, thickness: 0 },
    emissive: { color: '#000000', intensity: 0 },
    speed: 10, 
    jumpStrength: 5
  },
  entities: [
    {
      id: 'companion',
      name: 'Companion Sphere',
      type: 'sphere',
      position: [3, 0, -2],
      scale: 0.8,
      color: '#ff00ff',
      material: { metalness: 0.8, roughness: 0.1, transmission: 0, thickness: 0 },
      emissive: { color: '#ff00ff', intensity: 1 }
    }
  ],
  environment: { 
    ambientLight: 0.5, skyColor: '#050505', groundColor: '#111111', 
    particleDensity: 1, fogDensity: 0.1 
  },
  vfx: { 
    bloom: { threshold: 1, strength: 0.5, radius: 0.5 }, 
    chromaticAberration: 0, exposure: 1,
    distortion: { speed: 0, scale: 0, strength: 0 }
  },
  objective: 'Explore the simulation'
};

export const MOCK_GAMES: GameMetadata[] = [
  {
    id: '1',
    title: 'Neon Drifter',
    description: 'High-speed synthwave racing through the grid. Avoid data leaks and reach the mainframe.',
    genre: 'Arcade',
    thumbnailUrl: 'https://picsum.photos/seed/neon/800/600',
    creatorId: 'user1',
    creatorName: 'CyberPunker',
    likes: 1240,
    plays: 45000,
    createdAt: Date.now() - 86400000,
    config: { ...DEFAULT_CONFIG, player: { ...DEFAULT_CONFIG.player, color: '#ff00ff' } }
  },
  {
    id: '2',
    title: 'Void Puzzle',
    description: 'A mind-bending logic game where you rearrange gravity to connect celestial cores.',
    genre: 'Puzzle',
    thumbnailUrl: 'https://picsum.photos/seed/void/800/600',
    creatorId: 'user2',
    creatorName: 'StarGazer',
    likes: 850,
    plays: 12000,
    createdAt: Date.now() - 172800000,
    config: { ...DEFAULT_CONFIG, environment: { ...DEFAULT_CONFIG.environment, skyColor: '#000022' } }
  },
  {
    id: '3',
    title: 'Nebula Quest',
    description: 'Explore vast nebulas, scavenge for dark matter, and upgrade your cosmic vessel.',
    genre: 'Adventure',
    thumbnailUrl: 'https://picsum.photos/seed/nebula-q/800/600',
    creatorId: 'user3',
    creatorName: 'AstroNomad',
    likes: 2100,
    plays: 89000,
    createdAt: Date.now() - 259200000,
    config: DEFAULT_CONFIG
  }
];
