import React, { useEffect, useState, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import emailjs from '@emailjs/browser';
import './SmartBin.css';
import binImage from '../assets/dustbin.svg';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const SmartBin = () => {
  const [binData, setBinData] = useState({
    binFilled: 0,
    binHeight: 0,
    binLidSensor: "disconnected",
    binStoreSensor: "disconnected",
    lid: "closed",
    lidDistance: 0,
    servo: "disconnected",
    status: false
  });

  // Track if email has been sent
  const emailSentRef = useRef(false);

  const sendEmailNotification = useCallback(async (level) => {
    if (level > 80 && !emailSentRef.current) {
      try {
        const templateParams = {
          to_name: 'Ahsan',
          bin_level: level,
          date: new Date().toLocaleString(),
          message: `The smart bin is ${level}% full and needs attention.`,
          to_email: 'ahsan123hussain@gmail.com'
        };

        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          templateParams,
          EMAILJS_CONFIG.publicKey
        );

        console.log('Email notification sent successfully');
        emailSentRef.current = true;

        // Reset email sent flag after 1 hour
        setTimeout(() => {
          emailSentRef.current = false;
        }, 3600000); // 1 hour in milliseconds
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    } else if (level <= 85) {
      // Reset the email sent flag when level goes below 85%
      emailSentRef.current = false;
    }
  }, []);

  const getProgressBarColor = useCallback((level) => {
    return level > 80 ? '#FF4444' : '#4CAF50';
  }, []);

  const getStatusColor = useCallback((status) => {
    return status === "connected" ? '#4CAF50' : '#FF4444';
  }, []);

  const getLidColor = useCallback((status) => {
    return status === "open" ? '#2196F3' : '#FF9800';
  }, []);

  useEffect(() => {
    const binRef = ref(database, 'dustbin');
    
    // Set up the real-time listener
    const unsubscribe = onValue(binRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Use functional update to ensure we're working with the latest state
        setBinData(prevData => {
          const newData = {
            ...prevData,
            ...data
          };
          // Check bin level and send email if needed
          sendEmailNotification(newData.binFilled);
          return newData;
        });
      }
    }, (error) => {
      console.error("Firebase read failed:", error);
    });

    // Cleanup the listener when component unmounts
    return () => unsubscribe();
  }, [sendEmailNotification]);

  return (
    <div className="smart-bin-container">
      <div className="smart-bin-card">
        <h1 className="title">Smart Bin Dashboard</h1>
        
        <div className="bin-image-container">
          <img src={binImage} alt="Smart Bin" className="bin-image" />
          <div className="bin-level-indicator">
            <div 
              className="bin-level-fill"
              style={{
                width: `${binData.binFilled}%`,
                backgroundColor: getProgressBarColor(binData.binFilled),
                transition: 'width 0.5s ease, background-color 0.5s ease'
              }}
            />
          </div>
        </div>

        <div className="status-section">
          <div className="status-item">
            <span className="status-label">Bin Level</span>
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${binData.binFilled}%`,
                  backgroundColor: getProgressBarColor(binData.binFilled),
                  transition: 'width 0.5s ease, background-color 0.5s ease'
                }}
              />
            </div>
            <span className="status-value">{binData.binFilled}%</span>
          </div>

          <div className="status-item">
            <span className="status-label">Lid Status</span>
            <div 
              className="status-indicator"
              style={{ 
                backgroundColor: getLidColor(binData.lid),
                transition: 'background-color 0.3s ease'
              }}
            >
              {binData.lid}
            </div>
          </div>

          <div className="status-item">
            <span className="status-label">Lid Distance</span>
            <div className="status-value">{binData.lidDistance} cm</div>
          </div>

          <div className="sensor-status">
            <div className="status-item">
              <span className="status-label">Lid Sensor</span>
              <div 
                className="status-indicator"
                style={{ 
                  backgroundColor: getStatusColor(binData.binLidSensor),
                  transition: 'background-color 0.3s ease'
                }}
              >
                {binData.binLidSensor}
              </div>
            </div>

            <div className="status-item">
              <span className="status-label">Store Sensor</span>
              <div 
                className="status-indicator"
                style={{ 
                  backgroundColor: getStatusColor(binData.binStoreSensor),
                  transition: 'background-color 0.3s ease'
                }}
              >
                {binData.binStoreSensor}
              </div>
            </div>

            <div className="status-item">
              <span className="status-label">Servo</span>
              <div 
                className="status-indicator"
                style={{ 
                  backgroundColor: getStatusColor(binData.servo),
                  transition: 'background-color 0.3s ease'
                }}
              >
                {binData.servo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartBin; 