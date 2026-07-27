package com.skillbridge.platform.common.storage;

import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;

/**
 * S3-compatible storage adapter (works against AWS S3 as well as
 * MinIO / DigitalOcean Spaces / any S3-compatible endpoint via
 * {@code app.storage.endpoint}).
 */
@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${app.storage.bucket}")
    private String bucket;

    @Value("${app.storage.public-base-url}")
    private String publicBaseUrl;

    @Override
    public String upload(byte[] content, String key, String contentType) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(request, RequestBody.fromBytes(content));
            return publicBaseUrl + "/" + bucket + "/" + key;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.FILE_UPLOAD_FAILED, "Failed to upload file to storage");
        }
    }

    @Override
    public byte[] download(String key) {
        try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            return in.readAllBytes();
        } catch (IOException | S3Exception e) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "File not found in storage");
        }
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}
