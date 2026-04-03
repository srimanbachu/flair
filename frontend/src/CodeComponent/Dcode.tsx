import { useRef, useState } from 'react'
import './Dcode.css'
import flair from '../assets/flair.png'
import {
  Menu,
  Download,
  Copy,
  Palette,
  Image,
  Code2,
  Sparkles,
  Settings2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'

const Dcode = () => {
  const navigate = useNavigate()

  const [show, setShow] = useState(false)
  const [activeSection, setActiveSection] = useState('code')
  const [language, setLanguage] = useState('TypeScript')
  const [theme, setTheme] = useState('midnight')
  const [background, setBackground] = useState('bg1')
  const [padding, setPadding] = useState(28)
  const [radius, setRadius] = useState(28)
  const [shadow, setShadow] = useState(45)

  const [code, setCode] = useState(`import React from "react";

export default function App() {
  return (
    <div className="card">
      <h1>Hello from Flair</h1>
      <p>Create. Style. Download. Repeat.</p>
    </div>
  );
}`)

  const previewRef = useRef<HTMLDivElement | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      alert('Code copied')
    } catch {
      alert('Copy failed')
    }
  }

  const handleDownload = async () => {
    if (!previewRef.current) return

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      scale: 2,
    })

    const link = document.createElement('a')
    link.download = 'flair-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const getFileName = () => {
    if (language === 'TypeScript') return 'App.tsx'
    return 'App.js'
  }

  return (
    <div className='maindiv'>
      <div className="nav">
        <div className="menudiv" onClick={() => setShow(!show)}>
          <Menu className='menuicon' />
          {show && (
            <div className="switch">
              <div
                className="imagecard"
                onClick={() => navigate('/image')}
              >
                imagecard
              </div>
              <div
                className="codecard"
                onClick={() => {
                  setShow(false)
                  navigate('/code')
                }}
              >
                codecard
              </div>
            </div>
          )}
        </div>

        <div className="logo">
          <h1>Flair</h1>
          <img src={flair} alt="flair_img" className='flairimg' />
        </div>

        <div className="empty"></div>
      </div>

      <div className="bottom">
        <div className="sidebar">
          <div className="sidebarcontent">
            <div
              className={activeSection === 'code' ? 'sideicon activeSide' : 'sideicon'}
              onClick={() => setActiveSection('code')}
            >
              <Code2 size={18} />
            </div>

            <div
              className={activeSection === 'theme' ? 'sideicon activeSide' : 'sideicon'}
              onClick={() => setActiveSection('theme')}
            >
              <Palette size={18} />
            </div>

            <div
              className={activeSection === 'background' ? 'sideicon activeSide' : 'sideicon'}
              onClick={() => setActiveSection('background')}
            >
              <Image size={18} />
            </div>

            <div
              className={activeSection === 'customize' ? 'sideicon activeSide' : 'sideicon'}
              onClick={() => setActiveSection('customize')}
            >
              <Settings2 size={18} />
            </div>

            <div
              className={activeSection === 'effects' ? 'sideicon activeSide' : 'sideicon'}
              onClick={() => setActiveSection('effects')}
            >
              <Sparkles size={18} />
            </div>
          </div>
        </div>

        <div className="design">
          <div className="designinner">
            <div className="topbar">
              <div className="topbarleft">
                <div
                  className={activeSection === 'code' ? 'chip activechip' : 'chip'}
                  onClick={() => setActiveSection('code')}
                >
                  Code
                </div>

                <div
                  className={activeSection === 'theme' ? 'chip activechip' : 'chip'}
                  onClick={() => setActiveSection('theme')}
                >
                  Theme
                </div>

                <div
                  className={activeSection === 'background' ? 'chip activechip' : 'chip'}
                  onClick={() => setActiveSection('background')}
                >
                  Background
                </div>

                <div
                  className={activeSection === 'customize' ? 'chip activechip' : 'chip'}
                  onClick={() => setActiveSection('customize')}
                >
                  Window
                </div>
              </div>

              <div className="topbarright">
                <button className="actionbtn secondarybtn" onClick={handleCopy}>
                  <Copy size={16} />
                  Copy
                </button>

                <button className="actionbtn primarybtn" onClick={handleDownload}>
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            <div className="workspace">
              <div className="controlsPanel">
                {activeSection === 'code' && (
                  <>
                    <div className="panelcard">
                      <h3>Language</h3>
                      <div className="optionrow">
                        <button
                          className={language === 'TypeScript' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('TypeScript')}
                        >
                          TypeScript
                        </button>

                        <button
                          className={language === 'JavaScript' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('JavaScript')}
                        >
                          JavaScript
                        </button>
                      </div>
                    </div>

                    <div className="panelcard">
                      <h3>Code</h3>
                      <textarea
                        className="codeeditor"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                      />
                    </div>
                  </>
                )}

                {activeSection === 'theme' && (
                  <div className="panelcard">
                    <h3>Theme</h3>
                    <div className="themegrid">
                      <div
                        className={theme === 'midnight' ? 'themebox theme1 activetheme' : 'themebox theme1'}
                        onClick={() => setTheme('midnight')}
                      >
                        Midnight
                      </div>

                      <div
                        className={theme === 'ocean' ? 'themebox theme2 activetheme' : 'themebox theme2'}
                        onClick={() => setTheme('ocean')}
                      >
                        Ocean
                      </div>

                      <div
                        className={theme === 'aurora' ? 'themebox theme3 activetheme' : 'themebox theme3'}
                        onClick={() => setTheme('aurora')}
                      >
                        Aurora
                      </div>

                      <div
                        className={theme === 'glass' ? 'themebox theme4 activetheme' : 'themebox theme4'}
                        onClick={() => setTheme('glass')}
                      >
                        Glass
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'background' && (
                  <div className="panelcard">
                    <h3>Background</h3>
                    <div className="backgroundgrid">
                      <div
                        className={background === 'bg1' ? 'bgbox bg1 activebg' : 'bgbox bg1'}
                        onClick={() => setBackground('bg1')}
                      ></div>

                      <div
                        className={background === 'bg2' ? 'bgbox bg2 activebg' : 'bgbox bg2'}
                        onClick={() => setBackground('bg2')}
                      ></div>

                      <div
                        className={background === 'bg3' ? 'bgbox bg3 activebg' : 'bgbox bg3'}
                        onClick={() => setBackground('bg3')}
                      ></div>

                      <div
                        className={background === 'bg4' ? 'bgbox bg4 activebg' : 'bgbox bg4'}
                        onClick={() => setBackground('bg4')}
                      ></div>
                    </div>
                  </div>
                )}

                {activeSection === 'customize' && (
                  <div className="panelcard">
                    <h3>Customize</h3>

                    <div className="slidergroup">
                      <label>Padding: {padding}px</label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={padding}
                        onChange={(e) => setPadding(Number(e.target.value))}
                      />
                    </div>

                    <div className="slidergroup">
                      <label>Radius: {radius}px</label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                      />
                    </div>

                    <div className="slidergroup">
                      <label>Shadow: {shadow}px</label>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={shadow}
                        onChange={(e) => setShadow(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'effects' && (
                  <div className="panelcard">
                    <h3>Effects</h3>
                    <div className="optionrow">
                      <button className="selectbox" onClick={() => setPadding(20)}>
                        Compact
                      </button>
                      <button className="selectbox" onClick={() => setPadding(40)}>
                        Spacious
                      </button>
                      <button className="selectbox" onClick={() => setRadius(18)}>
                        Sharp
                      </button>
                      <button className="selectbox" onClick={() => setRadius(40)}>
                        Smooth
                      </button>
                      <button className="selectbox" onClick={() => setShadow(20)}>
                        Soft Shadow
                      </button>
                      <button className="selectbox" onClick={() => setShadow(60)}>
                        Deep Shadow
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="previewPanel">
                <div className={`previewOuter ${background}`}>
                  <div
                    ref={previewRef}
                    className={`previewWindow ${theme}`}
                    style={{
                      borderRadius: `${radius}px`,
                      boxShadow: `0 20px ${shadow}px rgba(0,0,0,0.45)`,
                    }}
                  >
                    <div className="windowtop">
                      <div className="dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>

                      <div className="filename">{getFileName()}</div>
                    </div>

                    <pre
                      className="codepreview"
                      style={{ padding: `${padding}px` }}
                    >
                      {code}
                    </pre>
                  </div>
                </div>

                <div className="previewfooter">
                  <div className="footerpill">{language}</div>
                  <div className="footerpill">{theme}</div>
                  <div className="footerpill">{background}</div>
                  <div className="footerpill">{activeSection}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dcode