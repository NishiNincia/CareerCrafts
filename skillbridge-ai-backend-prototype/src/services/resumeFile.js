import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractResumeText(file) {
    const extension = file.originalname.toLowerCase().split(".").pop();

    if (extension === "pdf") {
        if (file.mimetype !== "application/pdf" || file.buffer.subarray(0, 5).toString() !== "%PDF-") {
            const error = new Error("The uploaded file is not a valid PDF.");
            error.status = 415;
            throw error;
        }

        const parser = new PDFParse({ data: file.buffer });
        try {
            const result = await parser.getText();
            return result.text.trim();
        } catch {
            const error = new Error("The PDF could not be read. Upload a text-based PDF or a DOCX file.");
            error.status = 422;
            throw error;
        } finally {
            await parser.destroy();
        }
    }

    if (extension === "docx") {
        const isDocxMime = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        const isZip = file.buffer[0] === 0x50 && file.buffer[1] === 0x4b;
        if (!isDocxMime || !isZip) {
            const error = new Error("The uploaded file is not a valid DOCX document.");
            error.status = 415;
            throw error;
        }

        try {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value.trim();
        } catch {
            const error = new Error("The DOCX document could not be read.");
            error.status = 422;
            throw error;
        }
    }

    const error = new Error("Only PDF and DOCX resumes are supported.");
    error.status = 415;
    throw error;
}
