import 'dotenv/config'
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3"
import fs from "fs"

const REGION = "ru-central1" // Yandex region
const {
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME,
} = process.env

const ENDPOINT = "https://storage.yandexcloud.net"

const s3Client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
})

// Generate a 100% unique random filename with optional extension
export function generateUniqueFileName(extension = "") {
    const timestamp = Date.now().toString(36) // base36 timestamp
    const randomPart = Math.random().toString(36).substring(2, 10) // 8-char random string
    return `${timestamp}-${randomPart}${extension ? "." + extension : ""}`
}

// Get mime type based on file extension (basic list, extend as needed)
function getMimeType(extension) {
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'html': 'text/html',
        'csv': 'text/csv',
        'mp4': 'video/mp4',
    }
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

export async function uploadToS3(filepath) {
    const fileStream = fs.createReadStream(filepath)

    // Extract file extension from original filename
    const originalFileName = filepath.split('/').pop()
    const extensionMatch = originalFileName.match(/\.([^.]+)$/)
    const extension = extensionMatch ? extensionMatch[1] : ""

    // Generate unique filename with extension
    const uniqueFileName = generateUniqueFileName(extension)

    // Get correct MIME type for this extension
    const contentType = getMimeType(extension)

    const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: uniqueFileName,
        Body: fileStream,
        ContentType: contentType,
        ACL: "public-read", // optional: make file public
    }

    try {
        await s3Client.send(new PutObjectCommand(uploadParams))
        return `${ENDPOINT}/${S3_BUCKET_NAME}/${uniqueFileName}`
    } catch (err) {
        console.error("Error uploading file: ", err)
        throw err
    }
}

// Export or use uploadToS3 function as needed
