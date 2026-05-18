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
  X, 
  RefreshCw,
  Check
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
  const [showcaseShareDropdown, setShowcaseShareDropdown] = useState(false);
  
  // Showcase 2nd Image Uploader
  const [showcaseImage, setShowcaseImage] = useState(localStorage.getItem('showcaseImage') || null);
  const [showcaseFileName, setShowcaseFileName] = useState(localStorage.getItem('showcaseFileName') || '');
  
  const qrRef = useRef();
  const fileInputRef = useRef();
  const showcaseInputRef = useRef();
  const mainShareContainerRef = useRef();
  const showcaseShareContainerRef = useRef();

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

  // Close dropdowns if clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (mainShareContainerRef.current && !mainShareContainerRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
      if (showcaseShareContainerRef.current && !showcaseShareContainerRef.current.contains(e.target)) {
        setShowcaseShareDropdown(false);
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

  // Showcase 2nd Image Uploader Handlers
  const handleShowcaseUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setShowcaseFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setShowcaseImage(reader.result);
        localStorage.setItem('showcaseImage', reader.result);
        localStorage.setItem('showcaseFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearShowcaseImage = () => {
    setShowcaseImage(null);
    setShowcaseFileName('');
    localStorage.removeItem('showcaseImage');
    localStorage.removeItem('showcaseFileName');
    if (showcaseInputRef.current) showcaseInputRef.current.value = '';
  };

  const downloadShowcase = () => {
    const link = document.createElement('a');
    link.href = showcaseImage || personalQR;
    link.download = showcaseFileName ? `showcase-${showcaseFileName}` : 'personal-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share Showcase 2nd Image
  const shareShowcase = async (e) => {
    e.stopPropagation();
    const activeSrc = showcaseImage || personalQR;

    try {
      const response = await fetch(activeSrc);
      const blob = await response.blob();
      const file = new File([blob], showcaseFileName || 'showcase-card.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Showcase QR Code',
            text: 'Take a look at this digital card QR code!',
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error(err);
        }
      }
    } catch (err) {
      console.error('Fetch/Blob conversion failed:', err);
    }

    // Toggle Desktop / Fallback Dropdown
    setShowcaseShareDropdown(prev => !prev);
  };

  const copyShowcaseToClipboard = async () => {
    const activeSrc = showcaseImage || personalQR;
    try {
      const response = await fetch(activeSrc);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert('Showcase card image copied to clipboard!');
      setShowcaseShareDropdown(false);
    } catch (err) {
      console.error(err);
      alert('Failed to copy showcase image to clipboard.');
    }
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

  const shareShowcaseSocial = (network) => {
    // Sharing showcase url
    const textUrl = window.location.origin;
    let shareUrl = '';
    
    if (network === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Scan my custom showcase card QR: ' + textUrl)}`;
    } else if (network === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Scan my digital showcase card!')}&url=${encodeURIComponent(textUrl)}`;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShowcaseShareDropdown(false);
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
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${inputType === 'url' ? '' : 'btn-secondary'}`} 
                  onClick={() => setInputType('url')}
                  style={{ flex: 1, padding: '0.5rem', minWidth: '80px' }}
                >
                  <LinkIcon size={16} style={{marginRight: '8px'}} /> URL
                </button>
                <button 
                  className={`btn ${inputType === 'phone' ? '' : 'btn-secondary'}`} 
                  onClick={() => setInputType('phone')}
                  style={{ flex: 1, padding: '0.5rem', minWidth: '100px' }}
                >
                  <Phone size={16} style={{marginRight: '8px'}} /> Phone Call
                </button>
                <button 
                  className={`btn ${inputType === 'whatsapp' ? '' : 'btn-secondary'}`} 
                  onClick={() => setInputType('whatsapp')}
                  style={{ flex: 1, padding: '0.5rem', minWidth: '100px' }}
                >
                  <MessageCircle size={16} style={{marginRight: '8px'}} /> WhatsApp
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
            
            <div className="showcase-buttons-row" style={{ marginTop: '2.5rem' }}>
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

      {/* Showcase / 2nd Image Showcase Card */}
      <div className="showcase-card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ExternalLink size={24} color="var(--accent-color)" />
          {showcaseImage ? 'My Custom Showcase' : 'Visit My Website'}
        </h2>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="showcase-preview-container">
            <img 
              src={showcaseImage || personalQR} 
              alt={showcaseImage ? 'Custom Uploaded Showcase' : 'Shaikh Lukman Personal QR Code'} 
            />
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {showcaseImage ? `Custom card: ${showcaseFileName}` : 'Scan the QR code above to visit my portfolio.'}
          </p>

          <div className="showcase-actions">
            {/* Dynamic File Uploader for 2nd Image */}
            <div className="file-upload-wrapper" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <label className="file-upload-button" style={{ borderStyle: 'solid', borderColor: showcaseImage ? 'var(--border-color)' : 'var(--accent-color)' }}>
                <UploadCloud size={18} />
                <span>{showcaseImage ? 'Change 2nd Image / QR' : 'Upload 2nd Image / QR'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={showcaseInputRef}
                  onChange={handleShowcaseUpload} 
                  className="file-upload-input"
                />
              </label>
            </div>

            <div className="showcase-buttons-row" style={{ maxWidth: '400px', margin: '0.5rem auto 0', display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button className="btn btn-secondary" onClick={downloadShowcase} style={{ flex: 1, padding: '0.75rem' }}>
                <Download size={16} /> Download
              </button>
              
              <div className="share-action-container" ref={showcaseShareContainerRef} style={{ flex: 1, marginTop: 0 }}>
                <button className="btn btn-secondary" onClick={shareShowcase} style={{ width: '100%', padding: '0.75rem' }}>
                  <Share2 size={16} /> Share
                </button>
                
                {showcaseShareDropdown && (
                  <div className="share-dropdown">
                    <button className="share-item" onClick={copyShowcaseToClipboard}>
                      <Copy size={14} /> Copy Image
                    </button>
                    <button className="share-item" onClick={() => shareShowcaseSocial('whatsapp')}>
                      <MessageCircle size={14} /> WhatsApp Text Link
                    </button>
                    <button className="share-item" onClick={() => shareShowcaseSocial('twitter')}>
                      <ExternalLink size={14} /> Twitter Text Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showcaseImage && (
              <button 
                className="btn btn-secondary" 
                onClick={clearShowcaseImage}
                style={{ maxWidth: '400px', margin: '0.5rem auto 0', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem', gap: '6px' }}
              >
                <RefreshCw size={16} />
                Revert to Default Personal QR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
