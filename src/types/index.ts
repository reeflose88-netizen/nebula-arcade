export type GameGenre = 'Arcade' | 'Puzzle' | 'Adventure' | 'Strategy' | 'Creative';

export interface GameEntity {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'capsule';
  position: [number, number, number];
  scale: number;
  color: string;
  material: {
    metalness: number;
    roughness: number;
    transmission: number;
    thickness: number;
  };
  emissive: {
    color: string;
    intensity: number;
  };
}

export interface GameConfig {
  physics: {
    gravity: number;
    friction: number;
    bounce: number;
  };
  player: GameEntity & {
    speed: number;
    jumpStrength: number;
  };
  entities: GameEntity[];
  environment: {
    ambientLight: number;
    skyColor: string;
    groundColor: string;
    particleDensity: number;
    fogDensity: number;
  };
  vfx: {
    bloom: {
      threshold: number;
      strength: number;
      radius: number;
    };
    chromaticAberration: number;
    exposure: number;
    distortion: {
      speed: number;
      scale: number;
      strength: number;
    };
  };
  objective: string;
}

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  genre: GameGenre;
  thumbnailUrl: string;
  creatorId: string;
  creatorName: string;
  likes: number;
  plays: number;
  createdAt: number;
  config: GameConfig;
}
