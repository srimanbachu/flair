import { useState } from 'react'
import './Dcode.css'
import flair from '../assets/flair.png'
import { Menu } from 'lucide-react'
import {  useNavigate } from 'react-router-dom';

const Dcode = () => {

  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  

  return (
    <div className='maindiv'>
      <div className="nav">
        <div className="menudiv" onClick={() => setShow(!show)}>
          <Menu className='menuicon' />
        {show && (
          <div className="switch">
            <div className="imagecard" onClick={ () => navigate('/image') }>imagecard</div>
            <div className="codecard">codecard</div>
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

export default Dcode