import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import * as myUtils from "./Modularized_Functions/utils.js";
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
const videoContainer = document.getElementById('container');
const modeRadioBtns = Array.from(document.querySelectorAll('input[name="modeGrp"]')); // Select the radio button group
const loadingSpinner = document.getElementById('loadingSpinner');

videoElement.addEventListener('waiting', () => {
    loadingSpinner.classList.remove('hidden'); // Show spinner when waiting for data
});

let selectedMode = modeRadioBtns.find(r => r.checked).value; // Default mode is IMRL (Index, Middle, Ring & Little Finger)
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
    delegateToNative: isNative, // (true for mobile) using native-optimized backends, which are faster and more efficient—especially on devices that support WebAssembly or WebGPU
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
  if (videoElement.readyState >= 2 && handLandmarker) { // Check if the video is ready and the hand landmark detector is ready
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
      
      /// !!!!!!*****
      const distances = myUtils.adduction_abduction(lmrks); // Calculating the distances
      
      
      /*nst angles = myUtils.adduction_abductionV2(lmrks); // Getting the angles for all fingers
      angles.forEach(a => console.log(`${a.name} Angle: `, a.value)); // Logging the angles for all fingers */

      let acc_score;
      let acc_score_list = [];
      distances.forEach((d, i) => {
        switch (i) {
          case 0: // Index Finger
            acc_score = Math.max(0, Math.min(Math.round(((d.value - 15) / 8) * 100), 100)); 
            break;
          case 1: // Middle Finger
            acc_score = Math.max(0, Math.min(Math.round(((d.value - 10) / 5) * 100), 100)); 
            break;
          case 2: // Ring Finger
            acc_score = Math.max(0, Math.min(Math.round(((d.value - 15) / 9) * 100), 100));
            break;
          case 3: // Thumb 
            acc_score = Math.max(0, Math.min(Math.round(((d.value - 20) / 35) * 100), 100)); 
            break;

        }
        acc_score_list.push({name: d.name, value: acc_score}); // Storing the accuracy score
      });

      /*acc_score_list.forEach((score) => {
        console.log(`${score.name} Acc Score: `, score.value); // Logging the accuracy score
      });*/

      if (selectedMode === "modeIMRL") {
        myUtils.drawProgressBarV2(canvasCtx, acc_score_list, selectedMode); // Drawing the progress bar for IMRL mode. ONLY Accessing accuracy scores for Index, Middle & Ring Finger
      } else {
        myUtils.drawProgressBar(canvasCtx, acc_score_list[3].value); // drawProgressBar() is for Thumb. This function needs a number as argument
      }
      //myUtils.drawProgressBarV2(canvasCtx, acc_score_list); // Drawing the progress bar
      
      if (selectedMode === "modeIMRL") {
        // Feedback based on PIP angle (for IMRL mode ONLY)
        const feedback = myUtils.getCompensationFeedbackAdduction_Abduction(lmrks);
        setTimeout(() => {
          feedbackDiv.innerHTML = feedback.map(f => `
              <span style="color:white; display:inline-block; width:7em; text-align:left;">${f.finger}:</span>
              <span style="color:${f.color}; display:inline-block;  width:100%; max-width: 40vw; padding-bottom:1.5vh; text-align:left; vertical-align:top; word-break:break-word;">${f.text}</span>
          `).join("<br>"); // In style, 'width', 'max-width' are very important to prevent shrinking/expanding of the feedback text
        }, 1000);
      } 
      else {
        feedbackDiv.textContent = '';
      }

      // Show angle values
      canvasCtx.fillStyle = '#fff';
      canvasCtx.fontSize = Math.max(24, canvasElement.height* 0.05);   // Calculate font size relative to bar height or canvas height
      canvasCtx.font = `${canvasCtx.fontSize}px Arial`;

      distances.forEach((a, i) => {
        canvasCtx.fillText(`${a.name}: ${a.value}mm`, canvasElement.width * 0.03, 80 + i * canvasElement.height * 0.1);
      });
    } else {
      feedbackDiv.textContent = 'Show your hand to the camera!';
      feedbackDiv.style.color = '#ffd700';
    }
    canvasCtx.restore();
  }
  requestAnimationFrame(renderLoop);
}


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
 
  /* // Event listener for orientation changes
  window.addEventListener("orientationchange", handleOrientationChange);
  // Initial check in case it's already in landscape
  handleOrientationChange(); */

  running = true;
  renderLoop();
}

main(); 