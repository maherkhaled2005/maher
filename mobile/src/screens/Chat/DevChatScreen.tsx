// mobile/src/screens/Chat/DevChatScreen.tsx
import React from 'react';
import ChatScreen from './ChatScreen';

export default function DevChatScreen(props: any) {
  const mergedRoute = {
    ...props.route,
    params: {
      chatId: 'dev_team',
      userName: 'شات فريق التطوير والبرمجة 💻',
      isOnline: true,
      phone: '',
      isGroup: true,
      ...(props.route?.params || {}),
    },
  };
  return <ChatScreen {...props} route={mergedRoute} />;
}
