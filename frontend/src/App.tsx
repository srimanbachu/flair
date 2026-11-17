import { Routes, Route } from "react-router-dom";
import OpeningPage from "./InfoPage/OpeningPage";
import Studio from "./studio/Studio";

function App() {
  return(
    <Routes>
      <Route path="/intro"  element={ <OpeningPage/> }/>
      <Route path="/"  element={  <Studio/> }/>
    </Routes>
  )
}

export default App 