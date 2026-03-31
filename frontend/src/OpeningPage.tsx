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
 </div>
    <div className="info2">
  </div>
<div className="info3">
  this is something new 
</div>

    </div>
  )
}

export default OpeningPage  