// Saves a file to the computer. Fetching first makes the browser download it instead of just opening it.
export async function downloadFile(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('bad response');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'print-file.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch {
    window.open(url, '_blank', 'noopener'); // last resort: open it so it can be saved from there
  }
}
