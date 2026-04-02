import { useState } from 'react'
import './Dimage.css'
import flair from '../assets/flair.png'
import { Menu } from 'lucide-react'
import {  useNavigate } from 'react-router-dom';


const Dimage = () => {

    const navigate = useNavigate()  
  const [show, setShow] = useState(false)

  return (
    <div className='main'>
      <div className="nav">
        <div className="menudiv" onClick={() => setShow(!show)}>
          <Menu className='menuicon' />
        {show && (
          <div className="switch">
            <div className="imagecard">imagecard</div>
            <div className="codecard" onClick={() => navigate('/code') }>codecard</div>
          </div>

        )}
        </div>
        <div className="logo">
          <h1>Flair</h1> <img src={flair} alt="flair_img" className='flairimg' />
        </div>
        <div className="empty">

        </div>
      </div>
      <div className="bottom">
        <div className="sidebar">
        </div>
        <div className="design">
        </div>
      </div>
    </div>
  )
}

export default Dimage