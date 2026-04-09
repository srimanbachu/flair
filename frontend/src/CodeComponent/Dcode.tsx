import { useRef, useState, useEffect } from 'react'
import './Dcode.css'
import flair from '../assets/flair.png'
import video from '../assets/background.mp4'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'


import {
  Menu,
  Download,
  Copy,
  Palette,
  Image,
  Code2,
  Settings2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as htmlToImage from 'html-to-image'

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

  useEffect(() => {
    Prism.highlightAll()
  }, [code])



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

    try {
      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 5,
        backgroundColor: 'transparent',
      })

      const link = document.createElement('a')
      link.download = 'flair-code.png'
      link.href = dataUrl
      link.click()
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
        <div className="menudiv" onClick={() => setShow(!show)}>
          <Menu className='menuicon' />
          {show && (
            <div className="switch">
              <div
                className="imagecard"
                onClick={() => navigate('/image')}
              >
                imagecard
                <span className="tooltip">avalable in future updates</span>

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

                      <div
                        className={background === 'bg5' ? 'bgbox bg5 activebg' : 'bgbox bg5'}
                        onClick={() => setBackground('bg5')}
                      ></div>

                      <div
                        className={background === 'bg6' ? 'bgbox bg6 activebg' : 'bgbox bg6'}
                        onClick={() => setBackground('bg6')}
                      ></div>

                      <div
                        className={background === 'bg7' ? 'bgbox bg7 activebg' : 'bgbox bg7'}
                        onClick={() => setBackground('bg7')}
                      ></div>

                      <div
                        className={background === 'bg8' ? 'bgbox bg8 activebg' : 'bgbox bg8'}
                        onClick={() => setBackground('bg8')}
                      ></div>

                      <div
                        className={background === 'bg9' ? 'bgbox bg9 activebg' : 'bgbox bg9'}
                        onClick={() => setBackground('bg9')}
                      ></div>

                      <div
                        className={background === 'bg10' ? 'bgbox bg10 activebg' : 'bgbox bg10'}
                        onClick={() => setBackground('bg10')}
                      ></div>

                      <div
                        className={background === 'bg11' ? 'bgbox bg11 activebg' : 'bgbox bg11'}
                        onClick={() => setBackground('bg11')}
                      ></div>

                      <div
                        className={background === 'bg12' ? 'bgbox bg12 activebg' : 'bgbox bg12'}
                        onClick={() => setBackground('bg12')}
                      ></div>

                      <div
                        className={background === 'bg13' ? 'bgbox bg13 activebg' : 'bgbox bg13'}
                        onClick={() => setBackground('bg13')}
                      ></div>

                      <div
                        className={background === 'bg14' ? 'bgbox bg14 activebg' : 'bgbox bg14'}
                        onClick={() => setBackground('bg14')}
                      ></div>

                      <div
                        className={background === 'bg15' ? 'bgbox bg15 activebg' : 'bgbox bg15'}
                        onClick={() => setBackground('bg15')}
                      ></div>

                      <div
                        className={background === 'bg16' ? 'bgbox bg16 activebg' : 'bgbox bg16'}
                        onClick={() => setBackground('bg16')}
                      ></div>

                      <div
                        className={background === 'bg17' ? 'bgbox bg17 activebg' : 'bgbox bg17'}
                        onClick={() => setBackground('bg17')}
                      ></div>

                      <div
                        className={background === 'bg18' ? 'bgbox bg18 activebg' : 'bgbox bg18'}
                        onClick={() => setBackground('bg18')}
                      ></div>

                      <div
                        className={background === 'bg19' ? 'bgbox bg19 activebg' : 'bgbox bg19'}
                        onClick={() => setBackground('bg19')}
                      ></div>

                      <div
                        className={background === 'bg20' ? 'bgbox bg20 activebg' : 'bgbox bg20'}
                        onClick={() => setBackground('bg20')}
                      ></div>

                      <div
                        className={background === 'bg21' ? 'bgbox bg21 activebg' : 'bgbox bg21'}
                        onClick={() => setBackground('bg21')}
                      ></div>

                      <div
                        className={background === 'bg22' ? 'bgbox bg22 activebg' : 'bgbox bg22'}
                        onClick={() => setBackground('bg22')}
                      ></div>

                      <div
                        className={background === 'bg23' ? 'bgbox bg23 activebg' : 'bgbox bg23'}
                        onClick={() => setBackground('bg23')}
                      ></div>

                      <div
                        className={background === 'bg24' ? 'bgbox bg24 activebg' : 'bgbox bg24'}
                        onClick={() => setBackground('bg24')}
                      ></div>

                      <div
                        className={background === 'bg25' ? 'bgbox bg25 activebg' : 'bgbox bg25'}
                        onClick={() => setBackground('bg25')}
                      ></div>

                      <div
                        className={background === 'bg26' ? 'bgbox bg26 activebg' : 'bgbox bg26'}
                        onClick={() => setBackground('bg26')}
                      ></div>

                      <div
                        className={background === 'bg27' ? 'bgbox bg27 activebg' : 'bgbox bg27'}
                        onClick={() => setBackground('bg27')}
                      ></div>

                      <div
                        className={background === 'bg28' ? 'bgbox bg28 activebg' : 'bgbox bg28'}
                        onClick={() => setBackground('bg28')}
                      ></div>

                      <div
                        className={background === 'bg29' ? 'bgbox bg29 activebg' : 'bgbox bg29'}
                        onClick={() => setBackground('bg29')}
                      ></div>

                      <div
                        className={background === 'bg30' ? 'bgbox bg30 activebg' : 'bgbox bg30'}
                        onClick={() => setBackground('bg30')}
                      ></div>

                      <div
                        className={background === 'bg31' ? 'bgbox bg31 activebg' : 'bgbox bg31'}
                        onClick={() => setBackground('bg31')}
                      ></div>

                      <div
                        className={background === 'bg32' ? 'bgbox bg32 activebg' : 'bgbox bg32'}
                        onClick={() => setBackground('bg32')}
                      ></div>

                      <div
                        className={background === 'bg33' ? 'bgbox bg33 activebg' : 'bgbox bg33'}
                        onClick={() => setBackground('bg33')}
                      ></div>

                      <div
                        className={background === 'bg34' ? 'bgbox bg34 activebg' : 'bgbox bg34'}
                        onClick={() => setBackground('bg34')}
                      ></div>

                      <div
                        className={background === 'bg35' ? 'bgbox bg35 activebg' : 'bgbox bg35'}
                        onClick={() => setBackground('bg35')}
                      ></div>

                      <div
                        className={background === 'bg36' ? 'bgbox bg36 activebg' : 'bgbox bg36'}
                        onClick={() => setBackground('bg36')}
                      ></div>

                      <div
                        className={background === 'bg37' ? 'bgbox bg37 activebg' : 'bgbox bg37'}
                        onClick={() => setBackground('bg37')}
                      ></div>

                      <div
                        className={background === 'bg38' ? 'bgbox bg38 activebg' : 'bgbox bg38'}
                        onClick={() => setBackground('bg38')}
                      ></div>

                      <div
                        className={background === 'bg39' ? 'bgbox bg39 activebg' : 'bgbox bg39'}
                        onClick={() => setBackground('bg39')}
                      ></div>

                      <div
                        className={background === 'bg40' ? 'bgbox bg40 activebg' : 'bgbox bg40'}
                        onClick={() => setBackground('bg40')}
                      ></div>

                      <div
                        className={background === 'bg41' ? 'bgbox bg41 activebg' : 'bgbox bg41'}
                        onClick={() => setBackground('bg41')}
                      ></div>

                      <div
                        className={background === 'bg42' ? 'bgbox bg42 activebg' : 'bgbox bg42'}
                        onClick={() => setBackground('bg42')}
                      ></div>

                      <div
                        className={background === 'bg43' ? 'bgbox bg43 activebg' : 'bgbox bg43'}
                        onClick={() => setBackground('bg43')}
                      ></div>

                      <div
                        className={background === 'bg44' ? 'bgbox bg44 activebg' : 'bgbox bg44'}
                        onClick={() => setBackground('bg44')}
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
              </div>

              <div className="previewPanel">
                <div ref={previewRef} className={`previewOuter ${background}`}>
                  <div
                    className={`previewWindow ${theme}`}
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
                      style={{ padding: `${padding}px` }}
                    >
  <code className="language-tsx">
    {code}
  </code>                    </pre>
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