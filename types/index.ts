export type Event = {
  id: string;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  description: string;
  accessCode: string;
  programs: Program[];
};

export type Program = {
  id: string;
  eventId: string;
  date: Date;
  activities: Activity[];
  photos: Photo[]; // ✅ Adicione esta linha
};

export type Activity = {
  id: string;
  programId: string;
  time: string;
  title: string;
  description?: string;
  photos: Photo[];
};

export type Photo = {
  id: string;
  activityId: string;
  uri: string;
  publicId: string;
  timestamp: Date;
};

export type FormValues = {
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  description: string;
  accessCode: string;
};
