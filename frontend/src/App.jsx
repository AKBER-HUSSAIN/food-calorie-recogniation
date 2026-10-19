import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import PredictionResults from './components/PredictionResults';
import { AlertTriangle } from 'lucide-react';

// Auto-detect: use local backend in development, Render backend in production
const IS_LOCAL = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (IS_LOCAL ? 'http://127.0.0.1:8000' : 'https://food-calorie-recogniation.onrender.com');

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Backend Health State
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(true);

  // Check health on mount
  const checkBackendHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: 'degraded', model_loaded: false });
      }
    } catch (err) {
      setHealth({ status: 'offline', model_loaded: false, error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Periodic check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectFile = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPrediction(null);
    setError(null);
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select or drop an image file first.');
      return;
    }

    setIsPredicting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server responded with status ${response.status}`);
      }

      setPrediction(data);
    } catch (err) {
      console.error('Prediction request error:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'Unable to reach backend API. Please make sure the FastAPI server is running on http://127.0.0.1:8000.'
          : err.message
      );
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <Header
        health={health}
        checkingHealth={checkingHealth}
        onRefreshHealth={checkBackendHealth}
      />

      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {/* Hero */}
        <section
          style={{
            textAlign: 'center',
            maxWidth: '640px',
            margin: '0 auto 40px',
          }}
          className="animate-fade-in-up"
        >
          <h2
            style={{
              fontSize: 'clamp(26px, 5vw, 40px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0 0 12px 0',
            }}
          >
            Know what's on{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-coral))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              your plate.
            </span>
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.7,
              margin: '0 auto',
              maxWidth: '520px',
            }}
          >
            Upload a food photo and our AI identifies the dish from 116 categories, then estimates calories, protein, carbs, and fat — all in seconds.
          </p>

          {/* Model badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px',
            }}
          >
            <ModelBadge label="EfficientNetB0" detail="116 classes" />
            <ModelBadge label="Nutrition5k" detail="Regressor" />
          </div>
        </section>

        {/* Error banner */}
        {error && (
          <div
            style={{
              maxWidth: '960px',
              margin: '0 auto 24px',
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid var(--nutrition-calories-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
            className="animate-slide-down"
            role="alert"
          >
            <AlertTriangle size={18} style={{ color: 'var(--status-error)', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-error)', display: 'block', marginBottom: '2px' }}>
                Analysis Failed
              </strong>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Main 2-column grid */}
        <div className="main-grid">

          <div className="grid-left">
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onSelectFile={handleSelectFile}
              onReset={handleReset}
              onPredict={handlePredict}
              isPredicting={isPredicting}
              disabled={health?.status === 'offline'}
            />
          </div>

          <div className="grid-right">
            <PredictionResults
              result={prediction}
              isPredicting={isPredicting}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <p style={{ margin: 0 }}>
          NutriLens — Food Recognition & Calorie Estimation Using Machine Learning
        </p>
      </footer>

      {/* Responsive grid styles */}
      <style>{`
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (min-width: 960px) {
          .main-grid {
            grid-template-columns: 7fr 5fr;
          }
        }

      `}</style>
    </div>
  );
}

/* Small badge component for model info */
function ModelBadge({ label, detail }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ color: 'var(--text-muted)' }}>·</span>
      <span>{detail}</span>
    </span>
  );
}
