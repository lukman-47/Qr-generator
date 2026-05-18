import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { 
  Download, 
  Link as LinkIcon, 
  Palette, 
  Image as ImageIcon, 
  Circle, 
  Square, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  Share2, 
  Copy, 
  UploadCloud, 
  X
} from 'lucide-react';
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
  const [inputType, setInputType] = useState('url');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0d0f12');
  
  const [originalLogo, setOriginalLogo] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [processedLogo, setProcessedLogo] = useState(null);
  const [logoShape, setLogoShape] = useState('original');
  
  // Responsive QR Canvas Size
  const [qrSize, setQrSize] = useState(300);
  
  // Custom Sharing States
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  
  const qrRef = useRef();
  const fileInputRef = useRef();
  const mainShareContainerRef = useRef();

  useEffect(() => {
    axios.post('/api/analytics/visit').catch(err => console.log(err));

    // Handle viewport resize for fluid QR canvas size
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setQrSize(220);
      } else if (window.innerWidth < 768) {
        setQrSize(260);
      } else {
        setQrSize(300);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (mainShareContainerRef.current && !mainShareContainerRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
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
      setLogoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalLogo(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setOriginalLogo(null);
      setLogoName('');
    }
  };

  const clearLogo = () => {
    setOriginalLogo(null);
    setLogoName('');
    setProcessedLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getActiveDataValue = () => {
    return inputType === 'url' ? url :
           inputType === 'phone' ? `tel:+91${phoneNumber}` :
           `https://wa.me/91${phoneNumber}`;
  };

  // Download Main QR
  const downloadQR = () => {
    axios.post('/api/analytics/generate').catch(err => console.log(err));

    const canvasContainer = qrRef.current;
    if (canvasContainer) {
      const canvas = canvasContainer.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = 'custom-qr-code.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 'image/png');
      }
    }
  };

  // High-fidelity Share Main QR Code
  const shareQR = async (e) => {
    e.stopPropagation();
    const canvasContainer = qrRef.current;
    if (!canvasContainer) return;
    const canvas = canvasContainer.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'my-custom-qr.png', { type: 'image/png' });

      // Try Web Share API (native share on mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My Custom QR Code',
            text: 'Check out the custom branded QR code I just generated!',
          });
          axios.post('/api/analytics/generate').catch(err => console.log(err));
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User cancelled
          console.error('Web Share failed:', err);
        }
      }

      // Show Desktop / Fallback Dropdown
      setShowShareDropdown(prev => !prev);
    }, 'image/png');
  };

  // Copy Main QR Image to Clipboard
  const copyQRImageToClipboard = () => {
    const canvasContainer = qrRef.current;
    if (!canvasContainer) return;
    const canvas = canvasContainer.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        alert('QR Code image copied to clipboard!');
        setShowShareDropdown(false);
      } catch (err) {
        console.error(err);
        alert('Could not copy image directly. Please right click / long press to save it.');
      }
    }, 'image/png');
  };

  // Copy URL to Clipboard
  const copyQRLinkToClipboard = () => {
    navigator.clipboard.writeText(getActiveDataValue())
      .then(() => {
        alert('QR code target link copied to clipboard!');
        setShowShareDropdown(false);
      })
      .catch(err => console.error(err));
  };

  const shareTextLink = (network) => {
    const textUrl = getActiveDataValue();
    let shareUrl = '';
    
    if (network === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this custom QR: ' + textUrl)}`;
    } else if (network === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this branded QR!')}&url=${encodeURIComponent(textUrl)}`;
    } else if (network === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(textUrl)}`;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShowShareDropdown(false);
    }
  };

  return (
    <div className="container">
      <h1>QR Code Generator</h1>
      <p className="subtitle">Create custom, branded QR codes instantly.</p>

      <div className="glass-panel">
        <div className="generator-layout">
          <div className="customization-panel">
            <div className="input-group">
              {/* Premium iOS/Android-style Segmented Control Selector */}
              <div className="segmented-control">
                <button 
                  className={`segmented-button ${inputType === 'url' ? 'active' : ''}`} 
                  onClick={() => setInputType('url')}
                >
                  <LinkIcon size={16} /> URL
                </button>
                <button 
                  className={`segmented-button ${inputType === 'phone' ? 'active' : ''}`} 
                  onClick={() => setInputType('phone')}
                >
                  <Phone size={16} /> Phone
                </button>
                <button 
                  className={`segmented-button ${inputType === 'whatsapp' ? 'active' : ''}`} 
                  onClick={() => setInputType('whatsapp')}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>

              {inputType === 'url' ? (
                <>
                  <label><LinkIcon size={16} style={{display:'inline', marginRight:'8px'}}/> Destination URL</label>
                  <input 
                    type="text" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="https://"
                  />
                </>
              ) : (
                <>
                  <label>
                    {inputType === 'whatsapp' ? <MessageCircle size={16} style={{display:'inline', marginRight:'8px'}}/> : <Phone size={16} style={{display:'inline', marginRight:'8px'}}/>} 
                    Phone Number (+91 India Only)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>+91</span>
                    <input 
                      type="text" 
                      value={phoneNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setPhoneNumber(val);
                      }} 
                      placeholder="Enter 10-digit number"
                      style={{ flex: 1 }}
                    />
                  </div>
                  {inputType === 'whatsapp' && phoneNumber.length === 10 && (
                    <button 
                      className="btn" 
                      style={{ marginTop: '1rem', width: '100%', background: '#25D366', color: '#fff', border: 'none', gap: '8px' }}
                      onClick={() => window.open(`https://wa.me/91${phoneNumber}`, '_blank')}
                    >
                      <MessageCircle size={20} />
                      Test Link on WhatsApp
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="input-group">
              <label><Palette size={16} style={{display:'inline', marginRight:'8px'}}/> Color Customization</label>
              <div className="color-picker-grid">
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

            {/* Premium Center Logo Uploader */}
            <div className="input-group" style={{marginTop: '2rem'}}>
              <label><ImageIcon size={16} style={{display:'inline', marginRight:'8px'}}/> Center Logo (Optional)</label>
              <div className="file-upload-wrapper">
                <label className="file-upload-button">
                  <UploadCloud size={20} />
                  <span>{logoName ? 'Change Logo Image' : 'Select Logo Image'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload} 
                    className="file-upload-input"
                  />
                </label>
                
                {logoName && (
                  <div className="file-info">
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{logoName}</span>
                    <button onClick={clearLogo} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {originalLogo && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className={`btn ${logoShape === 'original' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('original')}
                    style={{ padding: '0.5rem 1rem', flex: 1, minWidth: '90px', fontSize: '0.85rem' }}
                  >
                    <ImageIcon size={14} /> Original
                  </button>
                  <button 
                    className={`btn ${logoShape === 'square' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('square')}
                    style={{ padding: '0.5rem 1rem', flex: 1, minWidth: '90px', fontSize: '0.85rem' }}
                  >
                    <Square size={14} /> Square
                  </button>
                  <button 
                    className={`btn ${logoShape === 'circle' ? '' : 'btn-secondary'}`} 
                    onClick={() => setLogoShape('circle')}
                    style={{ padding: '0.5rem 1rem', flex: 1, minWidth: '90px', fontSize: '0.85rem' }}
                  >
                    <Circle size={14} /> Circle
                  </button>
                </div>
              )}
            </div>
            
            <div className="action-buttons-row" style={{ marginTop: '2.5rem' }}>
              <button className="btn" onClick={downloadQR} style={{ flex: 1 }}>
                <Download size={20} />
                Download PNG
              </button>
              
              {/* Main Sharing Container */}
              <div className="share-action-container" ref={mainShareContainerRef} style={{ flex: 1, marginTop: 0 }}>
                <button className="btn btn-secondary" onClick={shareQR}>
                  <Share2 size={20} />
                  Share QR
                </button>
                
                {showShareDropdown && (
                  <div className="share-dropdown down">
                    <button className="share-item" onClick={copyQRImageToClipboard}>
                      <Copy size={16} /> Copy QR Image
                    </button>
                    <button className="share-item" onClick={copyQRLinkToClipboard}>
                      <LinkIcon size={16} /> Copy Link
                    </button>
                    <button className="share-item" onClick={() => shareTextLink('whatsapp')}>
                      <MessageCircle size={16} /> Share on WhatsApp
                    </button>
                    <button className="share-item" onClick={() => shareTextLink('twitter')}>
                      <ExternalLink size={16} /> Share on Twitter/X
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="qr-preview">
            <div ref={qrRef} style={{ display: 'inline-flex', padding: '0.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <QRCodeCanvas
                value={getActiveDataValue()}
                size={qrSize}
                bgColor={bgColor}
                fgColor={fgColor}
                level={"H"}
                includeMargin={true}
                imageSettings={processedLogo ? {
                  src: processedLogo,
                  x: undefined,
                  y: undefined,
                  height: Math.floor(qrSize * 0.2),
                  width: Math.floor(qrSize * 0.2),
                  excavate: true,
                } : undefined}
              />
            </div>
            <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>Live Preview</p>
          </div>
        </div>
      </div>

      {/* Simple, Clean personal website QR code section */}
      <div style={{ marginTop: '4rem', textAlign: 'center', width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
          <ExternalLink size={24} color="var(--accent-color)" />
          Visit My Website
        </h2>
        <div className="glass-panel" style={{ padding: '2rem', display: 'inline-block', maxWidth: '340px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', padding: '0.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginBottom: '1rem' }}>
            <img 
              src={personalQR} 
              alt="Shaikh Lukman Personal QR Code" 
              style={{ width: '220px', height: '220px', borderRadius: '8px', display: 'block' }} 
            />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
            Scan the QR code above to visit my portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}
