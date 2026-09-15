# Use a lightweight official Python image as the base
# It's good practice to specify a version for stability.
# Use a version that matches your development environment if possible.
# Examples: python:3.9-slim-buster, python:3.10-slim-buster, python:3.11-slim-buster
FROM python:3.12 

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required by OpenCV for non-headless mode
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libxext6 \
    libsm6 \
    # Add other dependencies if your specific OpenCV usage requires them
    # ffmpeg # Sometimes needed if you're working with video files extensively
    && rm -rf /var/lib/apt/lists/* # Clean up apt cache


# Copy the requirements.txt file first to leverage Docker's build cache.
# If requirements.txt doesn't change, this step won't re-run on subsequent builds.
COPY requirements.txt .

# Install the Python dependencies
# --no-cache-dir reduces the image size by not storing pip cache.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Expose the port your Flask application will listen on.
# Flask's default is 5000. Railway will route traffic to this port.
EXPOSE 5000

# Command to run your Flask application.
# IMPORTANT:
# 1. Replace 'your_app_file.py' with the actual name of your main Flask file (e.g., 'app.py').
# 2. If you have your Flask app instance named 'application' in 'main.py', use 'main:application'.
#
# For development/simple apps (less recommended for production):
# CMD ["python", "your_app_file.py"]

# Recommended for production using Gunicorn (more robust and scalable):
# First, ensure 'gunicorn' is in your requirements.txt.
# CMD ["gunicorn", "--bind", "0.0.0.0:5000", "your_app_file:your_flask_app_instance_name"]
# Example if your app is in app.py and your Flask instance is named 'app':
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]