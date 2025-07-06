import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Text, ImageProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { r2Service } from '../../lib/r2-service';
import { log, trackError } from '../../lib/logger';

// Simple in-memory cache for signed URLs
const urlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface R2ImageProps extends Omit<ImageProps, 'source'> {
  url: string;
  fallback?: React.ReactNode;
  onError?: (error: any) => void;
  onLoad?: () => void;
}

export default function R2Image({
  url,
  fallback,
  onError,
  onLoad,
  style,
  ...props
}: R2ImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!url) {
        setLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(false);

      try {
        // Check cache first
        const cached = urlCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setSignedUrl(cached.url);
          setLoading(false);
          return;
        }

        // Check if it's already a signed URL or public URL
        if (url.includes('X-Amz-Algorithm') || url.includes('Signature')) {
          // Already a signed URL
          setSignedUrl(url);
          // Cache it
          urlCache.set(url, { url, timestamp: Date.now() });
        } else {
          // Extract key from URL and generate signed URL
          const key = r2Service.extractKeyFromUrl(url);
          if (key) {
            const signed = await r2Service.getSignedUrl(key);
            if (!abortController.signal.aborted) {
              setSignedUrl(signed);
              // Cache the signed URL
              urlCache.set(url, { url: signed, timestamp: Date.now() });
            }
          } else {
            // Fallback to original URL
            if (!abortController.signal.aborted) {
              setSignedUrl(url);
              urlCache.set(url, { url, timestamp: Date.now() });
            }
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(true);
          trackError(err as Error, 'R2Image', { url });
          onError?.(err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSignedUrl();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, onError]);

  if (loading) {
    return (
      <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
        <MaterialIcons name="image" size={48} color="#9CA3AF" />
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  if (error || !signedUrl) {
    return fallback || (
      <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
        <MaterialIcons name="broken-image" size={48} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 8 }}>Failed to load</Text>
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: signedUrl }}
      style={style}
      onError={(e) => {
        setError(true);
        onError?.(e);
      }}
      onLoad={() => {
        onLoad?.();
      }}
    />
  );
}
