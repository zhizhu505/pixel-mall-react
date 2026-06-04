import { Outlet } from 'react-router';
import ThemePanel from './components/common/ThemePanel';

function App() {
  return (
    <div className="pm-app-root">
      <ThemePanel />
      <Outlet />
    </div>
  );
}

export default App;
