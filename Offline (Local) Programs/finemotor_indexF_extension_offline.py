# I have implemented user-defined functions for each major fine motor joint (currently only for thumb and index finger, as these need the most exercise)
import cv2
import mediapipe as mp
import numpy as np
import math
from matplotlib import pyplot as plt

# Open video capture
source = 0
cap = cv2.VideoCapture(source)  # Local video

# Setting resolution size
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

# For later use
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Initialize MediaPipe Pose
mp_hand = mp.solutions.hands
hands = mp_hand.Hands(static_image_mode=False, 
                    min_detection_confidence=0.8,
                    min_tracking_confidence=0.7)

mp_drawing = mp.solutions.drawing_utils  # For visualization of keypoints and connections

# Best to declare these as global variables  
prev_left_landmarks = None
prev_right_landmarks= None
prev_landmarks = None
def smooth_landmarks(landmarks, prev_landmarks, alpha):
    """
    Smooths the current landmarks with a weighted average of the previous landmarks.
    ** (Using EMA (Exponential Moving Average)) **

    Parameters:
    >landmarks: Current frame landmarks.
    >prev_landmarks: Previous frame landmarks.
    >alpha: Smoothing factor (0 < alpha < 1), closer to 1 means less smoothing.

    Returns:
    >smoothed_landmarks: Smoothed coordinates.
    """
    if prev_landmarks is None:
        return landmarks  # No previous landmark. Return the current ones as is
    
    smoothed_landmarks = []
    for curr, prev in zip(landmarks, prev_landmarks):
        smoothed = alpha * curr + (1 - alpha) * prev
        smoothed_landmarks.append(smoothed)
    return np.array(smoothed_landmarks)


# Measuring and displaying angles at index finger joints (MP, PIP, DIP)
def indexF(image, results): 

    joints_index_list = [[6,5,0], [7,6,5], [8,7,6]] 
    joints_name_list = ["MP", "PIP", "DIP"]
    angle_value_list = [[],[],[]]
    MP_score = None
    
    MP_score_list = [] # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label # Detecting Right or Left Hand

        #Loop through joints 
        for index, joint in enumerate(joints_index_list):
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
                 
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])

            ''' Flipping radian value for Right hand 
            as it's angle/coordinate measurement is opposite of Left hand. Basically standardizing
            
            Overall better for starting angle measurement from finger-flexed position'''  
            if hand_label == "Right":
                radians = -radians 

                # Normalising the Right hand angle reading to increase as finger extends/rises 
                # Without below code, Left Finger flexes -> Angle Decreases | Right Finger Flexes -> Angle Increases
                angle = np.abs((radians*180.0/np.pi) - 100) # Converting radians to angle
                angle = 360-angle
            else:
                angle = (radians*180.0/np.pi) - 100 # Converting radians to angle


            round_angle = round(angle)
            angle_value_list[index].append(round(angle))

            # Reserving MP joint values
            if index == 0: 
                MP_angle = round_angle

                # Calculating independent MP accuracy score
                MP_score = round((round_angle*100)/80.0) # Correct MP extension range: ?-70 degrees
                MP_score_list.append(MP_score) 

            # Reserving PIP joint values
            if index == 1: 
                PIP_angle = round_angle
                x = 800
                
                if PIP_angle >= 80: # Best
                    cv2.putText(image, "PERFECT! Keep it up!", (x, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2, cv2.LINE_AA)
                    
                elif 63 < PIP_angle < 80: # Good
                    cv2.putText(image, "Nice! You're doing great", (x, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (112,255,112), 2, cv2.LINE_AA)
                    
                elif 40 < PIP_angle < 63: # OK
                    cv2.putText(image, "Almost there! Just a bit more", (x, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 246, 255), 2, cv2.LINE_AA)
                    
                elif 20 < PIP_angle < 40: # Bad
                    cv2.putText(image, "That's the spirit! Keep going!", (x, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (79,79,255), 2, cv2.LINE_AA)

                elif PIP_angle < 20: # Worst
                    cv2.putText(image, "Try keeping your finger straight", (x, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2, cv2.LINE_AA)
                    


            joint_name = joints_name_list[index] # OR mp_hand.HandLandmark(joint[1]).name  
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            score_text = '{} Accuracy Score: {} %'.format(hand_label, MP_score)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(image, score_text, (100, 670), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)

    return image, angle_value_list


##################################################################################



# Main loop
while cv2.waitKey(1) != 27:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1) # Flipping input so that it mirrors movements directly
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # BGR 2 RGB
    
    # Detections
    results = hands.process(image)
    
    # Rendering results
    if results.multi_hand_landmarks:
        smoothed_landmarks = []

        alpha_val = 0.5 # Lower value -> More Smoothing -> Less fluctuations in accuracy score 
       
        for num, hand in enumerate(results.multi_hand_landmarks):
            hand_label = results.multi_handedness[num].classification[0].label # Detecting Right or Left Hand

            # Extract landmark positions
            landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand.landmark])

            # Seperating smoothing of left & right hand to prevent mismatched smoothing
            if hand_label == "Left":
                smoothed_landmarks = smooth_landmarks(landmarks, prev_left_landmarks, alpha_val)
                prev_left_landmarks = smoothed_landmarks # Update previous landmarks for the next frame

            if hand_label == "Right":
                smoothed_landmarks = smooth_landmarks(landmarks, prev_right_landmarks, alpha_val)
                prev_right_landmarks = smoothed_landmarks # Update previous landmarks for the next frame
            

            # Apply smoothed landmarks back to hand for rendering
            for i, lm in enumerate(hand.landmark):
                lm.x, lm.y, lm.z = smoothed_landmarks[i]

            mp_drawing.draw_landmarks(frame, hand, mp_hand.HAND_CONNECTIONS, 
                                    mp_drawing.DrawingSpec(color=(60, 160, 0), thickness=2, circle_radius=4), # Landmarks graphic
                                    mp_drawing.DrawingSpec(color=(250, 44, 250), thickness=2, circle_radius=2), # Connection line graphic
                                        )
        
        # Measuring angle of particular joint (Call respective function)
        frame, accuracy = indexF(frame, results) 
           
    # Show the output with skeleton overlay
    cv2.imshow('FAIR Chance Straight IndexF Extension Feedback (Grouped Angles)', frame)

# Release resources

cap.release()
cv2.destroyAllWindows()
