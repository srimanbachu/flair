import './Dcode.css'
import flair from '../assets/flair.png'

const Dcode = () => {
  return (
    <div className='main'>
      <div className="nav">
      <div className="switch">

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