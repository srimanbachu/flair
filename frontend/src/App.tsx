import { Routes, Route } from "react-router-dom";
import OpeningPage from "./InfoPage/OpeningPage";
import Dcode from "./CodeComponent/Dcode";

function App() {
  return(
    <Routes>
      <Route path="/"  element={ <OpeningPage/> }/>
      <Route path="/code"  element={  <Dcode/> }/>
    </Routes>
  )
}

export default App