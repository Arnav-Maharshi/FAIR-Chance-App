/* !! MODULARIZED FUNCTIONS !!
File for all functions utilized in various pages */

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {FileOpener} from '@capawesome-team/capacitor-file-opener'

const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');


// Define HAND_CONNECTIONS constant for hand landmark connections
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle finger
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [13, 17], [17, 18], [18, 19], [19, 20], // Little
  [0, 17] // Palm base
];

// Custom drawing functions
export function drawConnectors(ctx, landmarks, connections, options = {}) {
  const { color = "#00FF00", lineWidth = 5 } = options;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  
  for (const [start, end] of connections) {
    const s = landmarks[start];
    const e = landmarks[end];
    ctx.beginPath();
    // Starting point
    ctx.moveTo((1 - s.x) * canvasElement.width, s.y * canvasElement.height); // (1 - s.x) flips the x-coordinate horizontally (mirror effect)
    // Ending point
    ctx.lineTo((1 - e.x) * canvasElement.width, e.y * canvasElement.height); // (1 - e.x) flips the x-coordinate horizontally (mirror effect)
    ctx.stroke(); // Draw the line
  }
}

// Draw landmarks (dots) for hand
export function drawLandmarks(ctx, landmarks, options = {}) {
  const { color = "#FF0000", lineWidth = 7} = options;
  ctx.fillStyle = color;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc((1 - lm.x) * canvasElement.width, lm.y * canvasElement.height, 7.5, 0, 2 * Math.PI);
    ctx.fill(); // fills the circle
  }
}

// Smooth hand landmarks
export function smoothLandmarks(landmarks, prevLandmarks, alpha) {
  if (!prevLandmarks) return landmarks;
  return landmarks.map((curr, i) => ({
    x: alpha * curr.x + (1 - alpha) * prevLandmarks[i].x,
    y: alpha * curr.y + (1 - alpha) * prevLandmarks[i].y,
    z: alpha * curr.z + (1 - alpha) * prevLandmarks[i].z
  }));
}

// Calculate angles for index finger joints
export function calculateAngles(landmarks, finger_mode, action_mode,  hand_label) {
  // mode: "flexion" or "extension" (affects angle calculation)
  const indexF_joints = [
    [6, 5, 0], // MP (Metacarpophalangeal joint)
    [7, 6, 5], // PIP (Proximal Interphalangeal joint)
    [8, 7, 6] // DIP (Distal Interphalangeal joint)
  ];
  const middleF_joints = [
    [10, 9, 0], // MP
    [11, 10, 9], // PIP
    [12, 11, 10] // DIP
  ];
  const ringF_joints = [  
    [14, 13, 0], // MP
    [15, 14, 13], // PIP
    [16, 15, 14] // DIP
  ];
  const littleF_joints = [
    [18, 17, 0], // MP
    [19, 18, 17], // PIP
    [20, 19, 18] // DIP

  ];
  const thumb_joints = [
    [3, 2, 1], // Thumb-MCP
    [4, 3, 2], // Thumb-IP
  ];
  const names = ["MP", "PIP", "DIP"];

  const joints = [
    indexF_joints,
    middleF_joints,
    ringF_joints,
    littleF_joints,
    thumb_joints
  ];

  var finger_index = 0; // Index for the selected finger
  switch (finger_mode) {
    case "indexF":
      finger_index = 0;
      break;
    case "middleF":
      finger_index = 1;
      break;
    case "ringF":
      finger_index = 2;
      break;
    case "littleF":
      finger_index = 3;
      break;
    case "thumb":
      finger_index = 4;
      break;
  }

  let angle_list = [];
  for (let i = 0; i < joints[finger_index].length; i++) {
    const [aIdx, bIdx, cIdx] = joints[finger_index][i];
    //console.log("Calculating angle for joints:", joints[finger_index][i]);
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];
    const c = landmarks[cIdx];
    const ab = {x: a.x - b.x, y: a.y - b.y};
    const cb = {x: c.x - b.x, y: c.y - b.y};
    let radians = Math.atan2(cb.y, cb.x) - Math.atan2(ab.y, ab.x);
    let angle;
    if (action_mode === "flexion") {
      angle = Math.abs((radians * 180.0 / Math.PI)); // Converting radians to degrees
      // !!!!! REVIEW BELOW CODE !!!!! (Why we we are subtracting)
      if (hand_label === "Left") angle = 360 - angle; // Realistic angle value for left hand 
    } 
    else if (action_mode === "extension") {
      /* Flipping radian value for Right hand 
      as it's angle/coordinate measurement is opposite of Left hand. Basically standardizing
      Overall better for starting angle measurement from finger-flexed position */  
      if (hand_label == "Left"){
          //Actually not required but leeave it here-> radians = -radians; 

          /* Normalising the Left hand angle reading to increase as finger extends/rises 
          Without below code, 
          Left Finger flexes -> Angle Increase 
          Right Finger Flexes -> Angle Decreases */
          angle = Math.abs((radians*180.0/Math.PI)); // Converting radians to angle
          angle = 360-angle;
      }
      else{
          angle = Math.abs(radians*180.0/Math.PI); // Converting radians to angle
      }    
    }
    angle_list.push({name: names[i], value: Math.round(angle)}); // Storing the angle values
  }
  return angle_list;
}

export function calculateAnglesV2(landmarks, finger_mode, action_mode,  hand_label) {
  // mode: "flexion" or "extension" (affects angle calculation)
  const indexF_joints = [
    [0, 5, 6], // MP (Metacarpophalangeal joint)
    [5, 6, 7], // PIP (Proximal Interphalangeal joint)
    [6, 7, 8] // DIP (Distal Interphalangeal joint)
  ];
  const middleF_joints = [
    [0, 9, 10], // MP
    [9, 10, 11], // PIP
    [10, 11, 12] // DIP
  ];
  const ringF_joints = [  
    [0, 13, 14], // MP
    [13, 14, 15], // PIP
    [14, 15, 16] // DIP
  ];
  const littleF_joints = [
    [0, 17, 18], // MP
    [17, 18, 19], // PIP
    [18, 19, 20] // DIP

  ];
  const thumb_joints = [
    [1, 2, 3], // Thumb-MCP
    [2, 3, 4], // Thumb-IP
  ];
  const names = ["MP", "PIP", "DIP"];

  const joints = [
    indexF_joints,
    middleF_joints,
    ringF_joints,
    littleF_joints,
    thumb_joints
  ];

  var finger_index = 0; // Index for the selected finger
  switch (finger_mode) {
    case "indexF":
      finger_index = 0;
      break;
    case "middleF":
      finger_index = 1;
      break;
    case "ringF":
      finger_index = 2;
      break;
    case "littleF":
      finger_index = 3;
      break;
    case "thumb":
      finger_index = 4;
      break;
  }

  let angle_list = [];
  console.log(`${finger_index}, ${finger_mode},`);
  for (let i = 0; i < joints[finger_index].length; i++) {
    const [aIdx, bIdx, cIdx] = joints[finger_index][i];
    //console.log("Calculating angle for joints:", joints[finger_index][i]);
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];
    const c = landmarks[cIdx];
    const ab = {x: b.x - a.x, y: b.y - a.y};
    const bc = {x: c.x - b.x, y: c.y - b.y};
    //let radians = Math.atan2(cb.y, cb.x) - Math.atan2(ab.y, ab.x);

    let dotProduct = ab.x * bc.x + ab.y * bc.y;
    let magnitude_ab = Math.hypot(ab.x, ab.y);
    let magnitude_bc = Math.hypot(bc.x, bc.y);
    let radians = Math.acos(dotProduct/(magnitude_ab * magnitude_bc));

    let angle;
    if (action_mode === "flexion") {
      angle = Math.abs((radians * 180.0 / Math.PI)); // Converting radians to degrees
      // !!!!! REVIEW BELOW CODE !!!!! (Why we we are subtracting)
      //if (hand_label === "Left") angle = 360 - angle; // Realistic angle value for left hand 
    } 
    else if (action_mode === "extension") {
      /* Flipping radian value for Right hand 
      as it's angle/coordinate measurement is opposite of Left hand. Basically standardizing
      Overall better for starting angle measurement from finger-flexed position */  
      //Actually not required but leeave it here-> radians = -radians; 

      /* Normalising the Left hand angle reading to increase as finger extends/rises 
      Without below code, 
      Left Finger flexes -> Angle Increase 
      Right Finger Flexes -> Angle Decreases */
      angle = Math.abs((radians*180.0/Math.PI)); // Converting radians to angle
      //angle = 360-angle; 
    }
    angle_list.push({name: names[i], value: Math.round(angle)}); // Storing the angle values
  }
  return angle_list;
}
export function accuracyScore(angle, finger_mode, action_mode) {
  // Calculate accuracy score based on the angle and finger mode
  let score = 0;
  if (action_mode === "flexion") {
    switch (finger_mode) {
      case "indexF":
        score = Math.max(0, Math.min(Math.round(((180-angle) /75) *100), 100)); // Index finger
        break;  
      case "middleF":
        // Correct flexion range: 95-110 degrees
        // Hyperflexion angle: above 130 degrees
        score = Math.max(0, Math.min(Math.round(((180-angle) /20) *100), 100)); // Middle finger
        break;
      case "ringF": 
        // Correct flexion range: 50-70 degrees
        // Hyperflexion angle: above 100 degrees
        score = Math.max(0, Math.min(Math.round(((180-angle) /22) *100), 100)); 
        break;
      case "littleF":
        // Correct flexion range: 55-70 degrees
        // Hyperflexion angle: above 100 degrees
        score = Math.max(0, Math.min(Math.round(((180-angle) /70) *100), 100)); 
        break;
    }
  }
  else if (action_mode === "extension") {
      score = Math.max(0, Math.min(Math.round(((angle) /180) *100), 100)); // Extension score
  }
  return score;
}

export function accuracyScoreV2(angle, finger_mode, action_mode) {
  // Calculate accuracy score based on the angle and finger mode
  let score = 0;
  if (action_mode === "flexion") {
    switch (finger_mode) {
      case "indexF":
        score = Math.max(0, Math.min(Math.round(((angle) /70) *100), 100)); // Index finger
        break;  
      case "middleF":
        // Correct flexion range: 95-110 degrees
        // Hyperflexion angle: above 130 degrees
        score = Math.max(0, Math.min(Math.round(((angle) /80) *100), 100)); // Middle finger
        break;
      case "ringF": 
        // Correct flexion range: 50-70 degrees
        // Hyperflexion angle: above 100 degrees
        score = Math.max(0, Math.min(Math.round(((angle) /70) *100), 100)); 
        break;
      case "littleF":
        // Correct flexion range: 55-70 degrees
        // Hyperflexion angle: above 100 degrees
        score = Math.max(0, Math.min(Math.round(((angle) /70) *100), 100)); 
        break;
    }
  }
  else if (action_mode === "extension") {
      score = Math.max(0, Math.min(Math.round(((90 - angle) /90) *100), 100)); // Extension score
  }
  return score;
}

export function approxToZero(value, threshold) {
  // Check if the value is approximately zero within a given threshold
  if(Math.trunc(value) < threshold) {
    return 0; // Return 0 if the value is approximately zero
  }
  else {
    return Math.trunc(value); // Otherwise, return the value truncated to an integer
  }
}

// Measuring and displaying distance of thumb from respective finger joint
// Hand orientation: Palm facing the camera
export function oppositionDistance(landmarks, finger_mode, joint_list = [[4, 8], [4, 12], [4, 16], [4, 20]]){
  //joint_list ; // Joints to loop through
  let distance;
  let distance_list = []; // List to store distances
  let normalizedDistance; // Normalized distance value
  // Initialize accuracy score
  const names = ["indexF", "middleF", "ringF", "littleF", "allF"]; // Names of fingers
  
  var finger_index = 0; // Index for the selected finger
  switch (finger_mode) {
    case "indexF":
      finger_index = 0;
      break;
    case "middleF":
      finger_index = 1;
      break;
    case "ringF":
      finger_index = 2;
      break;
    case "littleF":
      finger_index = 3;
      break;
  }
  console.log(`Finger index- ${finger_index}`);

  // Loop through hands
  if (!(finger_mode === "allF")) { // for individual finger mode
    for (let i = 0; i < joint_list[finger_index].length; i++) {
      const [aIdx, bIdx] = joint_list[finger_index];
      const a = {x: landmarks[aIdx].x, y: landmarks[aIdx].y};//, z: landmarks[aIdx].z};
      const b = {x: landmarks[bIdx].x, y: landmarks[bIdx].y};//, z: landmarks[bIdx].z};

      distance = approxToZero(100*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 5); // Multiplying by 100 to gain wider range of data & setting threshold to 5 for all fingers
      
      normalizedDistance = distance; // Normalizing distance values for all fingers (for setting increasing order)

      distance_list.push({name: names[i], value: distance}); // Storing the distance values
    }
  }
  else { // for all fingers
    for (let i = 0; i < joint_list.length; i++) {
      const [aIdx, bIdx] = joint_list[i];
      const a = {x: landmarks[aIdx].x, y: landmarks[aIdx].y};//, z: landmarks[aIdx].z};
      const b = {x: landmarks[bIdx].x, y: landmarks[bIdx].y};//, z: landmarks[bIdx].z};

      distance = approxToZero(100*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 5); // Multiplying by 100 to gain wider range of data & setting threshold to 5 for all fingers
      
      normalizedDistance = distance; // Normalizing distance values for all fingers (for setting increasing order)

      distance_list.push({name: names[i], value: distance}); // Storing the distance values
    }
  }
  return distance_list; // Return the accuracy score list
}

// More efficient function to calculate opposition distance (using a loop only for 'allF' mode)
export function oppositionDistanceV2(landmarks, finger_mode, joint_list = [[4, 8], [4, 12], [4, 16], [4, 20]]){
  //joint_list ; // Joints to loop through
  let distance;
  let distance_list = []; // List to store distances
  let normalizedDistance; // Normalized distance value
  // Initialize accuracy score
  const names = ["indexF", "middleF", "ringF", "littleF", "allF"]; // Names of fingers

  var finger_index = 0; // Index for the selected finger
  console.log(`Finger index- ${finger_index}`);

  if (finger_mode === "allF") { // for all fingers
    for (let i = 0; i < joint_list.length; i++) {
      const [aIdx, bIdx] = joint_list[i];
      const a = landmarks[aIdx];
      const b = landmarks[bIdx];

      distance = approxToZero(100*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 5); // Multiplying by 100 to gain wider range of data & setting threshold to 5 for all fingers
      
      distance_list.push({name: names[i], value: distance}); // Storing the distance values
    }
  }
  else {
    const [aIdx, bIdx] = joint_list[names.indexOf(finger_mode)];
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];

    distance = approxToZero(100*(Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
    )), 5); // Multiplying by 100 to gain wider range of data & setting threshold to 5 for all fingers
    distance_list.push({name: finger_mode, value: distance}); // Storing the distance values
  }
  return distance_list; // Return the accuracy score list
}



export function adduction_abduction(landmarks, joint_list = [[8, 12], [12, 16], [15, 20], [3, 5]]){
  let distance;
  let distance_list = []; // List to store distances
  // Initialize accuracy score
  const names = ["Index-Middle", "Middle-Ring", "Ring-Little", "Thumb"]; // Names of finger pairs
  // Loop through joint pairs
  for (let i = 0; i < joint_list.length; i++) {
    const [aIdx, bIdx] = joint_list[i];
    const a = {x: landmarks[aIdx].x, y: landmarks[aIdx].y};//, z: landmarks[aIdx].z};
    const b = {x: landmarks[bIdx].x, y: landmarks[bIdx].y};//, z: landmarks[bIdx].z};

    if (i == 1) { // Setting threshold to 4 for middle-ring finger distance, to reduce false positives
     
      distance = approxToZero(200*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 10); 
    }
    else if (i == 2) { // Setting threshold to 3 for ring-little finger distance, to reduce false positives
      distance = approxToZero(280*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 15);
    }
    else if (i == 3) { // Setting threshold to 4 for thumb distance, to reduce false positives
      distance = approxToZero(370*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 20); 

    }
    else { // For index-middle finger distance, setting threshold to 15
      distance = approxToZero(200*(Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
      )), 15); // Multiplying by 100 to gain wider range of data & setting threshold to 5 for all fingers
    }


    distance_list.push({name: names[i], value: distance}); // Storing the distance values
  }

  return distance_list; // Return the accuracy score list
}


// Feedback for flexion
export function getCompensationFeedbackFlexion(PIP_angle) {
  if (PIP_angle >= 175) return {text: "🤩 PERFECT! Keep it up!", color: "#0f0"};
  else if (PIP_angle > 160) return {text: "😁 Nice! You're doing great", color: "#70ff70"};
  else if (PIP_angle > 150) return {text: "😀 Almost there! Just a bit more", color: "#0fc6ff"};
  else if (PIP_angle > 130) return {text: "😐 Keep going!", color: "#4f4fff"};
  return {text: "☹️ Try keeping your finger straight", color: "#f00"};
}

// add hysterisis and progress bar for compensation
// Feedback for extension
export function getCompensationFeedbackExtension(PIP_angle) {
  if (PIP_angle >= 80) return {text: "🤩 PERFECT! Keep it up!", color: "#0f0"};
  if (PIP_angle > 63) return {text: "😁 Nice! Straighten it a bit more!", color: "#70ff70"};
  if (PIP_angle > 40) return {text: "😀 Almost there! Straighten your finger", color: "#0fc6ff"};
  if (PIP_angle > 20) return {text: "😐 Keep going!", color: "#4f4fff"};
  return {text: "☹️ Try keeping your finger straight", color: "#f00"};
}

export function getCompensationFeedbackFlexion_Extension(PIP_angle) {
  if (PIP_angle <= 5) return {text: "🤩 PERFECT! Keep it up!", color: "#0f0"};
  else if (PIP_angle <= 20) return {text: "😁 Nice! Straighten it a bit more!", color: "#70ff70"};
  else if (PIP_angle <= 40) return {text: "😀 Almost there! Straighten your finger", color: "#0fc6ff"};
  else if (PIP_angle <= 60) return {text: "😐 Keep going!", color: "#4f4fff"};
  return {text: "☹️ Try keeping your finger straight", color: "#f00"};
}

export function getCompensationFeedbackAdduction_Abduction(landmarks) {
  let joint_list = [[6, 7], [10, 11], [14, 15], [18, 19]]; // IP joints of each finger
  let joint_names = ["Index", "Middle", "Ring", "Little"]; // Names of fingers
  let distance;
  let distance_list = []; // List to store distances
  for (let i = 0; i < joint_list.length; i++) {
    const [aIdx, bIdx] = joint_list[i];
    const a = {x: landmarks[aIdx].x, y: landmarks[aIdx].y};//, z: landmarks[aIdx].z};
    const b = {x: landmarks[bIdx].x, y: landmarks[bIdx].y};//, z: landmarks[bIdx].z};
    
   
    distance = Math.trunc(1500*(Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
    ))); // Multiplying by 1500 to gain wider range of data 

    distance_list.push({name: `${joint_names[i]}`, value: distance}); // Storing the distance values
    //console.log(`Adduction compensation ${joint_names[i]} fingers: ${distance}mm`); // Logging the distance

    /*switch (i) {
      case 0: // Index finger
        if (distance >= 100) {
          /*setTimeout(() => {
            console.log("Index finger distance exceeded 100mm, adding delay");
          }, delayMs);/
          return {text: "You are doing great!!", color: "#0f0"};
        } else if (distance < 100 && distance >= 80) {
          /*setTimeout(() => {
            console.log("Index finger distance exceeded 85mm, adding delay");
          }, delayMs);/
          return {text: "Good! Straighten your index finger a bit more", color: "#70ff70"};
        } else if (distance < 80 && distance >=60) {
          /*setTimeout(() => {
            console.log("Index finger distance exceeded 75mm, adding delay");
          }, delayMs);/
          return {text: "Almost there! Straighten your index finger!", color: "#0fc6ff"};
        } else if (distance < 60) {
          /*setTimeout(() => {
            console.log("Index finger distance exceeded 55mm, adding delay");
          }, delayMs);/
          return {text: "Try to keep your index finger straight", color: "#f00"};
        }
        
    }*/
    
  }
  let text_output = []; // Initialize text output
  for (let i = 0; i < distance_list.length; i++) {
    if (distance_list[i].value >= 100) {
      /*setTimeout(() => {
        console.log("Index finger distance exceeded 100mm, adding delay");
      }, delayMs);*/
      text_output.push({text: "🤩 You are doing great!!", color: "#0f0", finger: distance_list[i].name}); // Set text output
      //return text_output;
    } else if (distance_list[i].value < 100 && distance_list[i].value >= 80) {
      /*setTimeout(() => {
        console.log("Index finger distance exceeded 85mm, adding delay");
      }, delayMs);*/
      text_output.push({text: `😀 Good! Straighten your ${distance_list[i].name} finger a bit more`, color: "#70ff70", finger: distance_list[i].name}); // Set text output
      
      //return text_output;
    } else if (distance_list[i].value < 80 && distance_list[i].value >= 60) {
      /*setTimeout(() => {
        console.log("Index finger distance exceeded 75mm, adding delay");
      }, delayMs);*/
      text_output.push({text: `😐 Almost there! Straighten your ${distance_list[i].name} finger!`, color: "#0fc6ff", finger: distance_list[i].name}); // Set text output
      //return text_output;
    } else if (distance_list[i].value < 60) {
      /*setTimeout(() => {
        console.log("Index finger distance exceeded 55mm, adding delay");
      }, delayMs);*/
      text_output.push({text: `☹️ Try to keep your ${distance_list[i].name} finger straight `, color: "#f00", finger: distance_list[i].name}); // Set text output
      //return text_output;
    }    
  }
  //return distance_list; // Return the feedback text and color
  return text_output; // Return the feedback text and color
}

function hysterisis(newDistance, lastDistance, threshold) {
  if (newDistance > lastDistance + threshold) {
    console.log("Distance increased beyond threshold, resetting last distance");
    return true; // Change to last distance
  }
  else if (newDistance < lastDistance - threshold) {
    console.log("Distance decreased beyond threshold, resetting last distance");
    return true; // Change to last distance
  } else {
    console.log("Distance within threshold, no change to last distance");
    return false; // No change to last distance
  }
}


// Draw hand (connections + landmarks)
export function drawHand(ctx, landmarks) {
  drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 5
  });
  drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 3 });
}

// Draw progress bar
export function drawProgressBar(ctx, progress) {
  // Draw a horizontal progress bar at the bottom of the canvas
  // Ensure 'x', 'y', 'width', 'height' are relative to the canvas size
  const canvasWidth = ctx.canvas.width; // Get the current drawing width of the canvas
  const canvasHeight = ctx.canvas.height; // Get the current drawing height of the canvas
  const barWidth = canvasWidth * 0.7; // Progress bar width is 70% of canvas width
  const barHeight = canvasHeight * 0.06; // Progress bar width is 6% of canvas width
  const barX = (barWidth - 0.66 * canvasWidth);
  const barY = canvasHeight - (barHeight * 2);
  
  ctx.save(); // saves current drawing state (eg. color, font, etc.)
  // Background 
  ctx.fillStyle = '#444';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  // Gradient fill
  const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  grad.addColorStop(0, '#d90000');
  grad.addColorStop(0.5, '#ff0');
  grad.addColorStop(1, '#0f0');
  ctx.fillStyle = grad;
  ctx.fillRect(barX, barY, (progress / 100) * barWidth, barHeight);
  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  // Text
  ctx.fontSize = Math.max(12, barHeight * 0.8);   // Calculate font size relative to bar height or canvas height
  ctx.font = `${ctx.fontSize}px Monospace`;
  ctx.fillStyle = '#fff';
  ctx.fillText(`${Math.round(progress)}%`, barX + barWidth + (canvasWidth * 0.03), barY + (barHeight / 1.5));
  ctx.restore(); // restores the saved drawing state 
}

// Second version of the progress bar particularly for adduction
export function drawProgressBarV2(ctx, progress) {
  // Draw a horizontal progress bar at the bottom of the canvas
  // Ensure 'x', 'y', 'width', 'height' are relative to the canvas size
  const canvasWidth = ctx.canvas.width; // Get the current drawing width of the canvas
  const canvasHeight = ctx.canvas.height; // Get the current drawing height of the canvas
  const barWidth = canvasWidth * 0.23; // Progress bar width is 70% of canvas width
  const barHeight = canvasHeight * 0.035; // Progress bar width is 6% of canvas width
  
  for (let i = progress.length - 1; i >= 0; i--) {
    const barX = canvasWidth * 0.25 - (barWidth - i * canvasHeight * 0.6) //(barWidth - (0.3) * canvasWidth*i);
    const barY = canvasHeight - (barHeight * 2);
    
    ctx.save(); // saves current drawing state (eg. color, font, etc.)
    // Background 
    ctx.fillStyle = '#444';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // Gradient fill
    const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    grad.addColorStop(0, '#d90000');
    grad.addColorStop(0.5, '#ff0');
    grad.addColorStop(1, '#0f0');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, (progress[i].value / 100) * barWidth, barHeight);
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    // Text
    ctx.fontSize = Math.max(12, barHeight * 0.8);   // Calculate font size relative to bar height or canvas height
    ctx.font = `${ctx.fontSize}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.fillText(`${progress[i].name}: ${Math.round(progress[i].value)}%`, barX, barY + (barHeight / 1.5) - (canvasHeight * 0.04));
    ctx.restore(); // restores the saved drawing state 
  }
}


export async function exportAngle_AccScoreData(angleHistory, accScoreHistory, timestampHistory, selectedFinger, action_mode, isNative) {
  const csvRows = [];
  csvRows.push(['Frame', 'Timestamp (in sec)', 'MP', 'PIP', 'DIP', 'Accuracy Score'].join(',')); // Header row with joint names and accuracy score
  for (let i = 0; i < angleHistory.length; i++) {
    const row = [
      i + 1,                // Frame number (starting from 1)
      (timestampHistory[i]/1000).toFixed(2),   // Timestamp for this frame (in sec)
      ...angleHistory[i],    // '...' spreads the angle values for this frame
      accScoreHistory[i]     // Accuracy score for this frame
    ];
    csvRows.push(row.join(','));
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed (that's why the +1); parms of .padStart(targetLengthOfString, stringToStartWith) 
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTimeString = `${day}-${month}_${hours}-${minutes}-${seconds}`;
  const fileName = `${selectedFinger}_${action_mode}_data ${dateTimeString}.csv`;


  if (isNative) { // for mobile devices
    const csvContent = csvRows.join('\n');

    const result = await Filesystem.writeFile({
      path: `FAIR Chance/${fileName}`,
      data: csvContent,
      directory: Directory.Documents,
      encoding: 'utf8', // for saving data as strings
      recursive: true,
    });
    
    await FileOpener.openFile({
            path: result.uri,
          });
    console.log(`File saved to device: ${result.uri}/${fileName}`);
  }
  else { // for web
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const fileUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `${fileName}`;
    a.click();
  }
}

export async function exportDistance_AccScoreData(distanceHistory, accScoreHistory, timestampHistory, selectedFinger, isNative) {
  const csvRows = [];
  if (!(selectedFinger === "allF")) {
    csvRows.push(['Frame', 'Timestamp (in sec)', `${selectedFinger}`, 'Accuracy Score'].join(',')); // Header row with joint names and accuracy score
  }
  else {
    csvRows.push(['Frame', 'Timestamp (in sec)', 'indexF', 'middleF', 'ringF', 'littleF'].join(',')); // Header row with joint names and accuracy score
  }
  
  for (let i = 0; i < distanceHistory.length; i++) {
    const row = [
      i + 1,                // Frame number (starting from 1)
      (timestampHistory[i]/1000).toFixed(2),   // Timestamp for this frame (in sec)
      distanceHistory[i],    // '...' spreads the angle values for this frame
      accScoreHistory[i]     // Accuracy score for this frame
    ];
    csvRows.push(row.join(','));
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed (that's why the +1); parms of .padStart(targetLengthOfString, stringToStartWith) 
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTimeString = `${day}-${month}_${hours}-${minutes}-${seconds}`;
  const fileName = `${selectedFinger}_opposition_data ${dateTimeString}.csv`;


  if (isNative) { // for mobile devices
    const csvContent = csvRows.join('\n');

    const result = await Filesystem.writeFile({
      path: `FAIR Chance/${fileName}`,
      data: csvContent,
      directory: Directory.Documents,
      encoding: 'utf8', // for saving data as strings
      recursive: true,
    });
    
    await FileOpener.openFile({
            path: result.uri,
          });
    console.log(`File saved to device: ${result.uri}/${fileName}`);
  }
  else { // for web
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const fileUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `${fileName}`;
    a.click();
  }
}