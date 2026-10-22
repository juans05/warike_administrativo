'use client';

import React from 'react';
import { CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from '../ui';

export type MenuActionType = 'file' | 'text' | 'human';
export type MenuOptionForm = { label: string; actionType: MenuActionType; actionValue: string };

const ACTION_TYPE_LABELS: Record<MenuActionType, string> = {
  file: 'Mandar un archivo',
  text: 'Responder con un texto',
  human: 'Hablar con una persona',
};

interface MenuOptionsEditorProps {
  options: MenuOptionForm[];
  onAdd(): void;
  onRemove(index: number): void;
  onUpdate(index: number, patch: Partial<MenuOptionForm>): void;
  onFileUpload(index: number, e: React.ChangeEvent<HTMLInputElement>): void;
  uploadingIndex: number | null;
  saving: boolean;
  onSave(): void;
}

/** Opciones del "Menú de botones (sin IA)". Se guardan aparte con su propio botón. */
export function MenuOptionsEditor({ options, onAdd, onRemove, onUpdate, onFileUpload, uploadingIndex, saving, onSave }: MenuOptionsEditorProps) {
  return (
    <div className="space-y-3 rounded-card border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-text">Opciones del menú</h3>

      {options.length === 0 && <p className="text-sm text-text-muted">Todavía no agregaste ninguna opción.</p>}

      {options.map((opt, i) => (
        <div key={i} className="space-y-3 rounded-card border border-border bg-surface p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={`Opción ${i + 1}`}
                value={opt.label}
                onChange={e => onUpdate(i, { label: e.target.value })}
                placeholder="Ej: Ver catálogo"
              />
            </div>
            <Button variant="ghost" icon={Trash2} onClick={() => onRemove(i)} aria-label={`Eliminar opción ${i + 1}`} className="w-11 px-0" />
          </div>

          <Select
            label="Qué hace"
            value={opt.actionType}
            onChange={e => onUpdate(i, { actionType: e.target.value as MenuActionType, actionValue: '' })}
          >
            {(Object.entries(ACTION_TYPE_LABELS) as [MenuActionType, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>

          {opt.actionType === 'file' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-text" htmlFor={`menu-file-${i}`}>Archivo</label>
              <input
                id={`menu-file-${i}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/3gpp"
                onChange={e => onFileUpload(i, e)}
                disabled={uploadingIndex === i}
                className="block w-full text-sm text-text-muted file:mr-3 file:h-9 file:rounded-control file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-medium file:text-text"
              />
              {uploadingIndex === i && <p className="text-xs text-text-muted">Subiendo...</p>}
              {opt.actionValue && uploadingIndex !== i && (
                <a href={opt.actionValue} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-success hover:underline">
                  <CheckCircle2 size={16} aria-hidden /> Archivo cargado: ver
                </a>
              )}
            </div>
          )}

          {opt.actionType === 'text' && (
            <Textarea
              label="Respuesta"
              value={opt.actionValue}
              onChange={e => onUpdate(i, { actionValue: e.target.value })}
              placeholder="Texto que le va a responder el bot al elegir esta opción"
              rows={2}
            />
          )}

          {opt.actionType === 'human' && (
            <Input
              label="Mensaje de confirmación (opcional)"
              value={opt.actionValue}
              onChange={e => onUpdate(i, { actionValue: e.target.value })}
              placeholder="Ej: Ya te atiende alguien del equipo"
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={Plus} onClick={onAdd}>Agregar opción</Button>
        <Button size="sm" icon={Save} loading={saving} onClick={onSave}>{saving ? 'Guardando...' : 'Guardar menú'}</Button>
      </div>
    </div>
  );
}
