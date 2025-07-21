/**
 * React hooks for accessibility features in Emotion Detective Learning
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  AccessibilityPreferences,
  KeyboardNavigationConfig,
  detectAccessibilityPreferences,
  applyAccessibilityPreferences,
  announceToScreenReader,
  createKeyboardNavigationHandler,
  focusManager
} from '../utils/accessibility';

/**
 * Hook for managing accessibility preferences
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => 
    detectAccessibilityPreferences()
  );

  useEffect(() => {
    // Apply preferences on mount and when they change
    applyAccessibilityPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    // Listen for media query changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    const handleMediaChange = () => {
      setPreferences(detectAccessibilityPreferences());
    };

    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleMediaChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleMediaChange);
      }
    });

    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleMediaChange);
        } else {
          mq.removeListener(handleMediaChange);
        }
      });
    };
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  return {
    preferences,
    updatePreferences,
    isReducedMotion: preferences.reduceMotion,
    isHighContrast: preferences.highContrast,
    isLargeText: preferences.largeText,
    isScreenReaderEnabled: preferences.screenReaderEnabled,
    isKeyboardNavigation: preferences.keyboardNavigation
  };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    announceToScreenReader(message, priority);
  }, []);

  const announceError = useCallback((message: string) => {
    announceToScreenReader(`Error: ${message}`, 'assertive');
  }, []);

  const announceSuccess = useCallback((message: string) => {
    announceToScreenReader(`Success: ${message}`, 'polite');
  }, []);

  const announceProgress = useCallback((message: string) => {
    announceToScreenReader(message, 'polite');
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceProgress
  };
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  config: KeyboardNavigationConfig = {
    enableArrowKeys: true,
    enableTabNavigation: true,
    enableEnterActivation: true,
    enableEscapeClose: false,
    focusTrapping: false
  }
) {
  const elementsRef = useRef<HTMLElement[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const registerElements = useCallback((elements: HTMLElement[]) => {
    elementsRef.current = elements;
    
    // Clean up previous handler
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Create new handler
    if (elements.length > 0) {
      cleanupRef.current = createKeyboardNavigationHandler(elements, config);
    }
  }, [config]);

  const addElement = useCallback((element: HTMLElement) => {
    if (!elementsRef.current.includes(element)) {
      elementsRef.current.push(element);
      registerElements(elementsRef.current);
    }
  }, [registerElements]);

  const removeElement = useCallback((element: HTMLElement) => {
    const index = elementsRef.current.indexOf(element);
    if (index > -1) {
      elementsRef.current.splice(index, 1);
      registerElements(elementsRef.current);
    }
  }, [registerElements]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    registerElements,
    addElement,
    removeElement
  };
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const saveFocus = useCallback((newFocus?: HTMLElement) => {
    focusManager.saveFocus(newFocus);
  }, []);

  const restoreFocus = useCallback(() => {
    focusManager.restoreFocus();
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    focusManager.trapFocus(container);
  }, []);

  const releaseFocusTrap = useCallback(() => {
    focusManager.releaseFocusTrap();
  }, []);

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
    releaseFocusTrap
  };
}

/**
 * Hook for accessible button/interactive element
 */
export function useAccessibleElement(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    role?: string;
    label?: string;
    description?: string;
    onActivate?: () => void;
    disabled?: boolean;
  } = {}
) {
  const { role, label, description, onActivate, disabled } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set ARIA attributes
    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    if (disabled !== undefined) {
      element.setAttribute('aria-disabled', disabled.toString());
      element.setAttribute('tabindex', disabled ? '-1' : '0');
    }

    // Add description if provided
    if (description) {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      const descElement = document.createElement('span');
      descElement.id = descId;
      descElement.textContent = description;
      descElement.style.position = 'absolute';
      descElement.style.left = '-10000px';
      element.appendChild(descElement);
      element.setAttribute('aria-describedby', descId);
    }

    // Handle keyboard activation
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && onActivate && !disabled) {
        event.preventDefault();
        onActivate();
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [role, label, description, onActivate, disabled]);

  return {
    'aria-label': label,
    'aria-disabled': disabled,
    'role': role,
    'tabIndex': disabled ? -1 : 0
  };
}

/**
 * Hook for accessible form field
 */
export function useAccessibleFormField(
  fieldId: string,
  options: {
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
  } = {}
) {
  const { label, description, error, required } = options;
  const labelId = `${fieldId}-label`;
  const descId = `${fieldId}-desc`;
  const errorId = `${fieldId}-error`;

  const fieldProps = {
    id: fieldId,
    'aria-labelledby': label ? labelId : undefined,
    'aria-describedby': [
      description ? descId : null,
      error ? errorId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-required': required,
    'required': required
  };

  const labelProps = {
    id: labelId,
    htmlFor: fieldId
  };

  const descriptionProps = {
    id: descId
  };

  const errorProps = {
    id: errorId,
    role: 'alert',
    'aria-live': 'polite' as const
  };

  return {
    fieldProps,
    labelProps,
    descriptionProps,
    errorProps
  };
}

/**
 * Hook for accessible modal/dialog
 */
export function useAccessibleModal(
  isOpen: boolean,
  options: {
    title?: string;
    description?: string;
    onClose?: () => void;
    closeOnEscape?: boolean;
    trapFocus?: boolean;
  } = {}
) {
  const modalRef = useRef<HTMLElement>(null);
  const { title, description, onClose, closeOnEscape = true, trapFocus = true } = options;
  const { saveFocus, restoreFocus, trapFocus: trapFocusInModal, releaseFocusTrap } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // Save current focus and trap focus in modal
      saveFocus();
      
      if (trapFocus && modalRef.current) {
        trapFocusInModal(modalRef.current);
      }

      // Handle escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape && onClose) {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        if (trapFocus) {
          releaseFocusTrap();
        }
        restoreFocus();
      };
    }
  }, [isOpen, closeOnEscape, onClose, trapFocus, saveFocus, restoreFocus, trapFocusInModal, releaseFocusTrap]);

  const modalProps = {
    ref: modalRef,
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': title ? `modal-title-${Math.random().toString(36).substr(2, 9)}` : undefined,
    'aria-describedby': description ? `modal-desc-${Math.random().toString(36).substr(2, 9)}` : undefined
  };

  return {
    modalRef,
    modalProps
  };
}

/**
 * Hook for accessible progress indicator
 */
export function useAccessibleProgress(
  value: number,
  max: number = 100,
  options: {
    label?: string;
    announceChanges?: boolean;
    announceThreshold?: number;
  } = {}
) {
  const { label, announceChanges = false, announceThreshold = 10 } = options;
  const { announce } = useScreenReader();
  const lastAnnouncedRef = useRef<number>(0);

  const percentage = Math.round((value / max) * 100);

  useEffect(() => {
    if (announceChanges && Math.abs(percentage - lastAnnouncedRef.current) >= announceThreshold) {
      announce(`Progress: ${percentage}%`);
      lastAnnouncedRef.current = percentage;
    }
  }, [percentage, announceChanges, announceThreshold, announce]);

  const progressProps = {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': `${percentage}%`,
    'aria-label': label
  };

  return {
    progressProps,
    percentage
  };
}

/**
 * Hook for accessible live region
 */
export function useLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((newMessage: string, duration: number = 3000) => {
    setMessage(newMessage);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear message after duration
    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const liveRegionProps = {
    'aria-live': priority,
    'aria-atomic': true,
    style: {
      position: 'absolute' as const,
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden' as const
    }
  };

  return {
    announce,
    message,
    liveRegionProps
  };
}