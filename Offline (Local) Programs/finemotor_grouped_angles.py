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


# Measuring and displaying angle of index finger MP joint movement
# Hand orientation: Lateral/side view, other fingers flexed (CLICK REFERENCE PHOTO)
def indexF(image, results): 

    joints_index_list = [[6,5,0], [7,6,5], [8,7,6]] 
    joints_name_list = ["MP", "PIP", "DIP"]
    acc_percent_list = [] # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label # Detecting Right or Left Hand

        #Loop through joints 
        for index, joint in enumerate(joints_index_list):
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
                 
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = np.abs(180 - (radians*180.0/np.pi)) # Converting radians to angle
            
            # Normalising the angle to a 0–180 degree range
            if angle > 180.0:
                angle = np.abs(360-angle)

            round_angle = round(angle)

            # Calculating accuracy percentage
            acc_percent = round((round_angle*100)/77.0) # Correct flexion range: 67-77 degrees
            acc_percent_list.append(acc_percent)

            joint_name = joints_name_list[index] # OR mp_hand.HandLandmark(joint[1]).name  
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            percent_text = '{} {} Accuracy Score: {} %'.format(hand_label, joint_name, acc_percent)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            #cv2.putText(image, percent_text, (100, 670), 
                        #cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_percent_list


# Measuring and displaying angle of index finger PIP joint movement
# Hand orientation: Lateral/side view, other fingers flexed
def middleF(image, results): 
    
    joints_index_list = [[10,9,0], [11,10,9], [12,11,10]]
    joints_name_list = ["MP", "PIP", "DIP"]
    acc_percent_list = []  # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label # Detecting Right or Left Hand
        
        # Loop through joints 
        for index, joint in enumerate(joints_index_list):
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
            
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = np.abs(180 - (radians*180.0/np.pi)) # Converting radians to angle
            
            # Normalising the angle to a 0–180 degree range
            if angle > 180.0:
                angle = np.abs(360-angle)

            round_angle = round(angle)

            # Calculating accuracy percentage
            acc_percent = round((round_angle*100)/110.0) # Correct flexion range: 95-110 degrees
                                                            # Hyperflexion angle: above 130 degrees
            acc_percent_list.append(acc_percent)

            joint_name = joints_name_list[index] #OR mp_hand.HandLandmark(joint[1]).name          
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            percent_text = '{} {}: {} %'.format(hand_label, joint_name, acc_percent)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            #cv2.putText(image, percent_text, (500, 670), 
                       # cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_percent_list


# Measuring and displaying angle of ring finger DIP joint movement
# Hand orientation: Lateral/side view, other fingers flexed
def ringF(image, results): 
    
    joints_index_list = [[14,13,0], [15,14,13], [16,15,14]]
    joints_name_list = ["MP", "PIP", "DIP"]
    acc_percent_list = []  # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label # Detecting Right or Left Hand    

        #Loop through joints 
        for index, joint in enumerate(joints_index_list):
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
            
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = round(np.abs(180 - (radians*180.0/np.pi)))  # Converting radians to angle

            # Normalising the angle to a 0–180 degree range
            if angle > 180.0:
                angle = np.abs(360-angle)

            round_angle = round(angle)

            acc_percent = round((round_angle*100)/70.0) # Correct flexion range: 50-70 degrees
                                                        # Hyperflexion angle: above 100 degrees
            acc_percent_list.append(acc_percent)

            joint_name = joints_name_list[index] # OR mp_hand.HandLandmark(joint[1]).name          
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            percent_text = '{} {}: {} %'.format(hand_label, joint_name, acc_percent)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            #cv2.putText(image, percent_text, (500, 670), 
                     #   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_percent_list


# Measuring and displaying angle of pinky finger joint movement
# Hand orientation: Palm facing the camera
def pinkyF(image, results):
    
    joints_index_list = [[18,17 ,0], [19,18,17], [20,19,18]]
    joints_name_list = ["MP", "PIP", "DIP"]
    acc_percent_list = []  # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label  # Detecting Right or Left Hand    

        #Loop through joints 
        for index, joint in enumerate(joints_index_list): # Angle measurement relative to vertically adjacent joints
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
            
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = np.abs(180 - (radians*180.0/np.pi)) # Converting radians to angle

            # Normalising the angle to a 0–180 degree range
            if angle > 180.0:
                angle = np.abs(360-angle)

            round_angle = round(angle)

            acc_percent = round((round_angle*100)/70.0) # Correct flexion range: 55-70 degrees
                                                        # Hyperflexion angle: above 100 segrees
            acc_percent_list.append(acc_percent)

            joint_name = joints_name_list[index] # OR mp_hand.HandLandmark(joint[1]).name         
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            percent_text = '{} {}: {} %'.format(hand_label, joint_name, acc_percent)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            #cv2.putText(image, percent_text, (500, 670), 
                       # cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_percent_list


# Measuring and displaying angle of thumb IP joint movement
# Hand orientation: Palm facing the camera
def thumbF(image, results):
    
    joints_index_list = [[3,2,1], [4,3,2]]
    joints_name_list = ["MP", "PIP"]
    acc_percent_list = []  # For storing real-time accuracy percentage

    # Loop through hands
    for index, hand in enumerate(results.multi_hand_landmarks):
        hand_label = results.multi_handedness[index].classification[0].label  # Detecting Right or Left Hand    

        #Loop through joints 
        for index, joint in enumerate(joints_index_list): # Angle measurement relative to vertically adjacent joints
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y]) # Second coord
            c = np.array([hand.landmark[joint[2]].x, hand.landmark[joint[2]].y]) # Third coord
            
            radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = np.abs(180 - (radians*180.0/np.pi)) # Converting radians to angle

            # Normalising the angle to a 0–180 degree range
            if angle > 180.0:
                angle = np.abs(360-angle)

            round_angle = round(angle)

            acc_percent = round((round_angle*100)/70.0) # Correct flexion range: 55-70 degrees
                                                        # Hyperflexion angle: above 100 segrees
            acc_percent_list.append(acc_percent)

            joint_name = joints_name_list[index] # OR mp_hand.HandLandmark(joint[1]).name       
            angle_text = '{} {}: {}'.format(hand_label, joint_name, round_angle) # Angle measurement at joint
            percent_text = '{} {}: {} %'.format(hand_label, joint_name, acc_percent)
            joint_coord = tuple(np.multiply(b, [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, angle_text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            #cv2.putText(image, percent_text, (500, 670), 
                      #  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_percent_list

# Measuring and displaying distance of thumb protrusion. (Distance between index MP joint and thumb tip)
# Hand orientation: Palm facing the camera
def thumb_prot(image, results):
    
    acc_distance_list = [] # For storing real-time accuracy percentage

    # Loop through hands
    for hand in results.multi_hand_landmarks:  # Distance between index MP joint and thumb tip

        #Loop through joints 
        for joint in [[1,4]]:  
            a = np.array([hand.landmark[joint[0]].x, hand.landmark[joint[0]].y, hand.landmark[joint[0]].z]) # First coord
            b = np.array([hand.landmark[joint[1]].x, hand.landmark[joint[1]].y, hand.landmark[joint[1]].z]) # Second coord
            
            distance = round(0.30 - math.dist(a, b), 2) 
            acc_distance_list.append(distance)

            
            text = '{}'.format(distance)
            joint_coord = tuple(np.multiply([b[0], b[1]], [frame_width, frame_height]).astype(int)) # Main joint coordinates

            cv2.putText(image, text, joint_coord, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

    return image, acc_distance_list




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
    cv2.imshow('FAIR Chance Individual Angle', frame)

# Release resources

cap.release()
cv2.destroyAllWindows()