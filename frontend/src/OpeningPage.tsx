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
    <div className="infoSection">
  <h1>What is Flair?</h1>

  <p>
    Flair is a tool that turns your code into beautiful, customizable images.
    Instead of sharing plain screenshots or boring code blocks, Flair helps you
    create clean and professional visuals that are ready to share anywhere.
  </p>

  <p>
    Simply paste your code into the editor, choose the style you like, and Flair
    will instantly generate a polished image version of your code.
  </p>

  <h2>Customize Everything</h2>

  <p>
    Flair gives you full control over how your code looks. You can choose from
    different themes, switch between dark and light mode, change the background,
    edit colors, adjust padding, increase or decrease the font size, and control
    spacing.
  </p>

  <p>
    You can make your code look minimal, colorful, modern, or professional
    depending on where you want to use it.
  </p>

  <h2>Designed for Sharing</h2>

  <p>
    Once your design is ready, you can export it as a high-quality image. Flair
    is perfect for sharing code snippets on Instagram, LinkedIn, X, GitHub,
    blogs, portfolios, presentations, and project showcases.
  </p>

  <p>
    Whether you are showing a small JavaScript function, a React component, or a
    complete project snippet, Flair makes it stand out.
  </p>

  <h2>Why Use Flair?</h2>

  <p>
    Plain screenshots often look messy, blurry, or difficult to read. Flair
    solves that by giving your code a cleaner and more professional appearance.
  </p>

  <p>
    It helps developers, students, creators, and content makers present their
    work in a way that is easier to read and more visually appealing.
  </p>

  <h2>Who Is It For?</h2>

  <p>
    Flair is made for developers, coding students, tech creators, and anyone
    who wants to share code online. It is useful for creating social media
    posts, portfolio content, tutorial images, coding notes, and presentation
    slides.
  </p>

  <h2>Fast and Easy</h2>

  <p>
    Flair is designed to be simple. Paste your code, customize the look, export
    the image, and share it. No design skills or editing software are needed.
  </p>
</div>
    </div>
    </div>
  )
}

export default OpeningPage  