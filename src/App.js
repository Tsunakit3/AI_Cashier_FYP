import './styles/App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Boot from './pages/login';
import Main from './pages/main';


function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Boot />} />
        <Route path="/main" element={<Main />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
