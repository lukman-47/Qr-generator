import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { Download, Link as LinkIcon, Palette, Image as ImageIcon, Circle, Square, ExternalLink } from 'lucide-react';
import personalQR from '../assets/personal-qr.png';

const processImageToShape = (imageSrc, shape) => {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve(null);
    if (shape === 'original') return resolve(imageSrc);

    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
  });
};

export default function Home() {
  const [url, setUrl] = useState('https://example.com');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0d0f12');
  
  const [originalLogo, setOriginalLogo] = useState(null);
  const [processedLogo, setProcessedLogo] = useState(null);
  const [logoShape, setLogoShape] = useState('original');
  
  const qrRef = useRef();

  useEffect(() => {
    axios.post('/api/analytics/visit').catch(err => console.log(err));
  }, []);

  useEffect(() => {
    if (!originalLogo) {
      setProcessedLogo(null);
      return;
    }
    processImageToShape(originalLogo, logoShape).then(dataUrl => {
      setProcessedLogo(dataUrl);
    });
  }, [originalLogo, logoShape]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalLogo(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setOriginalLogo(null);
    }
  };

  const downloadQR = () => {
    // Generate analytics silently
    axios.post('/api/analytics/generate').catch(err => console.log(err));

    const canvasContainer = qrRef.current;
    if (canvasContainer) {
      const canvas = canvasContainer.querySelector('canvas');
      if (canvas) {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'custom-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="container">
      <h1>QR Code Generator</h1>
      <p className="subtitle">Create custom, branded QR codes instantly.</p>

      <div className="glass-panel" style={{ marginBottom: '4rem' }}>
        <div className="generator-layout">
          <div className="customization-panel">
            <div className="input-group">
              <label><LinkIcon size={16} style={{display:'inline', marginRight:'8px'}}/> Destination URL</label>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://"
              />
            </div>

            <div className="input-group">
              <label><Palette size={16} style={{display:'inline', marginRight:'8px'}}/> Color Customization</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="color-picker-wrapper">
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                  <span style={{color: 'var(--text-muted)'}}>Foreground</span>
                </div>
                <div className="color-picker-wrapper">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                  <span style={{color: 'var(--text-muted)'}}>Background</span>
                </div>
              </div>
            </div>

            <div className="input-group" style={{marginTop: '2rem'}}>
              <label><ImageIcon size={16} style={{display:'inline', marginRight:'8px'}}/> Center Logo (Optional)</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
              
              {originalLogo && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    className={`btn ${logoShape === 'original' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('original')}
                    style={{ padding: '0.5rem 1rem', flex: 1 }}
                  >
                    <ImageIcon size={16} /> Original
                  </button>
                  <button 
                    className={`btn ${logoShape === 'square' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('square')}
                    style={{ padding: '0.5rem 1rem', flex: 1 }}
                  >
                    <Square size={16} /> Square
                  </button>
                  <button 
                    className={`btn ${logoShape === 'circle' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('circle')}
                    style={{ padding: '0.5rem 1rem', flex: 1 }}
                  >
                    <Circle size={16} /> Circle
                  </button>
                </div>
              )}
            </div>
            
            <button className="btn" onClick={downloadQR} style={{marginTop: '2rem'}}>
              <Download size={20} />
              Download High Quality PNG
            </button>
          </div>

          <div className="qr-preview">
            <div ref={qrRef}>
              <QRCodeCanvas
                value={url}
                size={300}
                bgColor={bgColor}
                fgColor={fgColor}
                level={"H"}
                includeMargin={true}
                imageSettings={processedLogo ? {
                  src: processedLogo,
                  x: undefined,
                  y: undefined,
                  height: 60,
                  width: 60,
                  excavate: true,
                } : undefined}
              />
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Live Preview</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ExternalLink size={24} color="var(--accent-color)" />
          Visit My Website
        </h2>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <img 
            src={personalQR} 
            alt="Shaikh Lukman Personal QR Code" 
            style={{ width: '250px', height: '250px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }} 
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scan the QR code above to visit my portfolio.</p>
        </div>
      </div>
    </div>
  );
}
