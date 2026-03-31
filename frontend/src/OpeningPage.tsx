import { useState } from 'react'
import flair from "./assets/flair.png";
import video from './assets/background.mp4'
import './OpeningPage.css'

const OpeningPage = () => {
  return (
    <div className="parent">
    <div className="main">

      <video className="backgroundVideo" autoPlay loop muted playsInline>
        <source src={video} type="video/mp4" />
      </video>
      <div className="fake">
          <div className="child">
            <h1 className='flairText'>
              Flair  <img src={flair} alt="fuckyou" className="flairImg" />
            </h1>
            <p>Create. Style. Download. Repeat
            </p>
            <br />
            <button className='startButton'>Get Started </button>
            
          </div>
      </div>
    </div>
    <div className="info">
  <div className="infoContent">
    <p className="miniTitle">WHAT IS FLAIR</p>

    <h2>
      Turn plain code into something worth sharing.
    </h2>

    <p>
      Flair helps you create beautiful images from your code with themes,
      syntax highlighting, custom backgrounds and instant export.
    </p>

    <div className="infoGrid">
      <div>
        <h3>Syntax Highlighting</h3>
        <p>Readable colors for multiple languages.</p>
      </div>

      <div>
        <h3>Custom Themes</h3>
        <p>Dark, light and gradient based styles.</p>
      </div>

      <div>
        <h3>Instant Export</h3>
        <p>Download high quality images instantly.</p>
      </div>

      <div>
        <h3>Minimal UI</h3>
        <p>Clean layout with no distractions.</p>
      </div>
    </div>
  </div>
</div>

<div className="info2">
  <div className="infoContent">
    <p className="miniTitle">WHY PEOPLE USE IT</p>

    <h2>
      Because normal screenshots look boring.
    </h2>

    <p>
      Flair gives your code a polished layout, balanced spacing and a modern
      look that stands out in portfolios, blogs and social media.
    </p>

    <div className="listSection">
      <p>— Share projects on LinkedIn and X</p>
      <p>— Create better portfolio screenshots</p>
      <p>— Make tutorial and blog images</p>
      <p>— Present code beautifully in slides</p>
      <p>— Show your work in a premium way</p>
    </div>
  </div>
</div>

<div className="info3">
  <div className="infoContent">
    <p className="miniTitle">CUSTOMIZE EVERYTHING</p>

    <h2>
      Create. Style. Download. Repeat.
    </h2>

    <p>
      Choose themes, padding, backgrounds, window style and layout. Export
      exactly the image you want in seconds.
    </p>

    <div className="numberGrid">
      <div>
        <span>01</span>
        <p>Dark & Light Themes</p>
      </div>

      <div>
        <span>02</span>
        <p>Gradient Backgrounds</p>
      </div>

      <div>
        <span>03</span>
        <p>Window Controls & Titles</p>
      </div>

      <div>
        <span>04</span>
        <p>Padding & Layout Controls</p>
      </div>
    </div>
  </div>
</div>
    </div>
  )
}

export default OpeningPage  