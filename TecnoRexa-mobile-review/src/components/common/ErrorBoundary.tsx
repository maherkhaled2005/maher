// ========================================
// ErrorBoundary - catches render errors
// ========================================
import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          <Text style={styles.message}>{this.state.message}</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={styles.button}
          >
            <Text style={styles.buttonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "900" },
  message: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#D4AF37",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#000", fontWeight: "800" },
});
