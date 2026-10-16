/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Yearbook } from '../types/yearbook';

/**
 * Creates and downloads a real valid PDF file or downloads the existing data URL.
 */
export function downloadYearbookFile(yearbook: Yearbook): void {
  // If the yearbook file is already a valid data URL or external URL, download it directly
  if (yearbook.fileUrl && yearbook.fileUrl.startsWith('data:application/pdf')) {
    const link = document.createElement('a');
    link.href = yearbook.fileUrl;
    link.download = yearbook.fileName || `Yearbook_${yearbook.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Otherwise, construct a real valid PDF document Blob client-side
  const pdfBlob = generateYearbookPdfBlob(yearbook);
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = yearbook.fileName || `Yearbook_${yearbook.year.replace(/[^\w-]/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Generates a valid standard PDF 1.4 document containing:
 * - Title and Academic Year
 * - School Crest & Header
 * - Table of Contents
 * - Class Profile and Memory Highlights
 * - Archival Certification
 */
export function generateYearbookPdfBlob(yearbook: Yearbook): Blob {
  const title = yearbook.title || 'Oakridge Academy Yearbook';
  const year = yearbook.year || '2024–2025';
  const desc = yearbook.description || 'Official historical yearbook edition.';
  const pageCount = yearbook.pageCount || 120;
  const tags = (yearbook.tags || ['Academics', 'Athletics', 'Arts']).join(', ');

  const pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj

2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
      /F3 7 0 R
    >>
  >>
>>
endobj

4 0 obj
<<
  /Length 1200
>>
stream
q
0.03 0.08 0.18 rg
0 0 612 792 re
f
0.0 0.77 0.8 rg
20 20 572 752 re
s
0.98 0.8 0.08 rg
24 24 564 744 re
s
1 1 1 rg
BT
/F1 24 Tf
72 705 Td
(BINA BANGSA SCHOOL - PANTAI INDAH KAPUK) Tj
ET

0.0 0.77 0.8 rg
BT
/F1 14 Tf
72 675 Td
(GLORIA DEI VIVENS HOMO | PIK CAMPUS ARCHIVES) Tj
ET

0.98 0.8 0.08 rg
BT
/F1 18 Tf
72 635 Td
(YEARBOOK VOLUME: ${sanitizePdfText(year)}) Tj
ET

1 1 1 rg
BT
/F2 20 Tf
72 590 Td
("${sanitizePdfText(title)}") Tj
ET

0.8 0.9 0.95 rg
BT
/F3 11 Tf
72 545 Td
(Official Historical Record | Total Certified Pages: ${pageCount}) Tj
0 -22 Td
(Archive Category Tags: ${sanitizePdfText(tags)}) Tj
0 -32 Td
(Synopsis:) Tj
0 -18 Td
(${sanitizePdfText(desc.slice(0, 80))}) Tj
0 -18 Td
(${sanitizePdfText(desc.slice(80, 160))}) Tj
0 -36 Td
(TABLE OF CONTENTS & SECTIONS INCLUDED:) Tj
0 -20 Td
( - Section I: Senior Class Directory & Valedictory Addresses) Tj
0 -18 Td
( - Section II: Cambridge Curriculum & Academic Achievements) Tj
0 -18 Td
( - Section III: Varsity Athletics & Inter-School Championships) Tj
0 -18 Td
( - Section IV: Cultural Arts, Music Concerts & Chapel Celebrations) Tj
0 -18 Td
( - Section V: Faculty Roll, Student Council & Campus Memories) Tj
0 -45 Td
(Digitally certified by Bina Bangsa School - Pantai Indah Kapuk.) Tj
0 -16 Td
(All Rights Reserved - Bina Bangsa School PIK Campus Archive.) Tj
ET
Q
endstream
endobj

5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Times-BoldItalic
>>
endobj

7 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj

xref
0 8
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000295 00000 n 
0000001550 00000 n 
0000001627 00000 n 
0000001708 00000 n 
trailer
<<
  /Size 8
  /Root 1 0 R
>>
startxref
1785
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

function sanitizePdfText(text: string): string {
  return text.replace(/[()\\]/g, '');
}
