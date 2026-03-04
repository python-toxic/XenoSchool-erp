import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

/**
 * Storage Service
 * 
 * Handles file uploads. In a production environment, this would
 * integrate with cloud storage like Cloudinary or AWS S3.
 * 
 * For development, it stores files in a local 'uploads' directory
 * and returns a mock/local URL.
 */
export class StorageService {
    private uploadDir: string;

    constructor() {
        // In a real app, this would be configurable via env vars
        this.uploadDir = path.join(process.cwd(), "uploads");
    }

    private async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Uploads a file and returns its URL.
     * 
     * @param fileData The file buffer or stream
     * @param fileName Original filename
     * @param folder Optional subfolder
     * @returns The public URL of the uploaded file
     */
    async uploadFile(fileBuffer: Buffer, fileName: string, folder: string = "docs"): Promise<string> {
        await this.ensureUploadDir();

        const ext = path.extname(fileName);
        const id = uuidv4();
        const safeFileName = `${id}${ext}`;
        const relativePath = path.join(folder, safeFileName);
        const absolutePath = path.join(this.uploadDir, relativePath);

        // Ensure subfolder exists
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });

        // Save file
        await fs.writeFile(absolutePath, fileBuffer);

        // Return a mock URL (in production, this would be the CDN URL)
        return `/uploads/${folder}/${safeFileName}`;
    }

    /**
     * Deletes a file from storage.
     */
    async deleteFile(fileUrl: string): Promise<void> {
        if (!fileUrl.startsWith("/uploads/")) return;

        const relativePath = fileUrl.replace("/uploads/", "");
        const absolutePath = path.join(this.uploadDir, relativePath);

        try {
            await fs.unlink(absolutePath);
        } catch (err) {
            console.error(`Failed to delete file: ${fileUrl}`, err);
        }
    }
}

export const storageService = new StorageService();
