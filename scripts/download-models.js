const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const REQUIRED_MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1'
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models...');
  
  for (let i = 0; i < REQUIRED_MODELS.length; i++) {
    const fileName = REQUIRED_MODELS[i];
    const url = `${MODEL_BASE_URL}/${fileName}`;
    const filePath = path.join(MODELS_DIR, fileName);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${fileName} already exists, skipping...`);
      continue;
    }
    
    try {
      console.log(`Downloading ${fileName}... (${i + 1}/${REQUIRED_MODELS.length})`);
      await downloadFile(url, filePath);
      console.log(`✓ Downloaded ${fileName}`);
    } catch (error) {
      console.error(`✗ Failed to download ${fileName}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All face-api.js models downloaded successfully!');
  console.log(`Models saved to: ${MODELS_DIR}`);
}

downloadModels().catch(console.error);