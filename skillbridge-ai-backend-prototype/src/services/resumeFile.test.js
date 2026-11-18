import assert from "node:assert/strict";
import test from "node:test";
import { extractResumeText } from "./resumeFile.js";

function createPdf(text) {
    const stream = `BT /F1 18 Tf 20 80 Td (${text}) Tj ET`;
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    ];
    let document = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(document));
        document += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(document);
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) {
        document += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(document);
}

test("extracts text from a PDF after initializing the Node canvas polyfills", async () => {
    const expectedText = "CareerCrafts PDF smoke test";
    const text = await extractResumeText({
        originalname: "resume.pdf",
        mimetype: "application/pdf",
        buffer: createPdf(expectedText),
    });

    assert.match(text, new RegExp(expectedText));
});
