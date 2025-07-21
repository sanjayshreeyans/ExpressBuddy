/**
 * Accessibility utilities for Emotion Detective Learning
 * Provides keyboard navigation, screen reader support, and accessibility features
 */

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
}

export interface KeyboardNavigationConfig {
  enableArrowKeys: boolean;
  enableTabNavigation: boolean;
  enableEnterActivation: boolean;
  enableEscapeClose: boolean;
  focusTrapping: boolean;
}

/**
 * Detect user accessibility preferences
 */
export function detectAccessibilityPreferences(): AccessibilityPreferences {
  const preferences: AccessibilityPreferences = {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderEnabled: false,
    keyboardNavigation: false
  };

  // Check for reduced motion preference
  if (window.matchMedia) {
    preferences.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    preferences.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
  }

  // Check for screen reader (basic detection)
  preferences.screenReaderEnabled = !!(
    navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|ChromeVox/i) ||
    window.speechSynthesis ||
    document.querySelector('[aria-live]')
  );

  // Check for keyboard navigation preference (if user has used tab recently)
  preferences.keyboardNavigation = document.body.classList.contains('keyboard-navigation') ||
    localStorage.getItem('keyboard-navigation') === 'true';

  return preferences;
}

/**
 * Apply accessibility preferences to the document
 */
export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  const root = document.documentElement;

  // Apply reduced motion
  if (preferences.reduceMotion) {
    root.style.setProperty('--animation-duration', '0.01ms');
    root.style.setProperty('--transition-duration', '0.01ms');
    document.body.classList.add('reduce-motion');
  } else {
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
    document.body.classList.remove('reduce-motion');
  }

  // Apply high contrast
  if (preferences.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }

  // Apply large text
  if (preferences.largeText) {
    document.body.classList.add('large-text');
  } else {
    document.body.classList.remove('large-text');
  }

  // Apply keyboard navigation
  if (preferences.keyboardNavigation) {
    document.body.classList.add('keyboard-navigation');
    localStorage.setItem('keyboard-navigation', 'true');
  } else {
    document.body.classList.remove('keyboard-navigation');
    localStorage.removeItem('keyboard-navigation');
  }
}

/**
 * Create ARIA live region for announcements
 */
export function createLiveRegion(id: string = 'aria-live-region'): HTMLElement {
  let liveRegion = document.getElementById(id);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }
  
  return liveRegion;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = createLiveRegion();
  liveRegion.setAttribute('aria-live', priority);
  
  // Clear previous message
  liveRegion.textContent = '';
  
  // Add new message after a brief delay to ensure it's announced
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
  
  // Clear message after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 3000);
}

/**
 * Generate unique ID for accessibility
 */
export function generateAccessibilityId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create keyboard navigation handler
 */
export function createKeyboardNavigationHandler(
  elements: HTMLElement[],
  config: KeyboardNavigationConfig = {
    enableArrowKeys: true,
    enableTabNavigation: true,
    enableEnterActivation: true,
    enableEscapeClose: false,
    focusTrapping: false
  }
) {
  let currentIndex = 0;

  const focusElement = (index: number) => {
    if (elements[index]) {
      elements[index].focus();
      currentIndex = index;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const { key, shiftKey } = event;

    // Arrow key navigation
    if (config.enableArrowKeys) {
      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % elements.length;
          focusElement(nextIndex);
          break;
        
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
          focusElement(prevIndex);
          break;
      }
    }

    // Tab navigation with focus trapping
    if (config.focusTrapping && key === 'Tab') {
      event.preventDefault();
      if (shiftKey) {
        const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
        focusElement(prevIndex);
      } else {
        const nextIndex = (currentIndex + 1) % elements.length;
        focusElement(nextIndex);
      }
    }

    // Enter activation
    if (config.enableEnterActivation && (key === 'Enter' || key === ' ')) {
      const currentElement = elements[currentIndex];
      if (currentElement && (currentElement.tagName === 'BUTTON' || currentElement.getAttribute('role') === 'button')) {
        event.preventDefault();
        currentElement.click();
      }
    }

    // Escape close
    if (config.enableEscapeClose && key === 'Escape') {
      event.preventDefault();
      // Trigger escape event
      const escapeEvent = new CustomEvent('accessibility-escape');
      document.dispatchEvent(escapeEvent);
    }
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Make element focusable and accessible
 */
export function makeElementAccessible(
  element: HTMLElement,
  options: {
    role?: string;
    label?: string;
    description?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    tabIndex?: number;
  } = {}
): void {
  const {
    role,
    label,
    description,
    expanded,
    selected,
    disabled,
    tabIndex = 0
  } = options;

  // Set role
  if (role) {
    element.setAttribute('role', role);
  }

  // Set accessible name
  if (label) {
    element.setAttribute('aria-label', label);
  }

  // Set description
  if (description) {
    const descId = generateAccessibilityId('desc');
    const descElement = document.createElement('span');
    descElement.id = descId;
    descElement.textContent = description;
    descElement.style.position = 'absolute';
    descElement.style.left = '-10000px';
    element.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
  }

  // Set states
  if (expanded !== undefined) {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  if (selected !== undefined) {
    element.setAttribute('aria-selected', selected.toString());
  }

  if (disabled !== undefined) {
    element.setAttribute('aria-disabled', disabled.toString());
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    }
  }

  // Set tab index
  if (!disabled && tabIndex !== undefined) {
    element.setAttribute('tabindex', tabIndex.toString());
  }
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  
  // Style skip link
  Object.assign(skipLink.style, {
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: '#000',
    color: '#fff',
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: '1000',
    transition: 'top 0.3s'
  });

  // Show on focus
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private focusStack: HTMLElement[] = [];
  private trapContainer: HTMLElement | null = null;

  /**
   * Save current focus and set new focus
   */
  saveFocus(newFocus?: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }

    if (newFocus) {
      setTimeout(() => newFocus.focus(), 0);
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      setTimeout(() => previousFocus.focus(), 0);
    }
  }

  /**
   * Trap focus within container
   */
  trapFocus(container: HTMLElement): void {
    this.trapContainer = container;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    // Store cleanup function
    (container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    if (this.trapContainer) {
      const cleanup = (this.trapContainer as any)._focusTrapCleanup;
      if (cleanup) {
        cleanup();
      }
      this.trapContainer = null;
    }
  }
}

/**
 * Color contrast utilities
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      const val = parseInt(c) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
}

// Global focus manager instance
export const focusManager = new FocusManager();