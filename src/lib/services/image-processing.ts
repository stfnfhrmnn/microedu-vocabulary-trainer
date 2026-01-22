/**
 * Image Processing Service
 *
 * Handles:
 * - WebP conversion for storage efficiency
 * - Image resizing with max 12MP limit
 * - Auto-crop to document boundaries
 */

// ============================================================================
// Configuration
// ============================================================================

const MAX_MEGAPIXELS = 12
const MAX_PIXELS = MAX_MEGAPIXELS * 1000000 // 12 million pixels
const WEBP_QUALITY = 0.85 // Balance between quality and size
const JPEG_FALLBACK_QUALITY = 0.85

// ============================================================================
// Image Loading
// ============================================================================

/**
 * Load an image from a Blob or File
 */
function loadImage(source: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(source)
  })
}

// ============================================================================
// Canvas Operations
// ============================================================================

/**
 * Create a canvas with the image drawn on it
 */
function createCanvasFromImage(
  img: HTMLImageElement,
  width?: number,
  height?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width || img.width
  canvas.height = height || img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Get canvas as blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      mimeType,
      quality
    )
  })
}

// ============================================================================
// Image Resizing
// ============================================================================

/**
 * Calculate new dimensions to fit within max pixel count
 */
function calculateResizedDimensions(
  width: number,
  height: number,
  maxPixels: number = MAX_PIXELS
): { width: number; height: number; scaled: boolean } {
  const currentPixels = width * height

  if (currentPixels <= maxPixels) {
    return { width, height, scaled: false }
  }

  const scale = Math.sqrt(maxPixels / currentPixels)
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
    scaled: true,
  }
}

/**
 * Resize image to fit within max megapixels
 */
async function resizeImage(
  img: HTMLImageElement,
  maxPixels: number = MAX_PIXELS
): Promise<HTMLCanvasElement> {
  const { width, height } = calculateResizedDimensions(img.width, img.height, maxPixels)
  return createCanvasFromImage(img, width, height)
}

// ============================================================================
// WebP Conversion
// ============================================================================

/**
 * Check if WebP is supported
 */
function isWebPSupported(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

/**
 * Convert canvas to WebP (with JPEG fallback)
 */
async function canvasToWebP(canvas: HTMLCanvasElement): Promise<{ blob: Blob; mimeType: string }> {
  const supportsWebP = isWebPSupported()

  if (supportsWebP) {
    try {
      const blob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)
      return { blob, mimeType: 'image/webp' }
    } catch {
      // Fall through to JPEG
    }
  }

  // Fallback to JPEG
  const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_FALLBACK_QUALITY)
  return { blob, mimeType: 'image/jpeg' }
}

// ============================================================================
// Auto-Crop Detection
// ============================================================================

interface CropBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Detect document/book boundaries using edge detection
 * This is a simplified algorithm that looks for contrast changes
 */
function detectDocumentBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): CropBounds | null {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Helper to get grayscale value at pixel
  const getGray = (x: number, y: number): number => {
    const i = (y * width + x) * 4
    return (data[i] + data[i + 1] + data[i + 2]) / 3
  }

  // Scan from edges to find content boundaries
  const threshold = 20 // Minimum contrast difference
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 100))

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  // Find top boundary
  for (let y = 0; y < height / 2; y += sampleStep) {
    let hasContent = false
    for (let x = 0; x < width; x += sampleStep) {
      const gray = getGray(x, y)
      // Look for significant variation from white (background)
      if (gray < 240) {
        hasContent = true
        break
      }
    }
    if (hasContent) {
      top = Math.max(0, y - sampleStep * 2)
      break
    }
  }

  // Find bottom boundary
  for (let y = height - 1; y > height / 2; y -= sampleStep) {
    let hasContent = false
    for (let x = 0; x < width; x += sampleStep) {
      const gray = getGray(x, y)
      if (gray < 240) {
        hasContent = true
        break
      }
    }
    if (hasContent) {
      bottom = Math.min(height - 1, y + sampleStep * 2)
      break
    }
  }

  // Find left boundary
  for (let x = 0; x < width / 2; x += sampleStep) {
    let hasContent = false
    for (let y = top; y < bottom; y += sampleStep) {
      const gray = getGray(x, y)
      if (gray < 240) {
        hasContent = true
        break
      }
    }
    if (hasContent) {
      left = Math.max(0, x - sampleStep * 2)
      break
    }
  }

  // Find right boundary
  for (let x = width - 1; x > width / 2; x -= sampleStep) {
    let hasContent = false
    for (let y = top; y < bottom; y += sampleStep) {
      const gray = getGray(x, y)
      if (gray < 240) {
        hasContent = true
        break
      }
    }
    if (hasContent) {
      right = Math.min(width - 1, x + sampleStep * 2)
      break
    }
  }

  // Only return bounds if significant cropping is possible (>10% reduction)
  const croppedArea = (right - left) * (bottom - top)
  const originalArea = width * height
  const reduction = 1 - croppedArea / originalArea

  if (reduction > 0.1) {
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    }
  }

  return null
}

/**
 * Apply crop bounds to canvas
 */
function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  bounds: CropBounds
): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = bounds.width
  croppedCanvas.height = bounds.height

  const ctx = croppedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return croppedCanvas
}

// ============================================================================
// Main Processing Functions
// ============================================================================

export interface ProcessedImage {
  blob: Blob
  mimeType: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  wasResized: boolean
  wasCropped: boolean
  compressionRatio: number
}

export interface ProcessImageOptions {
  autoCrop?: boolean
  maxPixels?: number
  convertToWebP?: boolean
}

/**
 * Process an image: auto-crop, resize, and convert to WebP
 */
export async function processImage(
  source: Blob | File,
  options: ProcessImageOptions = {}
): Promise<ProcessedImage> {
  const {
    autoCrop = true,
    maxPixels = MAX_PIXELS,
    convertToWebP = true,
  } = options

  const originalSize = source.size
  const img = await loadImage(source)
  const originalWidth = img.width
  const originalHeight = img.height

  // Start with full image
  let canvas = createCanvasFromImage(img)
  let wasCropped = false

  // Step 1: Auto-crop if enabled
  if (autoCrop) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const bounds = detectDocumentBounds(ctx, canvas.width, canvas.height)
      if (bounds) {
        canvas = cropCanvas(canvas, bounds)
        wasCropped = true
      }
    }
  }

  // Step 2: Resize if exceeds max pixels
  const currentPixels = canvas.width * canvas.height
  let wasResized = false

  if (currentPixels > maxPixels) {
    const { width, height } = calculateResizedDimensions(canvas.width, canvas.height, maxPixels)

    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = width
    resizedCanvas.height = height

    const ctx = resizedCanvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, width, height)
      canvas = resizedCanvas
      wasResized = true
    }
  }

  // Step 3: Convert to WebP (or JPEG fallback)
  let result: { blob: Blob; mimeType: string }

  if (convertToWebP) {
    result = await canvasToWebP(canvas)
  } else {
    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_FALLBACK_QUALITY)
    result = { blob, mimeType: 'image/jpeg' }
  }

  return {
    blob: result.blob,
    mimeType: result.mimeType,
    width: canvas.width,
    height: canvas.height,
    originalWidth,
    originalHeight,
    wasResized,
    wasCropped,
    compressionRatio: result.blob.size / originalSize,
  }
}

/**
 * Quick check: does this image need processing?
 */
export async function needsProcessing(source: Blob | File): Promise<boolean> {
  const img = await loadImage(source)
  const pixels = img.width * img.height
  const isWebP = source.type === 'image/webp'

  // Needs processing if:
  // - Too large (> MAX_PIXELS)
  // - Not WebP format
  return pixels > MAX_PIXELS || !isWebP
}

/**
 * Get image dimensions without full processing
 */
export async function getImageDimensions(
  source: Blob | File
): Promise<{ width: number; height: number; megapixels: number }> {
  const img = await loadImage(source)
  return {
    width: img.width,
    height: img.height,
    megapixels: (img.width * img.height) / 1000000,
  }
}
