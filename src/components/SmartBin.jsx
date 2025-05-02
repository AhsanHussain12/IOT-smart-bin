import React, { useEffect, useState, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
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

// Log the config to check if it's loaded correctly
console.log("Firebase Config:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Loaded" : "Missing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "Loaded" : "Missing",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ? "Loaded" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Loaded" : "Missing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "Loaded" : "Missing",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Loaded" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Loaded" : "Missing"
});

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
        setBinData(prevData => ({
          ...prevData,
          ...data
        }));
      }
    }, (error) => {
      console.error("Firebase read failed:", error);
    });

    // Cleanup the listener when component unmounts
    return () => unsubscribe();
  }, []);

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