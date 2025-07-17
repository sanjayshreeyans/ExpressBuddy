# Face-API.js Models Directory

This directory should contain the face-api.js model files required for emotion detection:

## Required Models

1. **tiny_face_detector_model-weights_manifest.json** - Tiny face detector model
2. **tiny_face_detector_model-shard1** - Tiny face detector weights
3. **face_expression_model-weights_manifest.json** - Face expression recognition model  
4. **face_expression_model-shard1** - Face expression weights
5. **face_landmark_68_model-weights_manifest.json** - Face landmarks model
6. **face_landmark_68_model-shard1** - Face landmarks weights

## How to Download Models

You can download these models from the face-api.js repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Or use the face-api.js utility to download them programmatically.

## Usage

The EmotionDetectionService will load these models from this directory using:
```javascript
await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
await faceapi.nets.faceExpressionNet.loadFromUri('/models')
await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
```