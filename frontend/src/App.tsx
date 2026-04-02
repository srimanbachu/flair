import { Routes, Route } from "react-router-dom";
import OpeningPage from "./InfoPage/OpeningPage";
import Dcode from "./CodeComponent/Dcode";
import Dimage from "./urlcomponent/Dimage";

function App() {
  return(
    <Routes>
      <Route path="/"  element={ <OpeningPage/> }/>
      <Route path="/code"  element={  <Dcode/> }/>
      <Route path="/image"  element={  <Dimage/> }/>

    </Routes>
  )
}

export default App