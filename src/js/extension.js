import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import * as myUtils from "./Modularized_Functions/utils.js"
import { Capacitor } from '@capacitor/core';  // NEW: Capacitor platform detection
import { Camera } from '@capacitor/camera';

async function requestCameraPermission() {
  const status = await Camera.requestPermissions();
  return status.camera === 'granted';
}

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackDiv = document.getElementById('feedback');
const videoContainer = document.getElementById('container')
const modeRadioBtns = Array.from(document.querySelectorAll('input[name="modeGrp"]')); // Select the radio button group
const loadingSpinner = document.getElementById('loadingSpinner');

videoElement.addEventListener('waiting', () => {
    loadingSpinner.classList.remove('hidden'); // Show spinner when waiting for data
});

let selectedMode = modeRadioBtns.find(r => r.checked).value; // Default mode is Index-Finger & Thumb
let handLandmarker;
let running = false;
let prevLandmarks = null;
const alpha = 0.5; // Smoothing factor (Lower value -> More Smoothing -> Less fluctuations in accuracy score )


// Check if running on a native platform (iOS/Android) or web
// This is useful for adjusting camera settings or UI elements
const isNative = Capacitor.isNativePlatform();  // Detects if running on mobile
const platform = Capacitor.getPlatform(); 

// Event listener for mode changes
for (const rd of modeRadioBtns) {
  rd.addEventListener('change', function() {
      selectedMode = this.value;
      console.log("Selected mode:", selectedMode);
  });
}

// Model asset path for hand landmarker
const MODEL_ASSET_PATH = '../pages/models/hand_landmarker.task'; // Path to the hand landmark model 

// Default settings for camera (being adjusted in setupCamera() )
let video_constraints = { 
      facingMode: "user", // Choosing front camera
      width: {ideal: 640}, 
      height: {ideal: 480}, 
    };

const angleHistory = []; // Array to store angles history
const accScoreHistory = []; // Array to store accuracy score history
const timestampHistory = []; // Refresh interval in milliseconds


async function setupHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    '../pages/models/wasm', // Path to the WASM, helper files
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_ASSET_PATH,
                   delegate: 'GPU', // Use GPU for native platforms, NONE for web
                  },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.7,
    delegateToNative: isNative, // (true for mobile) using native-optimized backends, which are faster and more efficient—especially on devices that support WebAssembly or WebGPU.
  });
}


async function setupCamera() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isNative;

  // !! MOBILE SPECIFIC ADJUSTMENTS !!
  if (isMobile) {
    // Mobile-optimized constraints
    if (window.innerHeight > window.innerWidth) {
      // Mobile Portrait
      videoContainer.style.aspectRatio = '4/3'; // Adjust as needed
      canvasElement.style.aspectRatio = '4/3';
      videoElement.style.aspectRatio = '4/3';
      video_constraints = {
        facingMode: "user",
        /*width: { ideal: 480, min: 240 },
        height: { ideal: 640, min: 320 },
        aspectRatio: { ideal: 3/4 }*/
        width: {ideal:640,min:320},
        height: {ideal:480,min:240},
        aspectRatio: { ideal: 4 / 3 }
      };
    } else {
      // Mobile Landscape
      videoContainer.style.aspectRatio = '16/9';
      canvasElement.style.aspectRatio = '16/9';
      videoElement.style.aspectRatio = '16/9';
      video_constraints = {
        facingMode: "user",
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        aspectRatio: { ideal: 16/9 }
      };
      
    }
  } else {

    // !! DESKTOP-SPECIFIC ADJUSTMENTS !!
    if (window.innerHeight > window.innerWidth) {
      // Desktop Portrait orientation
      videoContainer.style.aspectRatio = '4/3'; // Adjust as needed
      canvasElement.style.aspectRatio = '4/3';
      videoElement.style.aspectRatio = '4/3';
      video_constraints = {
        facingMode: "user",
        width: {ideal:640,min:320},
        height: {ideal:480,min:240},
        aspectRatio: { exact: 4 / 3 }
      };

      console.log("Potrait orientation");
      console.log(`Display updated: Container Aspect Ratio set to actual video: ${videoContainer.style.aspectRatio}`);
      
    } else {
      // Desktop Landscape orientation
      videoContainer.style.aspectRatio = '16/9'; // Adjust as needed
      canvasElement.style.aspectRatio = '16/9';
      videoElement.style.aspectRatio = '16/9';
      video_constraints = {
        facingMode: "user",
        width: {ideal: 1920, min: 1280},
        height: {ideal: 1080, min: 720},
        aspectRatio: { exact: 16 / 9 }
      };
      
      console.log("Landscape orientation");
      console.log(`Display updated: Container Aspect Ratio set to actual video: ${videoContainer.style.aspectRatio}`);
      
      
      // Leave this commented- This is the best code for landscape video
      //videoContainer.style.maxWidth = `${window.innerWidth -100}px`; // Set max width for landscape
      // Works for iphone- 
      //videoContainer.style.maxHeight = `${window.innerHeight}px`; // Set max height for landscape
    }
  }
  
  if (Capacitor.isNativePlatform()) {
    const granted = await requestCameraPermission();
    if (!granted) {
      feedbackDiv.textContent = 'Camera permission is required.';
      feedbackDiv.style.color = 'red';
      return;
    }
  }

  try{
    //Setting up camera
    const stream = await navigator.mediaDevices.getUserMedia({video: video_constraints});
    videoElement.srcObject = stream;
    console.log("Width: ", video_constraints.width, "Height: ", video_constraints.height);
    console.log("Vid Width: ", videoElement.videoWidth, "Vid Height: ", videoElement.videoHeight);
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play(); // Play the video stream
        resolve();
      };
    });

    setTimeout(() => {
      loadingSpinner.classList.add('hidden'); // Hide loading spinner after camera video is ready
      console.log("Camera video is ready");
    }, 1000); // adding short delay to allow cushion time for video to load

    // !!CRUCIAL!!
    // Set canvas size to match video dimensions for proper aspect ratio
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }
  catch (error) {
    console.error("Error accessing camera:", error);
    
    // Mobile-specific error handling
    if (isNative) {
      feedbackDiv.textContent = 'Camera permission required. Please grant camera access in settings.';
    } else {
      feedbackDiv.textContent = 'Could not access camera. Please allow camera permissions.';
    }
    
    feedbackDiv.style.color = '#ff4444';
    return Promise.reject(error);
  }
}


let results = undefined;

async function renderLoop() {
  if (!running) return;

  // Set canvas size to match video dimensions for proper aspect ratio
  if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  // Check if the video is ready and handLandmarker is initialized
  // readyState >= 2 means the video has enough data to start playing
  if (videoElement.readyState >= 2 && handLandmarker) {
    let now = performance.now(); // Current time

    // Video drawing
    results = handLandmarker.detectForVideo(videoElement, now); // Detecting hand landmarks
    canvasCtx.save(); // Saves the current drawing state
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
   
    // Draw the video frame mirrored
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    // Draws the video frame
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore(); // Restores the saved drawing state

    // Draw overlays/text in normal orientation (no mirroring, no coordinate flipping)
    if (results && results.landmarks && results.landmarks.length > 0) {
      let lmrks = results.landmarks[0]; // Getting the first hand landmark
      lmrks = myUtils.smoothLandmarks(lmrks, prevLandmarks, alpha); // Smoothing the landmarks
      prevLandmarks = lmrks; // Updating the previous landmarks
      myUtils.drawHand(canvasCtx, lmrks); // Drawing the hand overlay
      
      let hand_label = results.handedness[0][0].categoryName; // Detecting Right or Left Hand
      //console.log(hand_label);

      const angles = myUtils.calculateAngles(lmrks, selectedMode,"extension", hand_label); // Calculating the angles
      //console.log("Angles: ", angles[1].value); // Logging the angles      

      // Accuracy score is based on the first joint (MP)
      const acc_score = myUtils.accuracyScore(angles[0].value, selectedMode, "extension"); // Calculating the accuracy score based on the MP angle
      //console.log("Acc Score: ", acc_score); // Logging the MP score
      
      angleHistory.push(angles.map(a => a.value));
      accScoreHistory.push(acc_score);
      timestampHistory.push(performance.now()); // Storing the timestamp for each angle record


      myUtils.drawProgressBar(canvasCtx, acc_score);
      
      // Feedback based on PIP angle (kept delayed to allow for smoother UI)
      setTimeout(() => {
        const feedback = myUtils.getCompensationFeedbackExtension(angles[1].value);
        feedbackDiv.textContent = feedback.text;
        feedbackDiv.style.color = feedback.color;
      }, 1000); 

        // Show angle values
      canvasCtx.fillStyle = '#fff';
      canvasCtx.fontSize = Math.max(24, canvasElement.height* 0.05);   // Calculate font size relative to bar height or canvas height
      canvasCtx.font = `${canvasCtx.fontSize}px Arial`;
      angles.forEach((a, i) => {
        canvasCtx.fillText(`${a.name}: ${a.value}°`, canvasElement.width * 0.03, 80 + i * canvasElement.height * 0.1);
      });
    } else {
      feedbackDiv.textContent = 'Show your hand to the camera!';
      feedbackDiv.style.color = '#ffd700';
    }
    canvasCtx.restore();
  }
  requestAnimationFrame(renderLoop);
}

document.getElementById('exportButton').onclick = function() {
    // Use your actual variable names and angle labels
    myUtils.exportAngle_AccScoreData(angleHistory, accScoreHistory, selectedMode, "extension", isNative);
};

// Reset the app to initial state (trying to optimize responsiveness, avoiding reload)
async function resetApp() {
  // Stop camera stream
  if (videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
  }

  // Clear canvas
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Reset dimensions
  videoElement.width = 0;
  videoElement.height = 0;
  canvasElement.width = 0;
  canvasElement.height = 0;

  // Re-initialize everything
  await setupCamera();
  //videoElement.play();
  //renderLoop(); // or whatever your tracking loop is called
}


async function main() {
  const [_, __] = await Promise.all([
    setupCamera(), 
    setupHandLandmarker(),
  ]);

  //Checking if the orientation changes (potrait/landscape)
  window.addEventListener('orientationchange', () => {
    //resetApp();
    location.reload(); // Reload the page
  });

  // Mobile-specific event listeners
  if (isNative) {
    document.addEventListener('deviceready', () => {
      console.log('Capacitor device ready');
    });
  }

  running = true;
  renderLoop();
}

main(); 