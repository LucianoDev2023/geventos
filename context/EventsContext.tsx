import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Event, Program, Activity, Photo } from '@/types';
import { Alert } from 'react-native';
import { db, storage } from '@/config/firebase';
import CryptoJS from 'crypto-js';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from '@env';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { uploadImageToCloudinary } from '@/app/lib/uploadImageToCloudinary';

// Initial state
type EventsState = {
  events: Event[];
  loading: boolean;
  error: string | null;
};

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
};

// Action types
type EventsAction =
  | { type: 'FETCH_EVENTS_START' }
  | { type: 'FETCH_EVENTS_SUCCESS'; payload: Event[] }
  | { type: 'FETCH_EVENTS_ERROR'; payload: string }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_PROGRAM'; payload: Program }
  | { type: 'UPDATE_PROGRAM'; payload: Program }
  | { type: 'DELETE_PROGRAM'; payload: { eventId: string; programId: string } }
  | {
      type: 'ADD_ACTIVITY';
      payload: { eventId: string; programId: string; activity: Activity };
    }
  | {
      type: 'UPDATE_ACTIVITY';
      payload: { eventId: string; programId: string; activity: Activity };
    }
  | {
      type: 'DELETE_ACTIVITY';
      payload: { eventId: string; programId: string; activityId: string };
    }
  | {
      type: 'ADD_PHOTO';
      payload: { eventId: string; programId: string; photo: Photo };
    }
  | {
      type: 'DELETE_PHOTO';
      payload: {
        eventId: string;
        programId: string;
        activityId: string;
        photoId: string;
      };
    };

const eventsReducer = (
  state: EventsState,
  action: EventsAction
): EventsState => {
  switch (action.type) {
    case 'FETCH_EVENTS_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_EVENTS_SUCCESS':
      return { ...state, events: action.payload, loading: false };

    case 'FETCH_EVENTS_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? action.payload : event
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.payload),
      };

    case 'ADD_PROGRAM':
    case 'UPDATE_PROGRAM':
    case 'DELETE_PROGRAM':
    case 'ADD_ACTIVITY':
    case 'UPDATE_ACTIVITY':
    case 'DELETE_ACTIVITY':
    case 'ADD_PHOTO':
    case 'DELETE_PHOTO':
      // These actions will trigger a full refresh from Firebase
      return state;

    default:
      return state;
  }
};

type EventsContextType = {
  state: EventsState;
  addEvent: (event: Omit<Event, 'id' | 'programs'>) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addProgram: (eventId: string, date: Date) => Promise<void>;
  updateProgram: (program: Program) => Promise<void>;
  deleteProgram: (eventId: string, programId: string) => Promise<void>;
  addActivity: (
    eventId: string,
    programId: string,
    activity: Omit<Activity, 'id'>
  ) => Promise<void>;
  updateActivity: (
    eventId: string,
    programId: string,
    activity: Activity
  ) => Promise<void>;
  deleteActivity: (
    eventId: string,
    programId: string,
    activityId: string
  ) => Promise<void>;
  addPhoto: (
    eventId: string,
    programId: string,
    activityId: string,
    publicId: string,
    uri: string
  ) => Promise<void>;

  deletePhoto: (
    eventId: string,
    programId: string,
    activityId: string,
    photoId: string,
    publicId: string
  ) => Promise<void>;
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(eventsReducer, initialState);

  // Fetch events from Firebase
  const fetchEvents = async () => {
    dispatch({ type: 'FETCH_EVENTS_START' });
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);

      const events: Event[] = [];
      for (const doc of querySnapshot.docs) {
        const eventData = doc.data();

        // Fetch programs for this event
        const programsRef = collection(db, 'programs');
        const programsQuery = query(
          programsRef,
          where('eventId', '==', doc.id)
        );
        const programsSnapshot = await getDocs(programsQuery);

        const programs: Program[] = [];
        for (const programDoc of programsSnapshot.docs) {
          const programData = programDoc.data();

          // Fetch activities for this program
          const activitiesRef = collection(db, 'activities');
          const activitiesQuery = query(
            activitiesRef,
            where('programId', '==', programDoc.id)
          );
          const activitiesSnapshot = await getDocs(activitiesQuery);

          const activities = activitiesSnapshot.docs.map((activityDoc) => ({
            id: activityDoc.id,
            ...activityDoc.data(),
          })) as Activity[];

          // Fetch photos for this program
          const photosRef = collection(db, 'photos');
          const photosQuery = query(
            photosRef,
            where('programId', '==', programDoc.id)
          );
          const photosSnapshot = await getDocs(photosQuery);

          const photos = photosSnapshot.docs.map((photoDoc) => ({
            id: photoDoc.id,
            ...photoDoc.data(),
          })) as Photo[];

          programs.push({
            id: programDoc.id,
            date: programData.date.toDate(),
            eventId: doc.id,
            activities,
            photos,
          });
        }

        events.push({
          id: doc.id,
          title: eventData.title,
          location: eventData.location,
          startDate: eventData.startDate.toDate(),
          endDate: eventData.endDate.toDate(),
          description: eventData.description,
          accessCode: eventData.accessCode,
          programs,
        });
      }

      dispatch({ type: 'FETCH_EVENTS_SUCCESS', payload: events });
    } catch (error) {
      console.error('Error fetching events:', error);
      dispatch({
        type: 'FETCH_EVENTS_ERROR',
        payload: 'Failed to fetch events',
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (eventData: Omit<Event, 'id' | 'programs'>) => {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        accessCode: eventData.accessCode,
        createdAt: Timestamp.now(),
      });

      const newEvent: Event = {
        id: docRef.id,
        ...eventData,
        accessCode: eventData.accessCode,
        programs: [],
      };

      dispatch({ type: 'ADD_EVENT', payload: newEvent });
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (event: Event) => {
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        title: event.title,
        location: event.location,
        startDate: Timestamp.fromDate(event.startDate),
        endDate: Timestamp.fromDate(event.endDate),
        description: event.description,
        accessCode: event.accessCode,
        updatedAt: Timestamp.now(),
      });

      dispatch({ type: 'UPDATE_EVENT', payload: event });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // Delete all related data first
      const event = state.events.find((e) => e.id === eventId);
      if (event) {
        for (const program of event.programs) {
          await deleteProgram(eventId, program.id);
        }
      }

      await deleteDoc(doc(db, 'events', eventId));
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const addProgram = async (eventId: string, date: Date) => {
    try {
      const docRef = await addDoc(collection(db, 'programs'), {
        eventId,
        date: Timestamp.fromDate(date),
        createdAt: Timestamp.now(),
      });

      const newProgram: Program = {
        id: docRef.id,
        eventId,
        date,
        activities: [],
        photos: [],
      };

      dispatch({ type: 'ADD_PROGRAM', payload: newProgram });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error adding program:', error);
      throw error;
    }
  };

  const updateProgram = async (program: Program) => {
    try {
      const programRef = doc(db, 'programs', program.id);
      await updateDoc(programRef, {
        date: Timestamp.fromDate(program.date),
        updatedAt: Timestamp.now(),
      });

      dispatch({ type: 'UPDATE_PROGRAM', payload: program });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  };

  const deleteProgram = async (eventId: string, programId: string) => {
    try {
      const program = state.events
        .find((e) => e.id === eventId)
        ?.programs.find((p) => p.id === programId);

      if (program) {
        // Delete all activities
        for (const activity of program.activities) {
          await deleteActivity(eventId, programId, activity.id);
        }

        // Delete all photos
        for (const photo of program.photos) {
          await deletePhoto(
            eventId,
            programId,
            photo.activityId,
            photo.id,
            photo.publicId
          );
        }
      }

      await deleteDoc(doc(db, 'programs', programId));
      dispatch({ type: 'DELETE_PROGRAM', payload: { eventId, programId } });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  };

  const addActivity = async (
    eventId: string,
    programId: string,
    activityData: Omit<Activity, 'id'>
  ) => {
    try {
      const docRef = await addDoc(collection(db, 'activities'), {
        ...activityData,
        programId,
        createdAt: Timestamp.now(),
      });

      const newActivity: Activity = {
        id: docRef.id,
        ...activityData,
        programId,
      };

      dispatch({
        type: 'ADD_ACTIVITY',
        payload: { eventId, programId, activity: newActivity },
      });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  };

  const updateActivity = async (
    eventId: string,
    programId: string,
    activity: Activity
  ) => {
    try {
      const activityRef = doc(db, 'activities', activity.id);
      await updateDoc(activityRef, {
        time: activity.time,
        title: activity.title,
        description: activity.description,
        updatedAt: Timestamp.now(),
      });

      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: { eventId, programId, activity },
      });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const deleteActivity = async (
    eventId: string,
    programId: string,
    activityId: string
  ) => {
    try {
      await deleteDoc(doc(db, 'activities', activityId));
      dispatch({
        type: 'DELETE_ACTIVITY',
        payload: { eventId, programId, activityId },
      });
      await fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  };

  const addPhoto = async (
    eventId: string,
    programId: string,
    activityId: string,
    publicId: string,
    uri: string
  ) => {
    try {
      const result = await uploadImageToCloudinary(uri); // { uri, publicId }

      const docRef = await addDoc(collection(db, 'photos'), {
        programId,
        activityId,
        uri: result.uri,
        publicId: result.publicId,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      const newPhoto: Photo = {
        id: docRef.id,
        activityId,
        uri: result.uri,
        publicId: result.publicId,
        timestamp: new Date(),
      };

      dispatch({
        type: 'ADD_PHOTO',
        payload: { eventId, programId, photo: newPhoto },
      });

      await fetchEvents();
    } catch (error) {
      console.error('Erro ao adicionar foto:', error);
      throw error;
    }
  };

  // Função para deletar a foto
  const deletePhoto = async (
    eventId: string,
    programId: string,
    activityId: string,
    photoId: string,
    publicId: string
  ) => {
    try {
      console.log('Deletando imagem com publicId:', publicId);

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = CryptoJS.SHA1(
        `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
      ).toString();

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      console.log(formData);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );
      console.log(response);
      const result = await response.json();
      console.log('Resposta do Cloudinary:', result);

      if (result.result !== 'ok') {
        throw new Error('Erro ao deletar imagem do Cloudinary');
      }

      await deleteDoc(doc(db, 'photos', photoId));

      dispatch({
        type: 'DELETE_PHOTO',
        payload: { eventId, programId, activityId, photoId },
      });

      console.log({
        publicId,
        api_key: CLOUDINARY_API_KEY,
        cloud_name: CLOUDINARY_CLOUD_NAME,
        timestamp,
        signature,
      });

      await fetchEvents();
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      throw error;
    }
  };

  return (
    <EventsContext.Provider
      value={{
        state,
        addEvent,
        updateEvent,
        deleteEvent,
        addProgram,
        updateProgram,
        deleteProgram,
        addActivity,
        updateActivity,
        deleteActivity,
        addPhoto,
        deletePhoto,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
