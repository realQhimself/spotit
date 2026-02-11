import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import Button from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          )}
          <View style={styles.action}>
            <Button title="Retry" onPress={this.handleRetry} size="sm" />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    backgroundColor: colors.background,
  },
  emoji: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 16,
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: 'center',
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  debug: {
    marginTop: 12,
    fontSize: 12,
    color: colors.danger,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  action: {
    marginTop: 24,
  },
});
