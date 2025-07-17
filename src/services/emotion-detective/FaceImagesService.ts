import { FaceImageData, EmotionData, EMOTION_METADATA } from '../../types/emotion-detective';

class FaceImagesService {
  private faceImages: FaceImageData[] = [];
  private initialized = false;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private preloadPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Initialize the service by parsing face image filenames
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // In a real implementation, you would scan the /Faces directory
      // For now, we'll create a basic structure that can be expanded
      this.faceImages = await this.loadFaceImageData();
      this.initialized = true;
      console.log(`Loaded ${this.faceImages.length} face images`);
    } catch (error) {
      console.error('Failed to initialize face images service:', error);
      throw new Error('Failed to load face image data');
    }
  }

  /**
   * Parse face image filename to extract metadata
   * Format: ###_age_gender_emotion_variant.jpg
   * Example: 004_o_m_a_a.jpg (004 = id, o = old, m = male, a = angry, a = variant)
   */
  private parseFaceImageFilename(filename: string): FaceImageData | null {
    const match = filename.match(/^(\d{3})_([omy])_([mf])_([a-z])_([ab])\.jpg$/);

    if (!match) {
      return null;
    }

    const [, id, ageCode, genderCode, emotionCode, variantCode] = match;

    // Map codes to readable values
    const ageMap: Record<string, number> = { 'o': 25, 'm': 35, 'y': 45 };
    const genderMap: Record<string, 'male' | 'female'> = { 'm': 'male', 'f': 'female' };
    const emotionMap: Record<string, string> = {
      'a': 'angry',
      'd': 'disgusted', // 'd' represents disgust in this dataset
      'f': 'fearful',
      'h': 'happy',
      'n': 'neutral',
      's': 'sad' // 's' represents sadness in this dataset
    };

    const age = ageMap[ageCode] || 30;
    const gender = genderMap[genderCode] || 'male';
    const emotion = emotionMap[emotionCode] || 'neutral';
    const variant = variantCode === 'a' ? 1 : 2;

    return {
      id: `${id}_${emotion}_${variant}`,
      filename,
      age,
      gender,
      emotion,
      variant,
      path: `/Faces/${filename}`
    };
  }

  /**
   * Load face image data from all available face images
   */
  private async loadFaceImageData(): Promise<FaceImageData[]> {
    // All face images based on the actual files in the Faces directory
    const allFilenames = [
      '004_o_m_a_a.jpg', '004_o_m_a_b.jpg',
      '004_o_m_d_a.jpg', '004_o_m_d_b.jpg',
      '004_o_m_f_a.jpg', '004_o_m_f_b.jpg',
      '004_o_m_h_a.jpg', '004_o_m_h_b.jpg',
      '004_o_m_n_a.jpg', '004_o_m_n_b.jpg',
      '004_o_m_s_a.jpg', '004_o_m_s_b.jpg',
      '066_y_m_a_a.jpg', '066_y_m_a_b.jpg',
      '066_y_m_d_a.jpg', '066_y_m_d_b.jpg',
      '066_y_m_f_a.jpg', '066_y_m_f_b.jpg',
      '066_y_m_h_a.jpg', '066_y_m_h_b.jpg',
      '066_y_m_n_a.jpg', '066_y_m_n_b.jpg',
      '066_y_m_s_a.jpg', '066_y_m_s_b.jpg',
      '079_o_f_a_a.jpg', '079_o_f_a_b.jpg',
      '079_o_f_d_a.jpg', '079_o_f_d_b.jpg',
      '079_o_f_f_a.jpg', '079_o_f_f_b.jpg',
      '079_o_f_h_a.jpg', '079_o_f_h_b.jpg',
      '079_o_f_n_a.jpg', '079_o_f_n_b.jpg',
      '079_o_f_s_a.jpg', '079_o_f_s_b.jpg',
      '116_m_m_a_a.jpg', '116_m_m_a_b.jpg',
      '116_m_m_d_a.jpg', '116_m_m_d_b.jpg',
      '116_m_m_f_a.jpg', '116_m_m_f_b.jpg',
      '116_m_m_h_a.jpg', '116_m_m_h_b.jpg',
      '116_m_m_n_a.jpg', '116_m_m_n_b.jpg',
      '116_m_m_s_a.jpg', '116_m_m_s_b.jpg',
      '140_y_f_a_a.jpg', '140_y_f_a_b.jpg',
      '140_y_f_d_a.jpg', '140_y_f_d_b.jpg',
      '140_y_f_f_a.jpg', '140_y_f_f_b.jpg',
      '140_y_f_h_a.jpg', '140_y_f_h_b.jpg',
      '140_y_f_n_a.jpg', '140_y_f_n_b.jpg',
      '140_y_f_s_a.jpg', '140_y_f_s_b.jpg',
      '168_m_f_a_a.jpg', '168_m_f_a_b.jpg',
      '168_m_f_d_a.jpg', '168_m_f_d_b.jpg',
      '168_m_f_f_a.jpg', '168_m_f_f_b.jpg',
      '168_m_f_h_a.jpg', '168_m_f_h_b.jpg',
      '168_m_f_n_a.jpg', '168_m_f_n_b.jpg',
      '168_m_f_s_a.jpg', '168_m_f_s_b.jpg'
    ];

    const faceImages: FaceImageData[] = [];

    for (const filename of allFilenames) {
      const faceData = this.parseFaceImageFilename(filename);
      if (faceData) {
        faceImages.push(faceData);
      }
    }

    return faceImages;
  }

  /**
   * Get face images filtered by emotion
   */
  getFacesByEmotion(emotion: string): FaceImageData[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    return this.faceImages.filter(face => face.emotion === emotion);
  }

  /**
   * Get face images filtered by gender
   */
  getFacesByGender(gender: 'male' | 'female'): FaceImageData[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    return this.faceImages.filter(face => face.gender === gender);
  }

  /**
   * Get face images filtered by age range
   */
  getFacesByAgeRange(minAge: number, maxAge: number): FaceImageData[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    return this.faceImages.filter(face => face.age >= minAge && face.age <= maxAge);
  }

  /**
   * Get random face images for a specific emotion
   */
  getRandomFacesForEmotion(emotion: string, count: number = 1): FaceImageData[] {
    const faces = this.getFacesByEmotion(emotion);

    if (faces.length === 0) {
      return [];
    }

    // Shuffle and take requested count
    const shuffled = [...faces].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get random faces for multiple emotions (for multiple choice questions)
   */
  getRandomFacesForEmotions(emotions: string[]): FaceImageData[] {
    const faces: FaceImageData[] = [];

    for (const emotion of emotions) {
      const emotionFaces = this.getRandomFacesForEmotion(emotion, 1);
      faces.push(...emotionFaces);
    }

    return faces;
  }

  /**
   * Get all available emotions from loaded face images
   */
  getAvailableEmotions(): string[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const emotions = new Set(this.faceImages.map(face => face.emotion));
    return Array.from(emotions);
  }

  /**
   * Get emotion data with metadata
   */
  getEmotionData(emotion: string): EmotionData | null {
    if (!EMOTION_METADATA[emotion]) {
      return null;
    }

    const metadata = EMOTION_METADATA[emotion];
    const faceImages = this.getFacesByEmotion(emotion);

    return {
      id: emotion,
      name: emotion,
      difficulty: metadata.difficulty,
      description: metadata.description,
      scenarios: metadata.scenarios,
      faceImages
    };
  }

  /**
   * Preload a face image and cache it
   */
  async preloadImage(faceImage: FaceImageData): Promise<HTMLImageElement> {
    const { path } = faceImage;

    // Return cached image if available
    if (this.imageCache.has(path)) {
      return this.imageCache.get(path)!;
    }

    // Return existing promise if already loading
    if (this.preloadPromises.has(path)) {
      return this.preloadPromises.get(path)!;
    }

    // Create new preload promise
    const preloadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.imageCache.set(path, img);
        this.preloadPromises.delete(path);
        resolve(img);
      };

      img.onerror = () => {
        this.preloadPromises.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };

      img.src = path;
    });

    this.preloadPromises.set(path, preloadPromise);
    return preloadPromise;
  }

  /**
   * Preload multiple face images
   */
  async preloadImages(faceImages: FaceImageData[]): Promise<HTMLImageElement[]> {
    const preloadPromises = faceImages.map(face => this.preloadImage(face));

    try {
      return await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
      // Return successfully loaded images
      const results = await Promise.allSettled(preloadPromises);
      return results
        .filter((result): result is PromiseFulfilledResult<HTMLImageElement> =>
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    }
  }

  /**
   * Preload images for specific emotions
   */
  async preloadImagesForEmotions(emotions: string[]): Promise<void> {
    const facesToPreload: FaceImageData[] = [];

    for (const emotion of emotions) {
      const emotionFaces = this.getFacesByEmotion(emotion);
      facesToPreload.push(...emotionFaces);
    }

    await this.preloadImages(facesToPreload);
    console.log(`Preloaded ${facesToPreload.length} images for emotions: ${emotions.join(', ')}`);
  }

  /**
   * Preload images for a specific lesson level
   */
  async preloadImagesForLevel(level: number): Promise<void> {
    const { EMOTION_LEVELS } = await import('../../types/emotion-detective');
    const emotions = EMOTION_LEVELS[level as keyof typeof EMOTION_LEVELS] || [];

    if (emotions.length > 0) {
      await this.preloadImagesForEmotions([...emotions]); // Convert readonly array to mutable array
    }
  }

  /**
   * Get cached image if available
   */
  getCachedImage(path: string): HTMLImageElement | null {
    return this.imageCache.get(path) || null;
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
    this.preloadPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cached: number; loading: number; total: number } {
    return {
      cached: this.imageCache.size,
      loading: this.preloadPromises.size,
      total: this.faceImages.length
    };
  }

  /**
   * Get faces with combined filters
   */
  getFacesWithFilters(filters: {
    emotion?: string;
    gender?: 'male' | 'female';
    ageRange?: { min: number; max: number };
    excludeIds?: string[];
  }): FaceImageData[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    let filteredFaces = [...this.faceImages];

    if (filters.emotion) {
      filteredFaces = filteredFaces.filter(face => face.emotion === filters.emotion);
    }

    if (filters.gender) {
      filteredFaces = filteredFaces.filter(face => face.gender === filters.gender);
    }

    if (filters.ageRange) {
      filteredFaces = filteredFaces.filter(face =>
        face.age >= filters.ageRange!.min && face.age <= filters.ageRange!.max
      );
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      filteredFaces = filteredFaces.filter(face => !filters.excludeIds!.includes(face.id));
    }

    return filteredFaces;
  }

  /**
   * Get diverse face selection (different ages, genders) for an emotion
   */
  getDiverseFacesForEmotion(emotion: string, count: number = 4): FaceImageData[] {
    const faces = this.getFacesByEmotion(emotion);

    if (faces.length === 0) {
      return [];
    }

    // Group by gender and age for diversity
    const maleYoung = faces.filter(f => f.gender === 'male' && f.age <= 30);
    const maleOld = faces.filter(f => f.gender === 'male' && f.age > 30);
    const femaleYoung = faces.filter(f => f.gender === 'female' && f.age <= 30);
    const femaleOld = faces.filter(f => f.gender === 'female' && f.age > 30);

    const groups = [maleYoung, maleOld, femaleYoung, femaleOld].filter(group => group.length > 0);
    const selected: FaceImageData[] = [];

    // Try to get one from each group for diversity
    for (let i = 0; i < count && groups.length > 0; i++) {
      const groupIndex = i % groups.length;
      const group = groups[groupIndex];

      if (group.length > 0) {
        const randomIndex = Math.floor(Math.random() * group.length);
        const selectedFace = group.splice(randomIndex, 1)[0];
        selected.push(selectedFace);

        // Remove empty groups
        if (group.length === 0) {
          groups.splice(groupIndex, 1);
        }
      }
    }

    // If we still need more faces, add randomly from remaining
    if (selected.length < count) {
      const remaining = faces.filter(face => !selected.some(s => s.id === face.id));
      const shuffled = remaining.sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, count - selected.length));
    }

    return selected.slice(0, count);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default new FaceImagesService();