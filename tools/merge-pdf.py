"""Merges the per-slide PDFs written by export-pdf.mjs into one deck.

Usage: python3 tools/merge-pdf.py <pageDir> <outFile>

Also reports page size and the clickable links found per page, so a broken
export is visible instead of silently shipping.
"""
import sys
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    sys.exit("FAIL: pypdf is required (pip install pypdf)")

if len(sys.argv) != 3:
    sys.exit(__doc__)

page_dir = Path(sys.argv[1])
out_file = Path(sys.argv[2])

parts = sorted(page_dir.glob("slide-*.pdf"))
if not parts:
    sys.exit(f"FAIL: no slide PDFs in {page_dir}")

writer = PdfWriter()
for part in parts:
    reader = PdfReader(part)
    if len(reader.pages) != 1:
        sys.exit(f"FAIL: {part.name} has {len(reader.pages)} pages, expected 1")
    writer.append(reader)

with out_file.open("wb") as fh:
    writer.write(fh)


def page_links(page):
    links = []
    for annot in page.get("/Annots") or []:
        obj = annot.get_object()
        if obj.get("/Subtype") == "/Link":
            uri = (obj.get("/A") or {}).get("/URI")
            if uri:
                links.append(uri)
    return links


reader = PdfReader(out_file)
sizes = {
    (round(float(p.mediabox.width) / 72, 2), round(float(p.mediabox.height) / 72, 2))
    for p in reader.pages
}
total_links = 0
for i, page in enumerate(reader.pages, 1):
    links = page_links(page)
    total_links += len(links)
    if links:
        print(f"  page {i}: {len(links)} link(s)")
        for uri in links:
            print(f"    {uri}")

size_note = ", ".join(f"{w}x{h}in" for w, h in sorted(sizes))
print(
    f"{out_file.name}: {len(reader.pages)} pages, {size_note}, "
    f"{total_links} clickable link(s), {out_file.stat().st_size / 1024 / 1024:.1f}MB"
)

if len(sizes) > 1:
    sys.exit(f"FAIL: inconsistent page sizes: {size_note}")
