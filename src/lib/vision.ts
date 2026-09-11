import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isLoading = false;
let loadPromise: Promise<FaceLandmarker | null> | null = null;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

      // Try GPU first
      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        return faceLandmarkerInstance;
      } catch (gpuError) {
        console.warn('GPU delegate failed, falling back to CPU delegate:', gpuError);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: 'CPU',
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        return faceLandmarkerInstance;
      }
    } catch (err) {
      console.error('Failed to initialize FaceLandmarker:', err);
      return null;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

export function isVisionLoading(): boolean {
  return isLoading;
}

/**
 * Extract target landmarks per Section 4.1:
 * - Landmark 1: Nose Tip (primary vertical Y-axis tracking)
 * - Landmark 33 & 263: Pupils / outer eye corners (pupillary distance Delta X for Z-depth)
 * - Landmark 152: Chin (secondary landmark to avoid simple head tilts)
 */
export function extractKeyLandmarks(landmarks: Array<{ x: number; y: number; z: number }>) {
  if (!landmarks || landmarks.length < 264) {
    return null;
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const chin = landmarks[152];

  // Euclidean distance between eyes in normalized coords
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const pupilDist = Math.sqrt(dx * dx + dy * dy);

  return {
    noseX: nose.x,
    noseY: nose.y,
    chinY: chin.y,
    pupilDistance: pupilDist,
  };
}
