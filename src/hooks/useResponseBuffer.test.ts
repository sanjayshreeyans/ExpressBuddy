import { renderHook, act } from '@testing-library/react';
import { useResponseBuffer } from '../hooks/useResponseBuffer';

describe('useResponseBuffer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with empty buffer', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    expect(result.current.buffer.chunks).toEqual([]);
    expect(result.current.buffer.isComplete).toBe(false);
    expect(result.current.buffer.completeText).toBe('');
    expect(result.current.accumulatedText).toBe('');
  });

  test('should add text chunks', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello ');
    });
    
    expect(result.current.buffer.chunks).toEqual(['Hello ']);
    expect(result.current.accumulatedText).toBe('Hello');
    expect(result.current.buffer.isComplete).toBe(false);
  });

  test('should accumulate multiple chunks', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello ');
      result.current.addChunk('world ');
      result.current.addChunk('from ');
      result.current.addChunk('ExpressBuddy!');
    });
    
    expect(result.current.buffer.chunks).toEqual(['Hello ', 'world ', 'from ', 'ExpressBuddy!']);
    expect(result.current.accumulatedText).toBe('Hello world from ExpressBuddy!');
    expect(result.current.buffer.isComplete).toBe(false);
  });

  test('should auto-complete after timeout', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello world!');
    });
    
    expect(result.current.buffer.isComplete).toBe(false);
    
    // Fast-forward time to trigger auto-completion
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(result.current.buffer.isComplete).toBe(true);
    expect(result.current.buffer.completeText).toBe('Hello world!');
  });

  test('should manually mark complete', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello world!');
      result.current.markComplete();
    });
    
    expect(result.current.buffer.isComplete).toBe(true);
    expect(result.current.buffer.completeText).toBe('Hello world!');
  });

  test('should reset buffer', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello world!');
      result.current.markComplete();
    });
    
    expect(result.current.buffer.isComplete).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.buffer.chunks).toEqual([]);
    expect(result.current.buffer.isComplete).toBe(false);
    expect(result.current.buffer.completeText).toBe('');
    expect(result.current.accumulatedText).toBe('');
  });

  test('should ignore empty chunks', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('');
      result.current.addChunk('   ');
      result.current.addChunk('Hello');
    });
    
    expect(result.current.buffer.chunks).toEqual(['Hello']);
    expect(result.current.accumulatedText).toBe('Hello');
  });

  test('should handle rapid chunks without auto-completing', () => {
    const { result } = renderHook(() => useResponseBuffer());
    
    act(() => {
      result.current.addChunk('Hello ');
    });
    
    // Advance time less than timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    act(() => {
      result.current.addChunk('world!');
    });
    
    // Should still not be complete even after original timeout would have passed
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    expect(result.current.buffer.isComplete).toBe(false);
    
    // Now advance enough time for new timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(result.current.buffer.isComplete).toBe(true);
    expect(result.current.buffer.completeText).toBe('Hello world!');
  });
});
