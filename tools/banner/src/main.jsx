import { createRoot } from 'react-dom/client';
import Galaxy from '../vendor/Galaxy.jsx';
import config from '../banner.config.json';
import './banner.css';

const root = document.getElementById('root');
root.style.width = `${config.capture.width}px`;
root.style.height = `${config.capture.height}px`;
document.documentElement.style.background = config.background;

createRoot(root).render(
  <>
    <Galaxy {...config.galaxy} />
    <h1 style={{
      color: config.typography.color,
      fontSize: config.typography.fontSize,
      fontWeight: config.typography.weight,
      letterSpacing: config.typography.letterSpacing,
    }}>{config.title}</h1>
  </>
);
