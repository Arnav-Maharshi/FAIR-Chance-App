import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
import * as myUtils from "./Modularized_Functions/utils.js";

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackDiv = document.getElementById('feedback');
const videoContainer = document.getElementById('container');
const modeRadioBtns = Array.from(document.querySelectorAll('input[name="modeGrp"]')); // Select the radio button group

let selectedMode = modeRadioBtns.find(r => r.checked).value; // Default mode is Index-Finger & Thumb
// Event listener for mode changes
for (const rd of modeRadioBtns) {
  rd.addEventListener('change', function() {
      selectedMode = this.value;
      console.log("Selected mode:", selectedMode);
  });
}

const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

let handLandmarker;
let running = false;
let prevLandmarks = null;
const alpha = 0.5; // Smoothing factor (Lower value -> More Smoothing -> Less fluctuations in accuracy score )

// Default settings for camera (being adjusted in setupCamera() )
let video_constraints = { 
      facingMode: "user", // Choosing front camera
      width: {ideal: 640}, 
      height: {ideal: 480}, 
    };

const angleHistory = [];
const accScoreHistory = [];
const timestampHistory = []; // Refresh interval in milliseconds

async function setupHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
}


async function setupCamera() {
  /*Changing aspect ratio and appropriate resolution 
  based on window size/orientation (potrait/landscape) */
  if (window.innerHeight > window.innerWidth) {
    // Portrait orientation
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
    // Landscape orientation
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
    videoContainer.style.maxHeight = `${window.innerHeight}px`; // Set max height for landscape
  }

  try{
    //Setting up camera
    const stream = await navigator.mediaDevices.getUserMedia({video: video_constraints});
    videoElement.srcObject = stream;
    console.log("Width: ", video_constraints.width, "Height: ", video_constraints.height);
    console.log("Vid Width: ", videoElement.videoWidth, "Vid Height: ", videoElement.videoHeight);
      
    // !!CRUCIAL!!
    // Set canvas size to match video dimensions for proper aspect ratio
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => resolve();    
    });
  }
  catch (error) {
    console.error("Error accessing camera:", error);
    feedbackDiv.textContent = 'Could not access camera. Please allow camera permissions.';
    feedbackDiv.style.color = '#ff4444';
    return Promise.reject(error);
  }
}

let results = undefined;

async function renderLoop() {
  if (!running) return;

  /*
  // MAY BE REMOVABLE
  // Ensure canvas drawing dimensions match its current display size (from CSS)
  // This is important if the container's size changes (e.g., orientation change)
  const displayWidth = canvasElement.clientWidth; // Get current display width from CSS
  const displayHeight = canvasElement.clientHeight; // Get current display height from CSS

  if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) { //
    canvasElement.width = displayWidth; //
    canvasElement.height = displayHeight; //
  }*/

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
      
      let hand_label = results.handedness[0][0].categoryName; // Detecting Right or Left Hand
      //console.log(hand_label);
      
      const angles = myUtils.calculateAngles(lmrks, selectedMode, "flexion", hand_label); // Calculating the angles
      //console.log("Angles: ", angles[1].value); // Logging the angles      
      

      // Accuracy score is based on the first joint (MP)
      const acc_score = myUtils.accuracyScore(angles[0].value, selectedMode, "flexion"); // Calculating the accuracy score based on the MP angle
      //console.log("Acc Score: ", acc_score); // Logging the MP score
      
      /*const currentTime = performance.now();
      if (currentTime - lastRecordedTime >= 1000) { // Record every second
        angleHistory.push(angles.map(a => a.value));
        accScoreHistory.push(acc_score);
        timestampHistory.push(currentTime); // Storing the timestamp for each angle record
        lastRecordedTime = currentTime; // Update the last recorded time
      }*/
      angleHistory.push(angles.map(a => a.value));
      accScoreHistory.push(acc_score);
      timestampHistory.push(performance.now()); // Storing the timestamp for each angle record



      myUtils.drawProgressBar(canvasCtx, acc_score);
      // Feedback based on PIP angle
      setTimeout(() => {
        const feedback = myUtils.getCompensationFeedbackFlexion(angles[1].value); 
        feedbackDiv.textContent = feedback.text; // Displaying the feedback text
        feedbackDiv.style.color = feedback.color; // Displaying the feedback color
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
    myUtils.exportAngle_AccScoreData(angleHistory, accScoreHistory, timestampHistory, selectedMode, "flexion");
};

/*
function openFullscreen() {
  if (videoElement.requestFullscreen) {
    videoElement.requestFullscreen();
  } else if (videoElement.mozRequestFullScreen) { // Firefox 
    videoElement.mozRequestFullScreen();
  } else if (videoElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
    videoElement.webkitRequestFullscreen();
  } else if (videoElement.msRequestFullscreen) { // IE/Edge
    videoElement.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { // Firefox
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { // IE/Edge
    document.msExitFullscreen();
  }
}

function handleOrientationChange() {
  const orientation = (window.screen.orientation || {}).type || window.screen.mozOrientation || window.screen.msOrientation;

  if (["landscape-primary", "landscape-secondary"].indexOf(orientation) !== -1) {
    openFullscreen();
  } else {
    closeFullscreen();
  }
} 
*/




async function main() {
  await setupHandLandmarker();
  await setupCamera();

  //Checking if the window is resized OR orientation changes (potrait/landscape)
  window.addEventListener('resize', setupCamera);

  /* // Event listener for orientation changes
  window.addEventListener("orientationchange", handleOrientationChange);
  // Initial check in case it's already in landscape
  handleOrientationChange(); */

  running = true;
  renderLoop();
}

main(); 