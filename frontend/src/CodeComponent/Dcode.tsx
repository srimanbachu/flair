import { useState } from 'react'
import './Dcode.css'
import flair from '../assets/flair.png'
import { Menu } from 'lucide-react'

const Dcode = () => {

  const [show, setShow] = useState()

  return (
    <div className='main'>
      <div className="nav">
      <div className="menudiv">
      <Menu  className='menuicon'/>
      <div className="switch">
        <div className="imagecard">imagecard</div>
        <div className="codecard">codecard</div>
      </div>
      </div>
          <div className="logo">
          <h1>Flair</h1> <img src={flair} alt="flair_img"  className='flairimg'/>
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