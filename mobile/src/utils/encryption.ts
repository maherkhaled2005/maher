export const encryptMessage = async (text: string): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(unescape(encodeURIComponent(text)));
    }
    return text;
  } catch {
    return text;
  }
};

export const decryptMessage = async (encryptedText: string): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.atob) {
      return decodeURIComponent(escape(window.atob(encryptedText)));
    }
    return encryptedText;
  } catch {
    return encryptedText;
  }
};
