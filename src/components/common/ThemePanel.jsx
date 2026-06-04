import { useState } from 'react';
import { useTheme } from '../../contexts/useTheme';
import Button from './Button';

const ThemePanel = () => {
  const { preset, presets, setPreset } = useTheme();
  const [open, setOpen] = useState(false);
  const currentTheme = presets.find((theme) => theme.key === preset);

  return (
    <div className={`pm-theme-floating${open ? ' is-open' : ''}`}>
      <Button
        className="pm-theme-launcher"
        type="button"
        variant="dark"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        {open ? '收起主题' : '切换主题'}
      </Button>

      {open ? (
        <section className="pm-theme-panel pm-theme-drawer" aria-label="主题切换面板">
          <div className="pm-theme-heading">
            <strong>主题配色</strong>
            <span>当前：{currentTheme?.label}</span>
          </div>

          <div className="pm-theme-grid">
            {presets.map((theme) => (
              <button
                key={theme.key}
                type="button"
                className={`pm-theme-option${theme.key === preset ? ' is-active' : ''}`}
                onClick={() => setPreset(theme.key)}
              >
                <strong>{theme.label}</strong>
                <div className="pm-theme-swatches" aria-hidden="true">
                  {theme.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className="pm-theme-swatch"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ThemePanel;
