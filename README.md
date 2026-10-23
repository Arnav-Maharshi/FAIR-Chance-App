# F.A.I.R. Chance App© – Fine-motor Movements Assessment WebApp Tool

*(Note: This is the main repository for the live web application. For the initial Python computer vision engine and early prototypes, please see the [FAIR Chance Development repository](https://github.com/Arnav-Maharshi/F.A.I.R._Chance).)*

<p align="center">
  <img src="Demo Videos\GIFs\Abduction Demo 2 with annotations.gif" width="600"></img>
</p>

### [***<u>Click here to use F.A.I.R. Chance</u>***](https://arnav-maharshi.github.io/FAIR-Chance-App/)

## Overview
**F.A.I.R. Chance©** (Fine-motor Artificial Intelligence-assisted Rehabilitation Chance) is a browser-based application that tracks and analyzes hand and finger movements in real time. Designed to aid fine motor rehabilitation, the software processes standard camera feeds entirely on-device to calculate joint angles, track range of motion (ROM), and deliver objective numerical metrics to users and healthcare providers. 

## Key Features
*   **Real-Time Tracking:** Uses computer vision to detect and track fine motor actions in real-time, focusing on joint-level movements such as flexion/extension, abduction/adduction, and thumb opposition.
*   **Signal Smoothing:** Implements Exponential Moving Average (EMA) to eliminate landmark tracking jitter for precise assessment of fine motor movements.
*   **Objective Metrics:** Replaces subjective observation by estimating the accuracy of the performed movement in real-time. The numerical feedback further helps health professionals evaluate recovery progress effectively. 
*   **Accessible Hardware:** Runs entirely on a device's in-built front-camera (laptop or smartphone) directly through the web browser, requiring no app installations, specialized hardware, or external sensors.

## Tech Stack
*   **Languages:** JavaScript, HTML5, CSS3
*   **Libraries & Frameworks:** MediaPipe (for on-device, in-browser vision processing)

## medRxiv Preprint of Reliability & Validity Study
**"Reliability and Concurrent Validity of a Computer Vision-Based Tool for Quantitative Finger Movement Analysis"** (medRxiv): [https://doi.org/10.64898/2026.05.21.26353446](https://doi.org/10.64898/2026.05.21.26353446)

## Oral Paper presentation @ World Disability and Rehabilitation Conference (WDRC)
[**Video link to oral paper presentation at the 10th World Disability and Rehabilitation Conference 2025**](https://youtu.be/MJeTiIQR9XE?si=4dEQDGvXFKa-G5Ps) 

## Demo Videos
Short Demo video: https://youtu.be/Bii52_UkTgI
<br>
Long Demo video: https://youtu.be/Oi1yhIx0s3M
<br>
Explainer video: https://youtu.be/vOkwv7VkoUo



### App Demo (on smartphone)

<table>
  <!-- Row 1: The Media Items -->
  <tr>
    <td align="center">
        <img src="Demo Videos\GIFs\Abduction Phone Demo.gif" height="250" >
    </td>
    <td align="center">
        <img src="Demo Videos/GIFs/Flexion Phone Demo.gif" height="250">
    </td>
  </tr>
  
  <!-- Row 1: The Captions -->
  <tr>
    <td align="center"><b>Abduction movement</b><br>(Spreading fingers apart)</td>
    <td align="center"><b>Flexion movement</b><br>(Bending finger while keeping it straight)</td>
  </tr>


  <!-- Row 2: The Media Items -->
  <tr>
    <td align="center">
        <img src="Demo Videos\GIFs\Extension Phone Demo.gif" height="250" >
    </td>
    <td align="center">
        <img src="Demo Videos\GIFs\Opposition Demo.gif" height="250" >
    </td>
  </tr>

  <!-- Row 2: Captions -->
  <tr>
    <td align="center"><b>Extension movement</b><br>(Extending/straightening finger)</td>
    <td align="center"><b>Opposition of Thumb</b><br>(Touching thumb tip to another finger tip)</td>
  </tr>
    
</table>

<br><br>

### Website Demo videos

<table>
  <!-- Row 1: The Media Items -->
  <tr>
    <td align="center">
        <img src="Demo Videos\GIFs\Abduction Demo 2.gif" width="600" >
    </td>
    <td align="center">
        <img src="Demo Videos\GIFs\Flexion Demo.gif" width="600">
    </td>
  </tr>
  
  <!-- Row 1: The Captions -->
  <tr>
    <td align="center"><b>Abduction movement</b><br>(Spreading fingers apart)</td>
    <td align="center"><b>Flexion movement</b><br>(Bending finger while keeping it straight)</td>
  </tr>


  <!-- Row 2: The Media Items -->
  <tr>
    <td align="center">
        <img src="Demo Videos\GIFs\Thumb Abduction.gif" width="600" >
    </td>
    
  </tr>

  <!-- Row 1: The Captions -->
  <tr>
    <td align="center"><b>Thumb Abduction movement</b><br>(Spreading thumb apart)</td>

  </tr>
    
</table>



## License
```text
Copyright © 2026 Arnav M.

This software is registered with the Copyright Office, Government of India under the Copyright Act, 1957.

Registration Number: L-159158/2025
Date of Registration: 02-01-2025

ALL RIGHTS RESERVED.
UNAUTHORIZED COPYING, MODIFICATION, DISTRIBUTION, OR USE OF THIS SOFTWARE, IN WHOLE OR IN PART, IS STRICTLY PROHIBITED WITHOUT THE EXPRESS WRITTEN CONSENT OF THE COPYRIGHT HOLDER

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For licensing inquiries, please contact: [arnavmaharshi@gmail.com]