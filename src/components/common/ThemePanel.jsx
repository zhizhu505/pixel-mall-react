import { useTheme } from '../../contexts/useTheme';

const ThemePanel = ({ variant = 'profile' }) => {
  const { preset, presets, setPreset } = useTheme();
  const currentTheme = presets.find((theme) => theme.key === preset);

  if (variant !== 'profile') {
    return null;
  }

  return (
    <section className="pm-theme-profile" aria-label="主题切换">
      <p className="pm-theme-profile-current">
        当前主题：<strong>{currentTheme?.label}</strong>
      </p>
      <ul className="pm-theme-profile-list">
        {presets.map((theme) => {
          const isActive = theme.key === preset;

          return (
            <li key={theme.key}>
              <button
                type="button"
                className={`pm-theme-profile-option${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => setPreset(theme.key)}
              >
                <span className="pm-theme-profile-option-main">
                  <strong>{theme.label}</strong>
                  <span className="pm-theme-profile-option-hint">
                    {isActive ? '使用中' : '点击切换'}
                  </span>
                </span>
                <span className="pm-theme-swatches" aria-hidden="true">
                  {theme.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className="pm-theme-swatch"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ThemePanel;
