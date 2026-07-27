package com.skillbridge.platform.common.storage;

public interface StorageService {
    /** Uploads a file and returns a publicly resolvable (or pre-signed) URL. */
    String upload(byte[] content, String key, String contentType);

    byte[] download(String key);

    void delete(String key);
}
