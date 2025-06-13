import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';

export default function PhotoAccessScreen() {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [localUris, setLocalUris] = useState<Record<string, string>>({});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const PAGE_SIZE = 50;

  const askPermissionAndLoad = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    if (granted) {
      await loadPhotos(); // only load if permission is granted
    }
  };

  const loadPhotos = useCallback(
    async (after: string | null = null) => {
      if (!hasNextPage && after) return;

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: PAGE_SIZE,
        after,
        sortBy: [['creationTime', false]],
      });

      setPhotos((prev) => [...prev, ...result.assets]);

      const uriMap: Record<string, string> = {};
      for (const asset of result.assets) {
        const info = await MediaLibrary.getAssetInfoAsync(asset.id);
        const validUri = info.localUri ?? asset.uri;
        if (validUri) {
          uriMap[asset.id] = validUri;
        }
      }
      setLocalUris((prev) => ({ ...prev, ...uriMap }));

      setEndCursor(result.endCursor || null);
      setHasNextPage(result.hasNextPage);
    },
    [hasNextPage]
  );

  useEffect(() => {
    askPermissionAndLoad();
  }, []);

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>No access to media library</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 8 }}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        onEndReached={() => loadPhotos(endCursor)}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const uri = localUris[item.id];
          if (!uri) return null;
          return (
            <Image
              source={{ uri }}
              style={{ width: 100, height: 100, margin: 4 }}
            />
          );
        }}
      />
    </View>
  );
}
