import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary, { LoadingError, EmptyState } from '../error-boundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text testID="success">Success</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('success')).toBeTruthy();
  });

  it('should render error UI when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <Text testID="custom-fallback">Custom Error</Text>;
    
    const { getByTestId } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-fallback')).toBeTruthy();
  });

  it('should reset error state when retry is pressed', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    fireEvent.press(getByText('Try Again'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show success after retry
    expect(getByText('Success')).toBeTruthy();
  });
});

describe('LoadingError', () => {
  it('should render error message', () => {
    const { getByText } = render(
      <LoadingError error="Network connection failed" />
    );

    expect(getByText('Failed to load')).toBeTruthy();
    expect(getByText('Network connection failed')).toBeTruthy();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    
    const { getByText } = render(
      <LoadingError 
        error="Network error" 
        onRetry={onRetry}
        retryText="Try Again"
      />
    );

    const retryButton = getByText('Try Again');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('should not render retry button when onRetry is not provided', () => {
    const { queryByText } = render(
      <LoadingError error="Network error" />
    );

    expect(queryByText('Retry')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('should render title and description', () => {
    const { getByText } = render(
      <EmptyState 
        title="No Items Found"
        description="There are no items to display"
      />
    );

    expect(getByText('No Items Found')).toBeTruthy();
    expect(getByText('There are no items to display')).toBeTruthy();
  });

  it('should render action button when provided', () => {
    const onPress = jest.fn();
    
    const { getByText } = render(
      <EmptyState 
        title="No Items"
        action={{
          label: "Add Item",
          onPress
        }}
      />
    );

    const actionButton = getByText('Add Item');
    expect(actionButton).toBeTruthy();

    fireEvent.press(actionButton);
    expect(onPress).toHaveBeenCalled();
  });

  it('should not render action button when not provided', () => {
    const { queryByText } = render(
      <EmptyState title="No Items" />
    );

    // Should not have any button text
    expect(queryByText('Add')).toBeNull();
  });

  it('should render without description', () => {
    const { getByText, queryByText } = render(
      <EmptyState title="Empty State" />
    );

    expect(getByText('Empty State')).toBeTruthy();
    // Should not crash without description
  });
});
