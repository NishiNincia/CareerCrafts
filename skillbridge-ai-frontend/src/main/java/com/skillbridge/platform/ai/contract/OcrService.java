package com.skillbridge.platform.ai.contract;

/** Contract for OCR extraction from scanned/image-based documents (resumes, certificates). */
public interface OcrService {
    String extractText(byte[] fileBytes, String contentType);
}
