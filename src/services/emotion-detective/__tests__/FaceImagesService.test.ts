import FaceImagesService from '../FaceImagesService';
import { FaceImageData } from '../../../types/emotion-detective';

describe('FaceImagesService', () => {
  beforeAll(async () => {
    await FaceImagesService.initialize();
  });

  afterAll(() => {
    FaceImagesService.clearCache();
  });

  test('should initialize successfully', () => {
    expect(FaceImagesService.isInitialized()).toBe(true);
  });

  test('should parse face image filenames correctly', () => {
    const faces = FaceImagesService.getFacesByEmotion('happy');
    expect(faces.length).toBeGreaterThan(0);
    
    const firstFace = faces[0];
    expect(firstFace).toHaveProperty('id');
    expect(firstFace).toHaveProperty('filename');
    expect(firstFace).toHaveProperty('age');
    expect(firstFace).toHaveProperty('gender');
    expect(firstFace).toHaveProperty('emotion');
    expect(firstFace).toHaveProperty('variant');
    expect(firstFace).toHaveProperty('path');
    expect(firstFace.emotion).toBe('happy');
  });

  test('should filter faces by emotion', () => {
    const happyFaces = FaceImagesService.getFacesByEmotion('happy');
    const sadFaces = FaceImagesService.getFacesByEmotion('sad');
    
    expect(happyFaces.length).toBeGreaterThan(0);
    expect(sadFaces.length).toBeGreaterThan(0);
    expect(happyFaces.every(face => face.emotion === 'happy')).toBe(true);
    expect(sadFaces.every(face => face.emotion === 'sad')).toBe(true);
  });

  test('should filter faces by gender', () => {
    const maleFaces = FaceImagesService.getFacesByGender('male');
    const femaleFaces = FaceImagesService.getFacesByGender('female');
    
    expect(maleFaces.length).toBeGreaterThan(0);
    expect(femaleFaces.length).toBeGreaterThan(0);
    expect(maleFaces.every(face => face.gender === 'male')).toBe(true);
    expect(femaleFaces.every(face => face.gender === 'female')).toBe(true);
  });

  test('should get available emotions', () => {
    const emotions = FaceImagesService.getAvailableEmotions();
    expect(emotions).toContain('happy');
    expect(emotions).toContain('sad');
    expect(emotions).toContain('angry');
    expect(emotions).toContain('neutral');
    expect(emotions).toContain('disgusted');
    expect(emotions).toContain('fearful');
    expect(emotions.length).toBe(6); // Six basic facial expressions
  });

  test('should get random faces for emotion', () => {
    const randomFaces = FaceImagesService.getRandomFacesForEmotion('happy', 2);
    expect(randomFaces.length).toBeLessThanOrEqual(2);
    expect(randomFaces.every(face => face.emotion === 'happy')).toBe(true);
  });

  test('should get diverse faces for emotion', () => {
    const diverseFaces = FaceImagesService.getDiverseFacesForEmotion('happy', 4);
    expect(diverseFaces.length).toBeLessThanOrEqual(4);
    expect(diverseFaces.every(face => face.emotion === 'happy')).toBe(true);
    
    // Check for diversity (should have different genders/ages if available)
    const genders = new Set(diverseFaces.map(face => face.gender));
    const ages = new Set(diverseFaces.map(face => face.age));
    
    // Should have some diversity if enough faces available
    if (diverseFaces.length >= 2) {
      expect(genders.size + ages.size).toBeGreaterThan(1);
    }
  });

  test('should handle combined filters', () => {
    const filteredFaces = FaceImagesService.getFacesWithFilters({
      emotion: 'happy',
      gender: 'male'
    });
    
    expect(filteredFaces.every(face => 
      face.emotion === 'happy' && face.gender === 'male'
    )).toBe(true);
  });

  test('should get emotion data', () => {
    const emotionData = FaceImagesService.getEmotionData('happy');
    expect(emotionData).not.toBeNull();
    expect(emotionData?.name).toBe('happy');
    expect(emotionData?.faceImages.length).toBeGreaterThan(0);
  });
});