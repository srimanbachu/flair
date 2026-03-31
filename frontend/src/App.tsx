import { Routes, Route } from "react-router-dom";
import OpeningPage from "./OpeningPage";
import EditCode from "./editcode";

function App() {
  return(
    <Routes>
      <Route path="/"  element={ <OpeningPage/> }/>
      <Route path="/code"  element={ <EditCode/> }/>
    </Routes>
  )
}

export default App