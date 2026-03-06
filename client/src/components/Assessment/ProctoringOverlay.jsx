import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './ProctoringOverlay.css';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const ProctoringOverlay = ({ onViolation, violationCount, maxViolations = 3 }) => {
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [status, setStatus] = useState('Initializing AI...');
    const [isViolation, setIsViolation] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatus('Loading AI Models...');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setStatus('AI Ready');
                startVideo();
            } catch (err) {
                console.error("Error loading models:", err);
                setStatus('AI Load Failed');
            }
        };

        const startVideo = () => {
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Webcam access error:", err);
                    setStatus('Webcam Access Denied');
                });
        };

        loadModels();

        // Tab Switching Detection
        const handleVisibilityChange = () => {
            if (document.hidden) {
                onViolation('Tab Switch Detected');
            }
        };

        const handleBlur = () => {
            onViolation('Window Focus Lost');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!modelsLoaded) return;

        const detectFace = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            );

            if (detections.length === 0) {
                setIsViolation(true);
                setStatus('No Face Detected!');
                onViolation('No Face Detected');
            } else if (detections.length > 1) {
                setIsViolation(true);
                setStatus('Multiple Faces Detected!');
                onViolation('Multiple Faces Detected');
            } else {
                setIsViolation(false);
                setStatus('Monitoring Active');
            }
        };

        intervalRef.current = setInterval(detectFace, 2000); // Check every 2 seconds

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [modelsLoaded]);

    return (
        <div className={`proctoring-container ${isViolation ? 'violation' : ''}`}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="proctoring-video"
            />
            <div className={`proctoring-status ${isViolation ? 'warning' : ''}`}>
                {status} {isViolation ? '' : `(${violationCount}/${maxViolations})`}
            </div>
            {!modelsLoaded && <div className="proctoring-loading">Loading AI...</div>}
        </div>
    );
};

export default ProctoringOverlay;
