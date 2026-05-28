// SideMenu.jsx — Collapsible left-side drawer with 10 save slots + export/import.
import { useRef } from "react";
import { formatSaveDate } from "../gameLogic/saveSlotUtils.js";

function SlotRow({ index, meta, onSave, onLoad, onDelete }) {
  const occupied = meta !== null;

  function handleSave() {
    if (
      occupied &&
      !window.confirm(
        `Overwrite slot ${index + 1} (${meta.label})? This cannot be undone.`
      )
    )
      return;
    onSave(index);
  }

  function handleLoad() {
    if (!occupied) return;
    if (
      !window.confirm(
        `Load slot ${index + 1} (${meta.label})? Unsaved progress will be lost.`
      )
    )
      return;
    onLoad(index);
  }

  function handleDelete() {
    if (!occupied) return;
    if (!window.confirm(`Delete slot ${index + 1} (${meta.label})?`)) return;
    onDelete(index);
  }

  return (
    <div className="slot-row">
      <span className="slot-number">{index + 1}</span>
      <div className="slot-info">
        {occupied ? (
          <>
            <div className="slot-label">{meta.label}</div>
            <div className="slot-date">{formatSaveDate(meta.savedAt)}</div>
          </>
        ) : (
          <div className="slot-empty">— empty —</div>
        )}
      </div>
      <button
        className="slot-btn slot-btn-save"
        onClick={handleSave}
        title={`Save current game to slot ${index + 1}`}
      >
        Save
      </button>
      <button
        className="slot-btn slot-btn-load"
        onClick={handleLoad}
        disabled={!occupied}
        title={occupied ? `Load slot ${index + 1}` : "Slot is empty"}
      >
        Load
      </button>
      <button
        className="slot-btn slot-btn-del"
        onClick={handleDelete}
        disabled={!occupied}
        title={occupied ? `Delete slot ${index + 1}` : "Slot is empty"}
      >
        Del
      </button>
    </div>
  );
}

export default function SideMenu({
  slotMetas,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
  onExportSave,
  onImportSave,
  onNewGame,
}) {
  const fileInputRef = useRef(null);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportSave(file);
    e.target.value = "";
  }

  return (
    <details className="side-menu">
      <summary className="side-menu-toggle" title="Menu">
        <span className="side-menu-icon">☰</span>
      </summary>

      <nav className="side-menu-panel">
        <p className="side-menu-section-label">Save Slots</p>
        <div className="slot-list">
          {slotMetas.map((meta, i) => (
            <SlotRow
              key={i}
              index={i}
              meta={meta}
              onSave={onSaveToSlot}
              onLoad={onLoadFromSlot}
              onDelete={onDeleteSlot}
            />
          ))}
        </div>

        <hr className="side-menu-divider" />

        <p className="side-menu-section-label">File</p>
        <button className="btn side-menu-btn" onClick={onExportSave}>
          Export Save (.json)
        </button>
        <button className="btn side-menu-btn" onClick={handleImportClick}>
          Import Save (.json)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <p className="side-menu-hint">
          Export saves to a file you can share with the AI for scenario analysis.
          Import loads any exported save or a hand-crafted test scenario.
        </p>

        <hr className="side-menu-divider" />

        <p className="side-menu-section-label">Game</p>
        <button
          className="btn side-menu-btn side-menu-btn-danger"
          onClick={onNewGame}
        >
          New Game
        </button>
      </nav>
    </details>
  );
}

