// Shared helpers for turning a fetched Blob into either an in-browser preview
// (new tab, rendered inline - works for PDFs/images) or a forced file download.

// Opens a blank tab synchronously (before the async fetch) so browsers don't
// treat the later navigation as an unrequested popup and block it.
export async function previewBlob(fetchBlob) {
    const win = window.open("", "_blank");
    try {
        const blob = await fetchBlob();
        const url = URL.createObjectURL(blob);
        if (win) {
            win.location.href = url;
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        if (!win) {
            throw new Error("Preview blocked by the browser. Please allow pop-ups for this site.");
        }
    } catch (err) {
        if (win) win.close();
        throw err;
    }
}

export async function downloadBlob(fetchBlob, filename) {
    const blob = await fetchBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
