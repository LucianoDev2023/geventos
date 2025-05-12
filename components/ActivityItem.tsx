import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import Card from './ui/Card';
import {
  Clock,
  Edit,
  Image as ImageIcon,
  PencilIcon,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Activity, Photo } from '@/types';
import { router } from 'expo-router';

interface ActivityItemProps {
  activity: Activity;
  eventId: string;
  programId: string;
  photos: Photo[];
}

export default function ActivityItem({
  activity,
  eventId,
  programId,
  photos,
}: ActivityItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleEditActivity = (e: GestureResponderEvent) => {
    e.stopPropagation();
    router.push(
      `/(stack)/events/${eventId}/program/${programId}/edit-activity/${activity.id}`
    );
  };

  const handleAddPhoto = (e: GestureResponderEvent) => {
    e.stopPropagation();
    router.push(
      `/(stack)/events/${eventId}/program/${programId}/activity/${activity.id}/add-photo`
    );
  };

  const handleOpenPhotos = () => {
    router.push({
      pathname:
        '/(stack)/events/[id]/program/[programId]/activity/[activityId]/photos',
      params: {
        id: eventId,
        programId,
        activityId: activity.id,
      },
    });
  };

  return (
    <Pressable
      onPress={handleOpenPhotos}
      android_ripple={{ color: colors.primary, borderless: false }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.time, { color: colors.primary }]}>
              {activity.time}
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <Pressable onPress={handleAddPhoto} style={styles.actionButton}>
              <ImageIcon size={22} color={colors.textSecondary} />
            </Pressable>

            <Pressable onPress={handleEditActivity} style={styles.actionButton}>
              <Edit size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {activity.title}
        </Text>

        {activity.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {activity.description}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
