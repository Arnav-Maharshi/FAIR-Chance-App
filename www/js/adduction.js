import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
import * as myUtils from "./Modularized_Functions/utils.js";

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackDiv = document.getElementById('feedback');
const videoContainer = document.getElementById('container');

const modeRadioBtns = Array.from(document.querySelectorAll('input[name="modeGrp"]')); // Select the radio button group

let selectedMode = modeRadioBtns.find(r => r.checked).value; // Default mode is IMRL (Index, Middle, Ring & Little Finger)
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
      
      let acc_score;
      let acc_score_list = [];
      distances.forEach((d, i) => {
        if (i===0 || i === 2){
          acc_score = Math.max(0, Math.min(Math.round(((30 - d.value) / 30) * 100), 100)); // Calculating the MP score(accuracy percentage) out of 77 degrees
        }
        else if(i === 3){
          acc_score = Math.max(0, Math.min(Math.round(((40 - d.value) / 40) * 100), 100)); // Calculating the MP score(accuracy percentage) out of 77 degrees
        } 
        else{
          acc_score = Math.max(0, Math.min(Math.round(((15 - d.value) / 15) * 100), 100)); // Calculating the MP score(accuracy percentage) out of 77 degrees
        }
        acc_score_list.push({name: d.name, value: acc_score}); // Storing the accuracy score
      });

      console.log("Thumb Acc Score: ", acc_score_list[3].value);

      /*acc_score_list.forEach((score) => {
        console.log(`${score.name} Acc Score: `, score.value); // Logging the accuracy score
      });*/
      if (selectedMode === "modeIMRL") {
        myUtils.drawProgressBarV2(canvasCtx, acc_score_list, selectedMode); // Drawing the progress bar for IMRL mode. ONLY Accessing accuracy scores for Index, Middle & Ring Finger
      } else {
        myUtils.drawProgressBar(canvasCtx, acc_score_list[3].value); // drawProgressBar() is for Thumb. This function needs a number as argument
      }
      //myUtils.drawProgressBarV2(canvasCtx, acc_score_list, selectedMode); // Drawing the progress bar
      
      // Feedback based on PIP angle (for IMRL mode ONLY)
      if (selectedMode === "modeIMRL") {
        const feedback = myUtils.getCompensationFeedbackAdduction_Abduction(lmrks);
        setTimeout(() => {
          feedbackDiv.innerHTML = feedback.map(f => `
              <span style="color:white; display:inline-block; width:7em; text-align:left;">${f.finger}:</span>
              <span style="color:${f.color}; display:inline-block;  width:100%; max-width: 40vw; padding-bottom:1.5vh; text-align:left; vertical-align:top; word-break:break-word;">${f.text}</span>
          `).join("<br>"); // In style, 'width', 'max-width' are very important to prevent shrinking/expanding of the feedback text
        }, 1000);
      }
      else {
        feedbackDiv.textContent = ''; // Clear feedback for Thumb mode
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