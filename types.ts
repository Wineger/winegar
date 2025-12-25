
export interface TreeElementProps {
  isFormed: boolean;
  gestureX: number;
  gestureY: number;
  userPhotos?: string[];
}

export interface OrnamentData {
  type: 'ball' | 'gift' | 'light';
  color: string;
  weight: number;
  chaosPos: [number, number, number];
  targetPos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}
