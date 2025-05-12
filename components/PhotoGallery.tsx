import React, { useState } from 'react';
import ImageViewing from 'react-native-image-viewing';
import { ThumbsUp, ThumbsDown, Trash2, Share2 } from 'lucide-react-native';

import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  Share,
} from 'react-native';
import { Photo } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface PhotoGalleryProps {
  photos: Photo[];
  eventId: string;
  programId: string;
  activityId: string;

  onDeletePhoto?: (
    eventId: string,
    programId: string,
    activityId: string,
    photoId: string,
    publicId: string
  ) => void;
  editable?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.9;
const ITEM_HEIGHT = ITEM_WIDTH * 0.6;

export default function PhotoGallery({
  photos,
  eventId,
  programId,
  activityId,

  onDeletePhoto,
  editable = false,
}: PhotoGalleryProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const borderColor = colorScheme === 'dark' ? '#333' : '#fff';

  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleOpenZoom = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerVisible(true);
  };

  const handleShare = async (uri: string) => {
    try {
      await Share.share({
        url: uri,
        message: 'Veja esta foto do evento!',
      });
    } catch (error) {
      console.error('Erro ao compartilhar imagem:', error);
    }
  };

  const [interactions, setInteractions] = useState<{
    [photoId: string]: { likes: number; dislikes: number };
  }>({});

  const handleLike = (photoId: string) => {
    setInteractions((prev) => ({
      ...prev,
      [photoId]: {
        likes: (prev[photoId]?.likes || 0) + 1,
        dislikes: prev[photoId]?.dislikes || 0,
      },
    }));
  };

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhuma foto registrada
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photos.map((photo, index) => (
        <Animated.View
          key={photo.id}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[styles.cardContainer, { borderColor }]}
        >
          <TouchableOpacity onPress={() => handleOpenZoom(index)}>
            <Image
              source={{ uri: photo.uri }}
              style={[styles.photo, { width: ITEM_WIDTH, height: ITEM_HEIGHT }]}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <View style={styles.actionWithCount}>
              <Text style={styles.countText}>
                {interactions[photo.id]?.likes || 0}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(photo.id)}
                activeOpacity={0.7}
              >
                <ThumbsUp size={18} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.iconWithTopMargin]}
              onPress={() => handleShare(photo.uri)}
              activeOpacity={0.7}
            >
              <Share2 size={18} color="white" />
            </TouchableOpacity>

            {editable && onDeletePhoto && (
              <TouchableOpacity
                style={[styles.actionButton, styles.iconWithTopMargin]}
                onPress={() =>
                  onDeletePhoto(
                    eventId,
                    programId,
                    activityId,
                    photo.id,
                    photo.publicId
                  )
                }
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      ))}

      <ImageViewing
        images={photos.map((p) => ({ uri: p.uri }))}
        imageIndex={currentImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
        backgroundColor="black"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 5,
  },
  cardContainer: {
    width: ITEM_WIDTH,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  photo: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 89, 92, 0.73)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  actionWithCount: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: '#ccc',
  },
  iconWithTopMargin: {
    marginTop: 20, // ou o valor que desejar
  },
});
