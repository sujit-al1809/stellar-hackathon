// ============================================================
// File upload utilities for proof evidence
// Supports images, PDFs, and documents
// ============================================================

/**
 * Upload image to IPFS via Pinata (free tier)
 * Alternative: Use Imgur API or Cloudinary
 */
export async function uploadToIPFS(file: File): Promise<string> {
  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const PINATA_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET;

  if (!PINATA_API_KEY || !PINATA_SECRET) {
    console.warn("No Pinata credentials - using demo upload");
    return uploadToDemo(file);
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("IPFS upload failed");
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;

    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  } catch (error) {
    console.error("IPFS upload error:", error);
    return uploadToDemo(file);
  }
}

/**
 * Upload to Imgur (simple, free, no auth needed)
 */
export async function uploadToImgur(file: File): Promise<string> {
  const IMGUR_CLIENT_ID = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID || "demo-client-id";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Imgur upload failed");
    }

    const data = await response.json();
    return data.data.link; // Direct image URL
  } catch (error) {
    console.error("Imgur upload error:", error);
    return uploadToDemo(file);
  }
}

/**
 * Demo mode - convert to base64 data URL
 * For hackathon demo only - not for production
 */
function uploadToDemo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      // Store in localStorage for demo (hack for hackathon)
      const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(demoId, base64);
      resolve(`/api/demo-image?id=${demoId}`);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File too large. Max 10MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Use JPG, PNG, WEBP, or PDF." };
  }

  return { valid: true };
}

/**
 * Main upload function - tries multiple methods
 */
export async function uploadProofFile(file: File): Promise<string> {
  // Validate first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Try Imgur first (easiest, no auth)
  try {
    return await uploadToImgur(file);
  } catch (error) {
    console.warn("Imgur failed, trying IPFS...");
  }

  // Fallback to IPFS
  try {
    return await uploadToIPFS(file);
  } catch (error) {
    console.warn("IPFS failed, using demo mode...");
  }

  // Last resort: demo mode
  return uploadToDemo(file);
}
