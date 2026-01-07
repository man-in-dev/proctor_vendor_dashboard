/**
 * API utility functions for communicating with the backend
 */

// Node.js backend (auth, etc.)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ===== Auth types =====
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface TokenResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  detail?: any;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Sign up a new user
 * Calls: POST /api/auth/signup
 */
export async function signup(payload: SignupPayload): Promise<TokenResponse> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData: ApiSuccessResponse<TokenResponse> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    const errorMessage = errorResponse.message || errorResponse.error || 'Signup failed';
    throw new Error(errorMessage);
  }

  return (responseData as ApiSuccessResponse<TokenResponse>).data;
}

/**
 * Log in a user and get JWT token
 * Calls: POST /api/auth/login
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const responseData: ApiSuccessResponse<TokenResponse> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    const errorMessage = errorResponse.message || errorResponse.error || 'Login failed';
    throw new Error(errorMessage);
  }

  return (responseData as ApiSuccessResponse<TokenResponse>).data;
}

/**
 * Get the currently authenticated user using the stored JWT token
 * Calls: GET /api/auth/me
 */
export async function getCurrentUser(token: string): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseData: ApiSuccessResponse<CurrentUser> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Not authenticated');
  }

  return (responseData as ApiSuccessResponse<CurrentUser>).data;
}

// Vendor Profile Types
export interface ContactDetail {
  contactPerson: string;
  email: string;
  phone: string;
  designation?: string;
}

export interface BusinessAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  addressType?: 'office' | 'warehouse' | 'factory' | 'store' | 'others';
  customAddressLabel?: string;
}

export interface PlatformRating {
  platform: string;
  rating: number;
  count: number;
  platformLink?: string;
}

export interface Catalog {
  name: string;
  description: string;
  pdfUrl?: string;
  pdfFileName?: string;
}

export interface ClienteleEntry {
  name: string;
  industry?: string;
  website?: string;
}

export interface VendorProfile {
  _id?: string;
  experience?: number;
  teamSize?: number;
  about?: string;
  website?: string;
  location?: string;
  minimumOrderValue?: number;
  clientele?: ClienteleEntry[];
  platformRatings?: PlatformRating[];
  contactDetails?: ContactDetail[];
  businessAddresses?: BusinessAddress[];
  catalogs?: Catalog[];
  industries?: string[];
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get vendor profile
 * Calls: GET /api/vendor/profile
 */
export async function getVendorProfile(token: string): Promise<VendorProfile | null> {
  const response = await fetch(`${API_URL}/api/vendor/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseData: ApiSuccessResponse<{ profile: VendorProfile | null }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get vendor profile');
  }

  return (responseData as ApiSuccessResponse<{ profile: VendorProfile | null }>).data.profile;
}

/**
 * Update vendor profile
 * Calls: PUT /api/vendor/profile
 */
export async function updateVendorProfile(token: string, profileData: Partial<VendorProfile>): Promise<VendorProfile> {
  const response = await fetch(`${API_URL}/api/vendor/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const responseData: ApiSuccessResponse<{ profile: VendorProfile }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to update vendor profile');
  }

  return (responseData as ApiSuccessResponse<{ profile: VendorProfile }>).data.profile;
}

/**
 * Generate presigned URL for catalog PDF upload to S3
 * Calls: POST /api/vendor/catalog/presigned-url
 */
export async function generatePresignedUrl(token: string, fileName: string): Promise<{
  presignedUrl: string;
  s3Url: string;
  key: string;
  fileName: string;
}> {
  const response = await fetch(`${API_URL}/api/vendor/catalog/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName }),
  });

  const responseData: ApiSuccessResponse<{
    presignedUrl: string;
    s3Url: string;
    key: string;
    fileName: string;
  }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to generate presigned URL');
  }

  return (responseData as ApiSuccessResponse<{
    presignedUrl: string;
    s3Url: string;
    key: string;
    fileName: string;
  }>).data;
}

/**
 * Upload catalog PDF directly to S3 using presigned URL
 * This uploads the file directly to S3, bypassing the server
 */
export async function uploadCatalogPdfToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.statusText}`);
  }
}

/**
 * Confirm catalog upload and save to profile
 * Calls: POST /api/vendor/catalog/confirm-upload
 */
export async function confirmCatalogUpload(
  token: string,
  s3Url: string,
  fileName: string,
  catalogName?: string,
  description?: string
): Promise<Catalog> {
  const response = await fetch(`${API_URL}/api/vendor/catalog/confirm-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      s3Url,
      fileName,
      catalogName,
      description,
    }),
  });

  const responseData: ApiSuccessResponse<{ catalog: Catalog }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to confirm catalog upload');
  }

  return (responseData as ApiSuccessResponse<{ catalog: Catalog }>).data.catalog;
}

/**
 * Upload catalog PDF to S3 (convenience function that combines all steps)
 * Calls: POST /api/vendor/catalog/presigned-url, then PUT to S3, then POST /api/vendor/catalog/confirm-upload
 */
export async function uploadCatalogPdf(
  token: string,
  file: File,
  catalogName?: string,
  description?: string
): Promise<{ url: string; fileName: string; fileSize: number }> {
  // Step 1: Generate presigned URL
  const { presignedUrl, s3Url } = await generatePresignedUrl(token, file.name);

  // Step 2: Upload file directly to S3
  await uploadCatalogPdfToS3(presignedUrl, file);

  // Step 3: Confirm upload and save to profile
  await confirmCatalogUpload(token, s3Url, file.name, catalogName, description);

  return {
    url: s3Url,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Generate presigned URL for generic file upload to S3
 * Calls: POST /api/product-sheet/presigned-url (generic endpoint)
 */
export async function generatePresignedUrlForFile(
  token: string,
  fileName: string,
  folder: string = 'vendor-attachments',
  contentType?: string
): Promise<{
  presignedUrl: string;
  s3Url: string;
  key: string;
  fileName: string;
}> {
  const response = await fetch(`${API_URL}/api/product-sheet/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName, folder, contentType }),
  });

  const responseData: ApiSuccessResponse<{
    presignedUrl: string;
    s3Url: string;
    key: string;
    fileName: string;
  }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to generate presigned URL');
  }

  return (responseData as ApiSuccessResponse<{
    presignedUrl: string;
    s3Url: string;
    key: string;
    fileName: string;
  }>).data;
}

/**
 * Upload file directly to S3 using presigned URL (generic version)
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  // Determine content type based on file extension
  const getContentType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  };

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': getContentType(file.name),
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.statusText}`);
  }
}

/**
 * Upload file to S3 (convenience function for generic files)
 */
export async function uploadFile(
  token: string,
  file: File,
  folder: string = 'vendor-attachments'
): Promise<{ url: string; fileName: string; fileSize: number }> {
  // Step 1: Generate presigned URL
  const { presignedUrl, s3Url } = await generatePresignedUrlForFile(token, file.name, folder);

  // Step 2: Upload file directly to S3
  await uploadFileToS3(presignedUrl, file);

  return {
    url: s3Url,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Get signed URL for viewing a catalog PDF
 * Calls: GET /api/vendor/catalog/:catalogIndex/signed-url
 * @param token - JWT authentication token
 * @param catalogIndex - Index of the catalog in the vendor's catalog array (0-based)
 * @returns Signed URL that can be used to access the PDF
 */
export async function getCatalogSignedUrl(token: string, catalogIndex: number): Promise<string> {
  const response = await fetch(`${API_URL}/api/vendor/catalog/${catalogIndex}/signed-url`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseData: ApiSuccessResponse<{ signedUrl: string }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get signed URL');
  }

  return (responseData as ApiSuccessResponse<{ signedUrl: string }>).data.signedUrl;
}

/**
 * Get Google OAuth authorization URL
 * Calls: GET /api/auth/google?redirect=<redirect_url>
 * @param redirectUrl - Optional URL to redirect to after OAuth success
 */
export async function getGoogleAuthUrl(redirectUrl?: string): Promise<string> {
  const url = new URL(`${API_URL}/api/auth/google`);
  if (redirectUrl) {
    // Pass the current origin as redirect so backend knows where to redirect
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    url.searchParams.set('redirect', currentOrigin + redirectUrl);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseData: ApiSuccessResponse<{ authUrl: string }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get Google OAuth URL');
  }

  return (responseData as ApiSuccessResponse<{ authUrl: string }>).data.authUrl;
}

// RFQ Request Types
export interface RfqRequest {
  rfqId: string;
  assignmentId: string;
  enquiryProductId: string;
  productName: string;
  quantity: string;
  targetUnitPrice: string;
  buyer: {
    name: string;
    email: string;
  };
  deadline: string;
  status: string;
  createdAt?: string;
}

/**
 * Get RFQ requests for the authenticated vendor
 * Calls: GET /api/vendor/rfqs
 */
export async function getVendorRfqs(token: string): Promise<RfqRequest[]> {
  const response = await fetch(`${API_URL}/api/vendor/rfqs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseData: ApiSuccessResponse<{ rfqs: RfqRequest[] }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get RFQ requests');
  }

  return (responseData as ApiSuccessResponse<{ rfqs: RfqRequest[] }>).data.rfqs;
}

// Quote Types
export interface Quote {
  _id?: string;
  vendorAssignmentId: string | any;
  unitPrice?: string;
  deliveryDate?: string;
  validTill?: string;
  description?: string;
  attachment?: string;
  visibletoClient: boolean;
  adminStatus: string;
  buyerStatus: string;
  vendorStatus: 'sent' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuotePayload {
  vendorAssignmentId: string;
  unitPrice?: string;
  deliveryDate?: string;
  validTill?: string;
  description?: string;
  attachment?: string;
  vendorStatus?: 'sent' | 'accepted' | 'rejected';
}

/**
 * Create a new quote
 * Calls: POST /api/vendor/quotes
 */
export async function createQuote(token: string, payload: CreateQuotePayload): Promise<Quote> {
  const response = await fetch(`${API_URL}/api/vendor/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData: ApiSuccessResponse<{ quote: Quote }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to create quote');
  }

  return (responseData as ApiSuccessResponse<{ quote: Quote }>).data.quote;
}

/**
 * Get a short-lived signed URL for viewing/downloading a file
 * Calls: POST /api/product-sheet/presigned-download
 */
export async function getFileSignedUrl(token: string, fileUrl: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/product-sheet/presigned-download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileUrl }),
  });

  const responseData: ApiSuccessResponse<{ signedUrl: string }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get signed file URL');
  }

  return (responseData as ApiSuccessResponse<{ signedUrl: string }>).data.signedUrl;
}

/**
 * Get all quotes for the authenticated vendor
 * Calls: GET /api/vendor/quotes
 */
export async function getVendorQuotes(token: string): Promise<Quote[]> {
  const response = await fetch(`${API_URL}/api/vendor/quotes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseData: ApiSuccessResponse<{ quotes: Quote[] }> | ApiErrorResponse = await response.json();

  if (!response.ok || !responseData.success) {
    const errorResponse = responseData as ApiErrorResponse;
    throw new Error(errorResponse.message || errorResponse.error || 'Failed to get quotes');
  }

  return (responseData as ApiSuccessResponse<{ quotes: Quote[] }>).data.quotes;
}