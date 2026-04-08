import { BrowserRouter, Routes, Route } from "react-router-dom";
import Busqueda from "./modules/Busqueda/Busqueda";
import CategoriaPage from "./modules/categoria/CategoriaPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Busqueda />} />
        <Route path="/categoria/:nombre" element={<CategoriaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;