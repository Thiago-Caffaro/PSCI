import { useId, useState } from 'react';
import { ImagePlus, ScanFace, Trash2 } from 'lucide-react';

// Images travel in both directions as a data URL. Resize once in the browser
// so the JSON database and browser cache stay small, including on phones.
export async function imageToBase64(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Escolha uma imagem de até 8 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error('Não foi possível ler esta imagem.');
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    context.fillStyle = '#202125';
    context.fillRect(0, 0, 240, 300);
    const scale = Math.max(240 / image.naturalWidth, 300 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (240 - width) / 2, (300 - height) * 0.35, width, height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    throw new Error(
      error.message === 'Não foi possível ler esta imagem.'
        ? error.message
        : 'Não foi possível converter esta foto. Tente outra imagem.',
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PhotoEditor({ value, onChange, disabled, notify }) {
  const id = useId();
  const [processing, setProcessing] = useState(false);
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      await onChange(await imageToBase64(file));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }
  return (
    <div className="photo-editor">
      <div className="profile-photo preview">
        {value ? (
          <img src={value} alt="Prévia da foto de perfil" />
        ) : (
          <ScanFace size={31} strokeWidth={1.2} />
        )}
        <span>ID</span>
      </div>
      <div className="photo-editor-content">
        <strong>Foto de identificação</strong>
        <p>Retrato padronizado em 4:5. JPG, PNG ou WebP, até 8 MB.</p>
        <div className="photo-actions">
          <label
            className={`button secondary small ${disabled || processing ? 'disabled-label' : ''}`}
            htmlFor={id}
          >
            <ImagePlus size={14} />
            {processing ? 'CONVERTENDO...' : 'ENVIAR FOTO'}
          </label>
          <input
            className="sr-only"
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Enviar foto de perfil"
            disabled={disabled || processing}
            onChange={choose}
          />
          <button
            className="icon-button"
            type="button"
            aria-label="Remover foto de perfil"
            title="Remover foto"
            disabled={!value || disabled || processing}
            onClick={() => onChange('')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
