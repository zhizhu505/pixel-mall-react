import { Outlet } from 'react-router';
import ThemePanel from './components/common/ThemePanel';

function App() {
  return (
    <div className="App">
      <ThemePanel />
      <Outlet />
    </div>
  );
}

export default App;
