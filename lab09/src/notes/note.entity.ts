export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  userId: number; // owner ID
}
