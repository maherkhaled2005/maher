import React from "react";
import { View, Text, Image } from "react-native";
import { colors } from "../../theme";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/**
 * Avatar that always shows the real uploaded photo.
 *
 * Uses the shared media URL resolver so customer-uploaded images render on
 * every device, and falls back to an emoji / initial only when the account
 * genuinely has no picture.
 */
export function AvatarView({
  uri,
  size = 44,
  borderColor = colors.border,
  fontSize,
}: {
  uri?: string | null;
  size?: number;
  borderColor?: string;
  fontSize?: number;
}) {
  const [failed, setFailed] = React.useState(false);
  const imgUrl = failed ? null : resolveMediaUrl(uri);
  const radius = size / 2;

  // A new value should get a fresh chance to load.
  React.useEffect(() => setFailed(false), [uri]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#1E1E1E",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor,
        overflow: "hidden",
      }}
    >
      {imgUrl ? (
        <Image
          source={{ uri: imgUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: fontSize ?? Math.round(size * 0.42) }}>
          {uri && uri.length <= 4 ? uri : "👤"}
        </Text>
      )}
    </View>
  );
}

export default AvatarView;
