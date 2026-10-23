import React from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";

interface Props {
  uri: string;
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 256,
    borderRadius: 16,
    marginBottom: 20,
  },
});

/**
 * Renders a fixed-height story banner image for article pages.
 *
 * @param root0 - Banner image props.
 * @param root0.uri - Image URI to render.
 * @returns The article banner image.
 */
export function ArticleBannerImage({ uri }: Props) {
  return <Image source={{ uri }} contentFit="cover" style={styles.image} />;
}
