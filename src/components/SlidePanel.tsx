import { useCloakState } from '../context/CloakContext';
import SettingsPanel from './SettingsPanel';

const panelComponents: Record<string, () => JSX.Element> = {
  settings: SettingsPanel,
};

const panelTitles: Record<string, string> = {
  settings: 'Settings',
};

export default function SlidePanel() {
  const { state, dispatch } = useCloakState();
  const isOpen = state.activePanel !== null;
  const PanelComponent = state.activePanel ? panelComponents[state.activePanel] : null;
  const title = state.activePanel ? panelTitles[state.activePanel] : '';

  return (
    <>
      <div
        className={`sheet-backdrop${isOpen ? ' open' : ''}`}
        onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
        aria-hidden="true"
      />
      <div
        className={`sheet${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal={isOpen}
        aria-label={title}
        aria-hidden={!isOpen}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2 className="sheet-title">{title}</h2>
          <button
            type="button"
            className="sheet-close"
            onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
            aria-label="Close panel"
          >
            Close
          </button>
        </div>
        <div className="sheet-body">
          {PanelComponent && <PanelComponent />}
        </div>
      </div>
    </>
  );
}
