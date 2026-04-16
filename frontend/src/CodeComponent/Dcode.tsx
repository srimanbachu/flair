import { useRef, useState, useEffect } from 'react'
import './Dcode.css'
import flair from '../assets/flair.png'
import video from '../assets/background.mp4'
import { useNavigate } from 'react-router-dom'
import Prism from 'prismjs'
import { themes } from '../data/themes'
import { backgrounds } from '../data/background'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-json'

import {
  Download,
  Copy,
  Palette,
  Image,
  Code2,
  Settings2,
} from 'lucide-react'
import * as htmlToImage from 'html-to-image'


const Dcode = () => {

  const [activeSection, setActiveSection] = useState('code')
  const [language, setLanguage] = useState('TypeScript')
  const [theme, setTheme] = useState('midnight')
  const [background, setBackground] = useState('bg1')
  const [padding, setPadding] = useState(28)
  const [radius, setRadius] = useState(28)
  const [shadow, setShadow] = useState(45)
  const [codeBrightness, setCodeBrightness] = useState(1)
  const [codeContrast] = useState(1.2)
  const [pixelRatio, setPixelRatio] = useState(2)
  const navigate = useNavigate()


  const [code, setCode] = useState(`import React from "react";
    export default function App() {
      return (
      <div className="card">
        <h1>Hello from Flair</h1>
        <p>Create. Style. Download. Repeat.</p>
      </div>
    );
  }`)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, language])

  const previewWithBgRef = useRef<HTMLDivElement | null>(null)
  const previewOnlyRef = useRef<HTMLDivElement | null>(null)
  const [exportMode, setExportMode] = useState<'with-bg' | 'without-bg'>('with-bg')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      alert('Code copied')
    } catch {
      alert('Copy failed')
    }
  }



  const handleDownload = async () => {
    const target =
      exportMode === 'with-bg' ? previewWithBgRef.current : previewOnlyRef.current
  
    if (!target) return
  
    const isGlassTheme = ['theme51', 'theme52', 'theme53', 'theme54', 'theme55', 'theme56', 'theme57', 'theme58', 'theme59', 'theme60',
      'theme61', 'theme62', 'theme63', 'theme64', 'theme65', 'theme66', 'theme67', 'theme68', 'theme69', 'theme70'
    ].includes(themes.find((item) => item.key === theme)?.className || '')
  
    try {
      const dataUrl = await htmlToImage.toPng(target, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: exportMode === 'with-bg' ? undefined : '#0f172a',        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
  
          if (isGlassTheme && node.classList.contains('previewWindow')) {
            node.classList.add('exportGlassFix')
          }
  
          return true
        },
      })
  
      const link = document.createElement('a')
      link.download =
        exportMode === 'with-bg' ? 'flair-code-with-bg.png' : 'flair-code.png'
      link.href = dataUrl
      link.click()
  
      if (isGlassTheme && previewOnlyRef.current) {
        previewOnlyRef.current.classList.remove('exportGlassFix')
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const getFileName = () => {
    if (language === 'TypeScript') return 'App.tsx'
    if (language === 'JavaScript') return 'App.js'
    if (language === 'txt') return 'index.txt'
    if (language === 'C') return 'index.C'
    if (language === 'C++') return 'index.C++'
    if (language === 'Json') return 'package.json'
    return ''
  }

  return (
    <div className='maindiv'>

      <video className="backgroundVideo1" autoPlay loop muted playsInline>
        <source src={video} type="video/mp4" />
      </video>

      <div className="blur">

      </div>

      <div className="nav">
        <div className="logo">
          <h1 onClick={() =>(navigate('/intro'))}>Flair</h1>
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
                          className={language === 'C++' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('C++')}
                        >
                          C++
                        </button>

                        <button
                          className={language === 'txt' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('txt')}
                        >
                          txt
                        </button>

                        <button
                          className={language === 'C' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('C')}
                        >
                          C
                        </button>

                        <button
                          className={language === 'JavaScript' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('JavaScript')}
                        >
                          JavaScript
                        </button>

                        <button
                          className={language === 'Json' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('Json')}
                        >
                          Json
                        </button>

                        <button
                          className={language === 'none' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setLanguage('none')}
                        >
                          none
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

                      {
                        themes.map((item) => (
                          <div
                            key={item.key}
                            className={
                              theme === item.key
                                ? `themebox ${item.className} activetheme`
                                : `themebox ${item.className}`
                            }
                            onClick={() => setTheme(item.key)}
                          >
                            {item.label}
                          </div>
                        ))
                      }

                    </div>
                  </div>
                )}

                {activeSection === 'background' && (
                  <div className="panelcard">
                    <h3>Background</h3>
                    <div className="backgroundgrid">
                      {backgrounds.map((item) => (
                        <div
                          key={item.key}
                          className={
                            background === item.key
                              ? `bgbox ${item.className} activebg`
                              : `bgbox ${item.className}`
                          }
                          onClick={() => setBackground(item.key)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'customize' && (
                  <div className="panelcard">
                    <h3>Customize</h3>

                    <div className="slidergroup">
                      <label>Export Quality: {pixelRatio.toFixed(1)}x</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={pixelRatio}
                        onChange={(e) => setPixelRatio(Number(e.target.value))}
                      />
                    </div>

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

                    <div className="slidergroup">
                      <label>Code Brightness: {codeBrightness.toFixed(1)}</label>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.1"
                        value={codeBrightness}
                        onChange={(e) => setCodeBrightness(Number(e.target.value))}
                      />
                    </div>

                    <div className="slidergroup">
                      <label>Export Mode</label>
                      <div className="optionrow">
                        <button
                          className={exportMode === 'with-bg' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setExportMode('with-bg')}
                        >
                          With Background
                        </button>

                        <button
                          className={exportMode === 'without-bg' ? 'selectbox activeSelect' : 'selectbox'}
                          onClick={() => setExportMode('without-bg')}
                        >
                          Without Background
                        </button>
                      </div>


                    </div>
                  </div>
                )}
              </div>

              <div className="previewPanel">
                <div ref={previewWithBgRef} className={`previewOuter ${background}`}>
                  <div
                    ref={previewOnlyRef}
                    className={`previewWindow ${themes.find((item) => item.key === theme)?.className
                      }`}
                    style={{
                      borderRadius: `${radius}px`,
                      boxShadow: `0 20px ${shadow}px rgba(0,0,0,0.45)`,
                    }}
                  >
                    <div className="windowtop">
                      <div className="dots">
                        <span className="dot1"></span>
                        <span className="dot2"></span>
                        <span className="dot3"></span>
                      </div>

                      <div className="filename">{getFileName()}</div>
                    </div>

                    <pre
                      className="codepreview"
                      style={{
                        padding: `${padding}px`,
                        ['--code-brightness' as any]: codeBrightness,
                        ['--code-contrast' as any]: codeContrast,

                      }}
                    >
                      <code
                        className={
                          language === 'TypeScript'
                            ? 'language-tsx'
                            : language === 'JavaScript'
                              ? 'language-js'
                              : language === 'C++'
                                ? 'language-cpp'
                                : language === 'C'
                                  ? 'language-c'
                                  : language === 'Json'
                                    ? 'language-json'
                                    : 'language-none'
                        }
                      >
                        {code}
                      </code>
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