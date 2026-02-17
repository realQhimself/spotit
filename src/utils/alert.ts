import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length <= 1) {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons?.[0]?.onPress?.();
    } else if (buttons.length === 2) {
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      if (result) {
        actionBtn?.onPress?.();
      } else {
        cancelBtn?.onPress?.();
      }
    } else {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons.find((b) => b.style !== 'cancel')?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
