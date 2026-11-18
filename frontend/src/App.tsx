import { Routes, Route, Navigate } from "react-router-dom";
import OpeningPage from "./InfoPage/OpeningPage";
import Studio from "./studio/Studio";

function App() {
  return (
    <Routes>
      <Route path="/intro" element={<OpeningPage />} />
      {/* One studio shell stays mounted across its routes, so the draft and
          undo history survive moving between workspaces. */}
      <Route element={<Studio />}>
        <Route path="/cards/*" element={null} />
        <Route path="/canvas" element={null} />
        <Route path="/projects" element={null} />
        <Route path="/dev-tools" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/cards" replace />} />
    </Routes>
  );
}

export default App;
