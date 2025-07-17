/**
 * Utility to download face-api.js models to public/models directory
 * This should be run once to set up the models for emotion detection
 */

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const REQUIRED_MODELS = [
    // Tiny Face Detector
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',

    // Face Expression Recognition
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1',

    // Face Landmarks 68
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1'
];

export interface ModelDownloadProgress {
    fileName: string;
    downloaded: number;
    total: number;
    isComplete: boolean;
    error?: string;
}

export async function downloadFaceApiModels(
    onProgress?: (progress: ModelDownloadProgress) => void
): Promise<void> {
    console.log('Starting face-api.js models download...');

    for (let i = 0; i < REQUIRED_MODELS.length; i++) {
        const fileName = REQUIRED_MODELS[i];
        const url = `${MODEL_BASE_URL}/${fileName}`;

        try {
            onProgress?.({
                fileName,
                downloaded: i,
                total: REQUIRED_MODELS.length,
                isComplete: false
            });

            console.log(`Downloading ${fileName}...`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to download ${fileName}: ${response.statusText}`);
            }

            const blob = await response.blob();

            // Create download link and trigger download
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            console.log(`Downloaded ${fileName} successfully`);

        } catch (error) {
            const errorMessage = `Failed to download ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMessage);

            onProgress?.({
                fileName,
                downloaded: i,
                total: REQUIRED_MODELS.length,
                isComplete: false,
                error: errorMessage
            });

            throw new Error(errorMessage);
        }
    }

    onProgress?.({
        fileName: 'All models',
        downloaded: REQUIRED_MODELS.length,
        total: REQUIRED_MODELS.length,
        isComplete: true
    });

    console.log('All face-api.js models downloaded successfully!');
    console.log('Please move the downloaded files to the public/models directory');
}

/**
 * Check if all required models are available
 */
export async function checkModelsAvailability(): Promise<{
    allAvailable: boolean;
    missingModels: string[];
}> {
    const missingModels: string[] = [];

    for (const modelFile of REQUIRED_MODELS) {
        try {
            const response = await fetch(`/models/${modelFile}`, { method: 'HEAD' });
            if (!response.ok) {
                missingModels.push(modelFile);
            }
        } catch (error) {
            missingModels.push(modelFile);
        }
    }

    return {
        allAvailable: missingModels.length === 0,
        missingModels
    };
}