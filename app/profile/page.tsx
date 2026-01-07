'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { getVendorProfile, updateVendorProfile, uploadCatalogPdf, getCatalogSignedUrl, VendorProfile as VendorProfileType, uploadFile, getFileSignedUrl } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface ContactDetail {
  id: string;
  contactPerson: string;
  email: string;
  phone: string;
  designation: string;
}

interface BusinessAddress {
  id: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'office' | 'warehouse' | 'factory' | 'store' | 'others';
  customAddressLabel?: string;
}

interface Catalog {
  id: string;
  name: string;
  description: string;
  pdfFile: File | null;
  pdfFileName: string;
  pdfUrl?: string; // S3 URL
}

interface Industry {
  id: string;
  name: string;
}

interface PlatformRating {
  id: string;
  platform: string;
  rating: number;
  count: number;
  platformLink?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
}

interface ClienteleEntry {
  id: string;
  name: string;
  industry: string;
  website: string;
}

interface BusinessDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  file: File | null;
  fileName: string;
  fileUrl?: string;
}

interface Brand {
  id: string;
  name: string;
  categories: string[];
  categoryInput: string;
}

interface SupplierCatalog {
  file: File | null;
  fileName: string;
  fileUrl?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState<string | null>(null); // Track which catalog is uploading
  const [viewingPdf, setViewingPdf] = useState<string | null>(null); // Track which catalog is loading signed URL

  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [businessAddresses, setBusinessAddresses] = useState<BusinessAddress[]>([]);
  const [experience, setExperience] = useState<string>('');
  const [teamSize, setTeamSize] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [minimumOrderValue, setMinimumOrderValue] = useState<string>('');
  const [platformRatings, setPlatformRatings] = useState<PlatformRating[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industryInput, setIndustryInput] = useState<string>('');
  const [whoAreYou, setWhoAreYou] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [clientele, setClientele] = useState<ClienteleEntry[]>([]);
  const [supplierCatalog, setSupplierCatalog] = useState<SupplierCatalog>({
    file: null,
    fileName: '',
    fileUrl: undefined,
  });
  const [uploadingSupplierCatalog, setUploadingSupplierCatalog] = useState(false);
  const [viewingSupplierCatalog, setViewingSupplierCatalog] = useState(false);
  const [openAddressTypeDropdown, setOpenAddressTypeDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openAddressTypeDropdown && !target.closest('.address-type-dropdown-container')) {
        setOpenAddressTypeDropdown(null);
      }
    };

    if (openAddressTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openAddressTypeDropdown]);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const profile = await getVendorProfile(token);
      
      if (profile) {
        setExperience(profile.experience?.toString() || '');
        setTeamSize(profile.teamSize?.toString() || '');
        setAbout(profile.about || '');
        setWebsite(profile.website || '');
        setLocation((profile as any).location || '');
        setMinimumOrderValue((profile as any).minimumOrderValue?.toString() || '');
        
        // Convert backend format to frontend format (with ids)
        setPlatformRatings(
          (profile.platformRatings || []).map((rating, index) => ({
            id: (index + 1).toString(),
            platform: rating.platform,
            rating: rating.rating,
            count: rating.count,
            platformLink: (rating as any).platformLink || '',
          }))
        );
        
        setContactDetails(
          (profile.contactDetails || []).map((contact, index) => ({
            id: (index + 1).toString(),
            contactPerson: contact.contactPerson,
            email: contact.email,
            phone: contact.phone,
            designation: contact.designation || '',
          }))
        );
        
        setBusinessAddresses(
          (profile.businessAddresses || []).map((address, index) => ({
            id: (index + 1).toString(),
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            addressType: (address as any).addressType || 'office',
            customAddressLabel: (address as any).customAddressLabel || '',
          }))
        );

        const rawClientele = (profile as any).clientele as any[] | undefined;
        if (rawClientele && Array.isArray(rawClientele)) {
          setClientele(
            rawClientele.map((c, index) => ({
              id: (index + 1).toString(),
              name: c.name || '',
              industry: c.industry || '',
              website: c.website || '',
            })),
          );
        }
        
        setCatalogs(
          (profile.catalogs || []).map((catalog, index) => ({
            id: (index + 1).toString(),
            name: catalog.name,
            description: catalog.description || '',
            pdfFile: null,
            pdfFileName: catalog.pdfFileName || '',
            pdfUrl: catalog.pdfUrl,
          }))
        );
        
        setIndustries(
          (profile.industries || []).map((industry, index) => ({
            id: (index + 1).toString(),
            name: industry,
          }))
        );

        const who = (profile as any).whoAreYou;
        if (who) {
          setWhoAreYou(who);
        }

        const rawBrands = (profile as any).brands as any[] | undefined;
        if (rawBrands && Array.isArray(rawBrands)) {
          setBrands(
            rawBrands.map((b, bIndex) => ({
              id: (bIndex + 1).toString(),
              name: b.name || '',
              categories: (b.items || []).map((it: any) => it.name || '').filter((name: string) => name.length > 0),
              categoryInput: '',
            })),
          );
          
          // Load supplier catalog from first brand (backward compatibility) or separate field
          const supplierCatalogUrl = (profile as any).supplierCatalogUrl;
          const supplierCatalogFileName = (profile as any).supplierCatalogFileName;
          if (supplierCatalogUrl || (rawBrands.length > 0 && rawBrands[0].catalogUrl)) {
            setSupplierCatalog({
              file: null,
              fileName: supplierCatalogFileName || rawBrands[0].catalogFileName || '',
              fileUrl: supplierCatalogUrl || rawBrands[0].catalogUrl,
            });
          }
        } else {
          setBrands([]);
        }
        
        // Also check for supplier catalog in separate fields
        const supplierCatalogUrl = (profile as any).supplierCatalogUrl;
        const supplierCatalogFileName = (profile as any).supplierCatalogFileName;
        if (supplierCatalogUrl && !supplierCatalog.fileUrl) {
          setSupplierCatalog({
            file: null,
            fileName: supplierCatalogFileName || '',
            fileUrl: supplierCatalogUrl,
          });
        }
        
        if (profile.bankDetails) {
          setBankDetails({
            bankName: profile.bankDetails.bankName || '',
            accountHolderName: profile.bankDetails.accountHolderName || '',
            accountNumber: profile.bankDetails.accountNumber || '',
            ifscCode: profile.bankDetails.ifscCode || '',
          });
        }

        const rawBankAccounts = (profile as any).bankAccounts as any[] | undefined;
        if (rawBankAccounts && Array.isArray(rawBankAccounts) && rawBankAccounts.length > 0) {
          setBankAccounts(
            rawBankAccounts.map((b, index) => ({
              id: (index + 1).toString(),
              bankName: b.bankName || '',
              accountHolderName: b.accountHolderName || '',
              accountNumber: b.accountNumber || '',
              ifscCode: b.ifscCode || '',
            })),
          );
        } else if (profile.bankDetails) {
          setBankAccounts([
            {
              id: '1',
              bankName: profile.bankDetails.bankName || '',
              accountHolderName: profile.bankDetails.accountHolderName || '',
              accountNumber: profile.bankDetails.accountNumber || '',
              ifscCode: profile.bankDetails.ifscCode || '',
            },
          ]);
        } else {
          setBankAccounts([]);
        }

        // Load business documents if exists
        const businessDocumentsData = (profile as any).businessDocuments as any[] | undefined;
        if (businessDocumentsData && Array.isArray(businessDocumentsData)) {
          setBusinessDocuments(
            businessDocumentsData.map((doc, index) => ({
              id: (index + 1).toString(),
              documentType: doc.documentType || '',
              documentNumber: doc.documentNumber || '',
              file: null,
              fileName: doc.fileName || '',
              fileUrl: doc.fileUrl,
            }))
          );
        } else {
          setBusinessDocuments([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Convert frontend format (with ids) to backend format (without ids)
      const primaryBank = bankAccounts[0] || bankDetails;

      const profileData: Partial<VendorProfileType> = {
        experience: experience ? parseInt(experience) : undefined,
        teamSize: teamSize ? parseInt(teamSize) : undefined,
        about: about || undefined,
        website: website || undefined,
        location: location || undefined,
        minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : undefined,
        platformRatings: platformRatings.map(rating => ({
          platform: rating.platform,
          rating: rating.rating,
          count: rating.count,
          platformLink: rating.platformLink || undefined,
        })),
        contactDetails: contactDetails.map(contact => ({
          contactPerson: contact.contactPerson,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation || undefined,
        })),
        businessAddresses: businessAddresses.map(address => ({
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          addressType: address.addressType || 'office',
          customAddressLabel: address.addressType === 'others' ? (address.customAddressLabel || undefined) : undefined,
        })),
        catalogs: catalogs.map(catalog => ({
          name: catalog.name,
          description: catalog.description || '',
          pdfFileName: catalog.pdfFileName,
          pdfUrl: catalog.pdfUrl,
        })),
        industries: industries.map(industry => industry.name),
        bankDetails: {
          bankName: primaryBank.bankName || undefined,
          accountHolderName: primaryBank.accountHolderName || undefined,
          accountNumber: primaryBank.accountNumber || undefined,
          ifscCode: primaryBank.ifscCode || undefined,
        },
        // Store business documents
        businessDocuments:
          businessDocuments.length > 0
            ? businessDocuments.map((doc) => ({
                documentType: doc.documentType || undefined,
                documentNumber: doc.documentNumber || undefined,
                fileName: doc.fileName || undefined,
                fileUrl: doc.fileUrl || undefined,
              }))
            : undefined,
        whoAreYou: whoAreYou || undefined,
        brands:
          brands.length > 0
            ? brands.map((b) => ({
                name: b.name,
                items: b.categories.map((cat) => ({
                  name: cat,
                  description: '',
                })),
              }))
            : undefined,
        supplierCatalogUrl: supplierCatalog.fileUrl || undefined,
        supplierCatalogFileName: supplierCatalog.fileName || undefined,
        bankAccounts:
          bankAccounts.length > 0
            ? bankAccounts.map((b) => ({
                bankName: b.bankName || undefined,
                accountHolderName: b.accountHolderName || undefined,
                accountNumber: b.accountNumber || undefined,
                ifscCode: b.ifscCode || undefined,
              }))
            : undefined,
        clientele:
          clientele.length > 0
            ? clientele.map((c) => ({
                name: c.name,
                industry: c.industry || undefined,
                website: c.website || undefined,
              }))
            : undefined,
      } as any;

      await updateVendorProfile(token, profileData);
      
      // Show success message
      setError(null);
      showToast({ type: 'success', message: 'Profile saved successfully!' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addContactDetail = () => {
    const newContact: ContactDetail = {
      id: Date.now().toString(),
      contactPerson: '',
      email: '',
      phone: '',
      designation: '',
    };
    setContactDetails([...contactDetails, newContact]);
  };

  const removeContactDetail = (id: string) => {
    if (contactDetails.length > 1) {
      setContactDetails(contactDetails.filter(contact => contact.id !== id));
    }
  };

  const updateContactDetail = (id: string, field: keyof ContactDetail, value: string) => {
    setContactDetails(contactDetails.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const addBusinessAddress = () => {
    const newAddress: BusinessAddress = {
      id: Date.now().toString(),
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'office',
    };
    setBusinessAddresses([...businessAddresses, newAddress]);
  };

  const removeBusinessAddress = (id: string) => {
    if (businessAddresses.length > 1) {
      setBusinessAddresses(businessAddresses.filter(address => address.id !== id));
    }
  };

  const updateBusinessAddress = (id: string, field: keyof BusinessAddress, value: string) => {
    setBusinessAddresses(businessAddresses.map(address =>
      address.id === id ? { ...address, [field]: value } : address
    ));
  };

  // Catalog management
  const addCatalog = () => {
    const newCatalog: Catalog = {
      id: Date.now().toString(),
      name: '',
      description: '',
      pdfFile: null,
      pdfFileName: '',
    };
    setCatalogs([...catalogs, newCatalog]);
  };

  const removeCatalog = (id: string) => {
    if (catalogs.length > 1) {
      setCatalogs(catalogs.filter(catalog => catalog.id !== id));
    }
  };

  const updateCatalog = (id: string, field: keyof Catalog, value: string | File | null) => {
    setCatalogs(catalogs.map(catalog => {
      if (catalog.id === id) {
        return { ...catalog, [field]: value };
      }
      return catalog;
    }));
  };

  const handlePdfUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.type !== 'application/pdf') {
        showToast({ type: 'error', message: 'Please upload a PDF file only' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast({ type: 'error', message: 'File size should be less than 10MB' });
        return;
      }

      setUploadingPdf(id);
      const token = getAuthToken();
      if (!token) {
        showToast({ type: 'error', message: 'Not authenticated' });
        setUploadingPdf(null);
        return;
      }

      // Get catalog info
      const catalog = catalogs.find(c => c.id === id);
      
      // Upload to S3 using presigned URL (direct upload)
      const result = await uploadCatalogPdf(
        token, 
        file,
        catalog?.name || file.name.replace('.pdf', ''),
        catalog?.description
      );

      // Update catalog with S3 URL
      updateCatalog(id, 'pdfFile', file);
      updateCatalog(id, 'pdfFileName', result.fileName);
      updateCatalog(id, 'pdfUrl', result.url);
    } catch (err: any) {
      console.error('Error uploading PDF:', err);
      showToast({ type: 'error', message: err.message || 'Failed to upload PDF' });
    } finally {
      setUploadingPdf(null);
    }
  };

  const removePdfFile = (id: string) => {
    updateCatalog(id, 'pdfFile', null);
    updateCatalog(id, 'pdfFileName', '');
  };

  const handleViewPdf = async (catalogId: string, catalogIndex: number) => {
    try {
      setViewingPdf(catalogId);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Get signed URL for the catalog
      const signedUrl = await getCatalogSignedUrl(token, catalogIndex);
      
      // Open PDF in new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error getting signed URL:', err);
      setError(err.message || 'Failed to open PDF');
      showToast({ type: 'error', message: err.message || 'Failed to open PDF. Please try again.' });
    } finally {
      setViewingPdf(null);
    }
  };

  // Industry management (single input -> multiple badges)
  const addIndustry = () => {
    const raw = industryInput
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (raw.length === 0) return;

    const timestamp = Date.now();
    const newIndustries: Industry[] = raw.map((name, index) => ({
      id: (timestamp + index).toString(),
      name,
    }));

    setIndustries([...industries, ...newIndustries]);
    setIndustryInput('');
  };

  // Multiple bank accounts management
  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
    };
    setBankAccounts([...bankAccounts, newAccount]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter((acc) => acc.id !== id));
  };

  const updateBankAccount = (
    id: string,
    field: keyof Omit<BankAccount, 'id'>,
    value: string,
  ) => {
    setBankAccounts(
      bankAccounts.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc,
      ),
    );
  };

  const removeIndustry = (id: string) => {
    setIndustries(industries.filter((industry) => industry.id !== id));
  };

  const handleIndustryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIndustry();
    }
  };

  // Platform Rating management
  const addPlatformRating = () => {
    const newRating: PlatformRating = {
      id: Date.now().toString(),
      platform: '',
      rating: 0,
      count: 0,
    };
    setPlatformRatings([...platformRatings, newRating]);
  };

  const removePlatformRating = (id: string) => {
    if (platformRatings.length > 1) {
      setPlatformRatings(platformRatings.filter(rating => rating.id !== id));
    }
  };

  const updatePlatformRating = (id: string, field: keyof PlatformRating, value: string | number) => {
    setPlatformRatings(platformRatings.map(rating =>
      rating.id === id ? { ...rating, [field]: value } : rating
    ));
  };

  // Clientele management
  const addClient = () => {
    const newClient: ClienteleEntry = {
      id: Date.now().toString(),
      name: '',
      industry: '',
      website: '',
    };
    setClientele([...clientele, newClient]);
  };

  const removeClient = (id: string) => {
    setClientele(clientele.filter((c) => c.id !== id));
  };

  const updateClient = (id: string, field: keyof Omit<ClienteleEntry, 'id'>, value: string) => {
    setClientele(
      clientele.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  // Supplier brands & categories
  const addBrand = () => {
    const newBrand: Brand = {
      id: Date.now().toString(),
      name: '',
      categories: [],
      categoryInput: '',
    };
    setBrands([...brands, newBrand]);
  };

  const removeBrand = (id: string) => {
    setBrands(brands.filter((b) => b.id !== id));
  };

  const updateBrand = (id: string, field: keyof Brand, value: string | string[]) => {
    setBrands(
      brands.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const addBrandCategory = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;

    const raw = brand.categoryInput
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (raw.length === 0) return;

    const newCategories = raw.filter(
      (cat) => !brand.categories.includes(cat),
    );

    if (newCategories.length === 0) {
      setBrands(
        brands.map((b) =>
          b.id === brandId ? { ...b, categoryInput: '' } : b,
        ),
      );
      return;
    }

    setBrands(
      brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              categories: [...b.categories, ...newCategories],
              categoryInput: '',
            }
          : b,
      ),
    );
  };

  const removeBrandCategory = (brandId: string, category: string) => {
    setBrands(
      brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              categories: b.categories.filter((cat) => cat !== category),
            }
          : b,
      ),
    );
  };

  const handleBrandCategoryKeyDown = (
    brandId: string,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addBrandCategory(brandId);
    }
  };

  // Business document handlers
  const addBusinessDocument = () => {
    const newDocument: BusinessDocument = {
      id: Date.now().toString(),
      documentType: '',
      documentNumber: '',
      file: null,
      fileName: '',
      fileUrl: undefined,
    };
    setBusinessDocuments([...businessDocuments, newDocument]);
  };

  const removeBusinessDocument = (id: string) => {
    setBusinessDocuments(businessDocuments.filter((doc) => doc.id !== id));
  };

  const updateBusinessDocument = (id: string, field: keyof BusinessDocument, value: string) => {
    setBusinessDocuments(
      businessDocuments.map((doc) =>
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    );
  };

  const handleBusinessDocumentUpload = async (
    documentId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) {
        showToast({ type: 'error', message: 'File size should be less than 10MB' });
        return;
      }

      setUploadingDocument(documentId);
      const token = getAuthToken();
      if (!token) {
        showToast({ type: 'error', message: 'Not authenticated' });
        return;
      }

      const result = await uploadFile(token, file, 'vendor-business-documents');

      setBusinessDocuments(
        businessDocuments.map((doc) =>
          doc.id === documentId
            ? { ...doc, file, fileName: result.fileName, fileUrl: result.url }
            : doc
        )
      );

      showToast({ type: 'success', message: 'Document uploaded successfully!' });
    } catch (err: any) {
      console.error('Error uploading document:', err);
      showToast({ type: 'error', message: err.message || 'Failed to upload document' });
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleViewBusinessDocument = async (documentId: string) => {
    const document = businessDocuments.find((d) => d.id === documentId);
    if (!document?.fileUrl) return;

    try {
      setViewingDocument(documentId);
      const token = getAuthToken();
      if (!token) {
        showToast({ type: 'error', message: 'Not authenticated' });
        return;
      }

      const signedUrl = await getFileSignedUrl(token, document.fileUrl);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error getting signed URL:', err);
      showToast({ type: 'error', message: err.message || 'Failed to open document. Please try again.' });
    } finally {
      setViewingDocument(null);
    }
  };

  const removeBusinessDocumentFile = (documentId: string) => {
    setBusinessDocuments(
      businessDocuments.map((doc) =>
        doc.id === documentId
          ? { ...doc, file: null, fileName: '', fileUrl: undefined }
          : doc
      )
    );
  };

  const handleSupplierCatalogUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.type !== 'application/pdf') {
        showToast({ type: 'error', message: 'Please upload a PDF file only' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast({ type: 'error', message: 'File size should be less than 10MB' });
        return;
      }

      setUploadingSupplierCatalog(true);
      const token = getAuthToken();
      if (!token) {
        showToast({ type: 'error', message: 'Not authenticated' });
        return;
      }

      const result = await uploadFile(token, file, 'vendor-supplier-catalogs');

      setSupplierCatalog({
        file: file,
        fileName: result.fileName,
        fileUrl: result.url,
      });

      showToast({ type: 'success', message: 'Catalog uploaded successfully!' });
    } catch (err: any) {
      console.error('Error uploading supplier catalog:', err);
      showToast({ type: 'error', message: err.message || 'Failed to upload catalog' });
    } finally {
      setUploadingSupplierCatalog(false);
    }
  };

  const handleViewSupplierCatalog = async () => {
    if (!supplierCatalog.fileUrl) return;

    try {
      setViewingSupplierCatalog(true);
      const token = getAuthToken();
      if (!token) {
        showToast({ type: 'error', message: 'Not authenticated' });
        return;
      }

      const signedUrl = await getFileSignedUrl(token, supplierCatalog.fileUrl);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error getting supplier catalog URL:', err);
      showToast({ type: 'error', message: err.message || 'Failed to open catalog. Please try again.' });
    } finally {
      setViewingSupplierCatalog(false);
    }
  };

  const removeSupplierCatalog = () => {
    setSupplierCatalog({
      file: null,
      fileName: '',
      fileUrl: undefined,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Vendor</h1>
          <p className="text-gray-600">Manage your vendor profile and business details.</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving || loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save Profile
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Overview Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Profile Overview</h2>
              <p className="text-sm text-gray-500">Basic information about your business.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Row 1: Experience, Team Size, Minimum Order Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g., 10"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Size
              </label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g., 50"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Value (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={minimumOrderValue}
                  onChange={(e) => setMinimumOrderValue(e.target.value)}
                  placeholder="e.g., 10000"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            </div>

            {/* Row 2: Website, Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Mumbai, India"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 3: About */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us about your business..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Platform Ratings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Platform Ratings</h2>
                <p className="text-sm text-gray-500">Your ratings from different platforms (Google, Glassdoor, etc.).</p>
              </div>
            </div>
            <button
              onClick={addPlatformRating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Rating
            </button>
          </div>

          <div className="space-y-6">
            {platformRatings.map((platformRating, index) => (
              <div key={platformRating.id} className="border border-gray-200 rounded-lg p-4 relative">
                {platformRatings.length > 1 && (
                  <button
                    onClick={() => removePlatformRating(platformRating.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove rating"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
                
                {platformRatings.length > 1 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Rating {index + 1}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={platformRating.platform}
                      onChange={(e) => updatePlatformRating(platformRating.id, 'platform', e.target.value)}
                      placeholder="e.g., Google, Glassdoor, Trustpilot"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (1-5)
                    </label>
                    <input
                      type="number"
                      value={platformRating.rating}
                      onChange={(e) => updatePlatformRating(platformRating.id, 'rating', parseFloat(e.target.value) || 0)}
                      placeholder="4.5"
                      min="0"
                      max="5"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    {platformRating.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={star <= Math.round(platformRating.rating) ? '#fbbf24' : '#e5e7eb'}
                            stroke={star <= Math.round(platformRating.rating) ? '#fbbf24' : '#9ca3af'}
                            strokeWidth="1"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-gray-600">{platformRating.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Reviews Count
                    </label>
                    <input
                      type="number"
                      value={platformRating.count}
                      onChange={(e) => updatePlatformRating(platformRating.id, 'count', parseInt(e.target.value) || 0)}
                      placeholder="127"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Link
                    </label>
                    <input
                      type="url"
                      value={platformRating.platformLink || ''}
                      onChange={(e) => updatePlatformRating(platformRating.id, 'platformLink', e.target.value)}
                      placeholder="https://www.google.com/maps/place/your-business"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              <p className="text-sm text-gray-500">Your registered business details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                defaultValue="Premium Supplies Co."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Entity Type
              </label>
              <input
                type="text"
                defaultValue="Private Limited"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                defaultValue="22AAAAA0000A1Z5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                defaultValue="AAAAA0000A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Business Documents
                </label>
                <button
                  type="button"
                  onClick={addBusinessDocument}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Document
                </button>
              </div>

              {businessDocuments.length === 0 && (
                <p className="text-sm text-gray-500 mb-3">
                  No documents added yet. Click &quot;Add Document&quot; to upload business documents.
                </p>
              )}

              <div className="space-y-4">
                {businessDocuments.map((document, index) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4 relative">
                    {businessDocuments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBusinessDocument(document.id)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove document"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      </button>
                    )}

                    {businessDocuments.length > 1 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700">Document {index + 1}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type of Document
                        </label>
                        <select
                          value={document.documentType}
                          onChange={(e) => updateBusinessDocument(document.id, 'documentType', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select document type</option>
                          <option value="GST Certificate">GST Certificate</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Company Registration">Company Registration</option>
                          <option value="Trade License">Trade License</option>
                          <option value="MSME Certificate">MSME Certificate</option>
                          <option value="ISO Certificate">ISO Certificate</option>
                          <option value="Bank Statement">Bank Statement</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Number
                        </label>
                        <input
                          type="text"
                          value={document.documentNumber}
                          onChange={(e) => updateBusinessDocument(document.id, 'documentNumber', e.target.value)}
                          placeholder="Enter document number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Upload
                      </label>
                      {uploadingDocument === document.id ? (
                        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600">Uploading document...</p>
                          </div>
                        </div>
                      ) : !document.file && !document.fileUrl ? (
                        <div>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-3 pb-4">
                              <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="mb-1 text-xs text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-[11px] text-gray-500">Any file type (MAX. 10MB)</p>
                            </div>
                            <input
                              type="file"
                              onChange={(e) => handleBusinessDocumentUpload(document.id, e)}
                              className="hidden"
                              disabled={uploadingDocument === document.id}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {document.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {document.file && (
                                  <p className="text-[11px] text-gray-500">
                                    {(document.file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                )}
                                {document.fileUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewBusinessDocument(document.id)}
                                    disabled={viewingDocument === document.id}
                                    className="text-[11px] text-orange-500 hover:text-orange-600 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {viewingDocument === document.id ? 'Opening...' : 'View Document'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBusinessDocumentFile(document.id)}
                            className="ml-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove document"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
                <p className="text-sm text-gray-500">Primary contact information.</p>
              </div>
            </div>
            <button
              onClick={addContactDetail}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Contact
            </button>
          </div>

          <div className="space-y-6">
            {contactDetails.map((contact, index) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4 relative">
                {contactDetails.length > 1 && (
                  <button
                    onClick={() => removeContactDetail(contact.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove contact"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
                
                {contactDetails.length > 1 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Contact {index + 1}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={contact.contactPerson}
                      onChange={(e) => updateContactDetail(contact.id, 'contactPerson', e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={contact.designation}
                      onChange={(e) => updateContactDetail(contact.id, 'designation', e.target.value)}
                      placeholder="e.g., Procurement Manager, Owner"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContactDetail(contact.id, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContactDetail(contact.id, 'phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Address Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Business Address</h2>
                <p className="text-sm text-gray-500">Registered office address.</p>
              </div>
            </div>
            <button
              onClick={addBusinessAddress}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Address
            </button>
          </div>

          <div className="space-y-6">
            {businessAddresses.map((address, index) => (
              <div key={address.id} className="border border-gray-200 rounded-lg p-4 relative">
                {businessAddresses.length > 1 && (
                  <button
                    onClick={() => removeBusinessAddress(address.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove address"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
                
                {businessAddresses.length > 1 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      Address {index + 1}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-1">
                      <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                        Address Line 1
                      </label>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative address-type-dropdown-container">
                          <button
                            type="button"
                            onClick={() => setOpenAddressTypeDropdown(openAddressTypeDropdown === address.id ? null : address.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-500">Tag:</span>
                            <span className="font-semibold">
                              {address.addressType === 'others'
                                ? address.customAddressLabel || 'Others'
                                : address.addressType === 'office'
                                ? 'Office'
                                : address.addressType === 'warehouse'
                                ? 'Warehouse'
                                : address.addressType === 'factory'
                                ? 'Factory'
                                : address.addressType === 'store'
                                ? 'Store'
                                : 'Office'}
                            </span>
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={openAddressTypeDropdown === address.id ? 'transform rotate-180' : ''}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>

                          {openAddressTypeDropdown === address.id && (
                            <div className="absolute z-10 mt-1 right-0 w-32 bg-white border border-gray-300 rounded-lg shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  updateBusinessAddress(address.id, 'addressType', 'office');
                                  setOpenAddressTypeDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  address.addressType === 'office' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                Office
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBusinessAddress(address.id, 'addressType', 'warehouse');
                                  setOpenAddressTypeDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  address.addressType === 'warehouse' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                Warehouse
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBusinessAddress(address.id, 'addressType', 'factory');
                                  setOpenAddressTypeDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  address.addressType === 'factory' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                Factory
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBusinessAddress(address.id, 'addressType', 'store');
                                  setOpenAddressTypeDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  address.addressType === 'store' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                Store
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBusinessAddress(address.id, 'addressType', 'others');
                                  setOpenAddressTypeDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  address.addressType === 'others' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                Others
                              </button>
                            </div>
                          )}
                        </div>

                        {address.addressType === 'others' && (
                          <input
                            type="text"
                            value={address.customAddressLabel || ''}
                            onChange={(e) => updateBusinessAddress(address.id, 'customAddressLabel', e.target.value)}
                            placeholder="Custom tag"
                            className="px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-[11px] focus:ring-1 focus:ring-orange-500 focus:border-orange-500 max-w-[160px]"
                          />
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={address.addressLine1}
                      onChange={(e) => updateBusinessAddress(address.id, 'addressLine1', e.target.value)}
                      placeholder="123, Industrial Area"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={address.addressLine2}
                      onChange={(e) => updateBusinessAddress(address.id, 'addressLine2', e.target.value)}
                      placeholder="Phase 2, Sector 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => updateBusinessAddress(address.id, 'city', e.target.value)}
                      placeholder="Mumbai"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => updateBusinessAddress(address.id, 'state', e.target.value)}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) => updateBusinessAddress(address.id, 'pincode', e.target.value)}
                      placeholder="400001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
                <p className="text-sm text-gray-500">Payment account information for payouts.</p>
            </div>
            </div>
            <button
              type="button"
              onClick={addBankAccount}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Account
            </button>
          </div>

          {bankAccounts.length === 0 && (
            <p className="text-sm text-gray-500 mb-3">
              No bank accounts added yet. Click &quot;Add Account&quot; to create one.
            </p>
          )}

          <div className="space-y-4">
            {bankAccounts.map((account, index) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4 relative">
                {bankAccounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBankAccount(account.id)}
                    className="absolute top-3 right-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove account"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}

                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                    Account {index + 1}
                  </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                      value={account.bankName}
                      onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)}
                      placeholder="e.g., HDFC Bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                      value={account.accountHolderName}
                      onChange={(e) => updateBankAccount(account.id, 'accountHolderName', e.target.value)}
                      placeholder="e.g., Premium Supplies Co. Pvt Ltd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                      value={account.accountNumber}
                      onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                      placeholder="Enter full account number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                      value={account.ifscCode}
                      onChange={(e) => updateBankAccount(account.id, 'ifscCode', e.target.value)}
                      placeholder="e.g., HDFC0001234"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

        {/* Clientele Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                  <circle cx="10" cy="7" r="4"></circle>
                  <path d="M21 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Clientele</h2>
                <p className="text-sm text-gray-500">Key clients and brands you work with.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addClient}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Client
            </button>
          </div>

          {clientele.length === 0 && (
            <p className="text-sm text-gray-500 mb-3">
              No clients added yet. Use &quot;Add Client&quot; to list your major customers.
            </p>
          )}

          <div className="space-y-4">
            {clientele.map((client, index) => (
              <div key={client.id} className="border border-gray-200 rounded-lg p-4 relative">
                {clientele.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeClient(client.id)}
                    className="absolute top-3 right-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove client"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}

                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Client {index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client / Brand Name
                    </label>
                    <input
                      type="text"
                      value={client.name}
                      onChange={(e) => updateClient(client.id, 'name', e.target.value)}
                      placeholder="e.g., ABC Industries Ltd."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={client.industry}
                      onChange={(e) => updateClient(client.id, 'industry', e.target.value)}
                      placeholder="e.g., Manufacturing, Retail"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website / Profile Link
                    </label>
                    <input
                      type="url"
                      value={client.website}
                      onChange={(e) => updateClient(client.id, 'website', e.target.value)}
                      placeholder="https://client-website.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industries Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Industries</h2>
                <p className="text-sm text-gray-500">Industries you serve.</p>
              </div>
            </div>

          {/* Existing industries as badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {industries.length === 0 && (
              <p className="text-xs text-gray-500">No industries added yet. Add a few using the input below.</p>
            )}
            {industries.map((industry) => (
              <span
                key={industry.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs border border-pink-200"
              >
                <span>{industry.name}</span>
            <button
                  type="button"
                  onClick={() => removeIndustry(industry.id)}
                  className="ml-1 text-pink-500 hover:text-pink-700"
                  aria-label="Remove industry"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Input to add multiple industries via Enter/comma */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={industryInput}
              onChange={(e) => setIndustryInput(e.target.value)}
              onKeyDown={handleIndustryKeyDown}
              placeholder="Type industry and press Enter or comma (e.g., Manufacturing, Healthcare)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addIndustry}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>

      {/* Who Are You Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8m-4-4h8"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Who are you?</h2>
            <p className="text-sm text-gray-500">Tell us if you are a supplier or manufacturer.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setWhoAreYou('supplier')}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              whoAreYou === 'supplier'
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Supplier
          </button>
          <button
            type="button"
            onClick={() => setWhoAreYou('manufacturer')}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              whoAreYou === 'manufacturer'
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manufacturer
          </button>
        </div>
      </div>

      {/* Brands & Items Section (only for suppliers) */}
      {whoAreYou === 'supplier' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7h18M3 12h18M3 17h18"></path>
                </svg>
              </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Brands & Items</h2>
              <p className="text-sm text-gray-500">Add brands and items with catalogs you supply.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addBrand}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Brand
            </button>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleSupplierCatalogUpload}
                className="hidden"
                id="supplier-catalog-upload"
                disabled={uploadingSupplierCatalog}
              />
              <label
                htmlFor="supplier-catalog-upload"
                className="flex items-center justify-center w-10 h-10 border-2 border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-orange-500 transition-colors cursor-pointer"
                title={supplierCatalog.fileUrl ? 'Update Supplier Catalog' : 'Upload Supplier Catalog'}
              >
                {uploadingSupplierCatalog ? (
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                ) : supplierCatalog.fileUrl ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                )}
              </label>
            </div>
            {supplierCatalog.fileUrl && (
              <>
                <button
                  type="button"
                  onClick={handleViewSupplierCatalog}
                  disabled={viewingSupplierCatalog}
                  className="flex items-center justify-center w-10 h-10 border-2 border-green-300 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  title="View Supplier Catalog"
                >
                  {viewingSupplierCatalog ? (
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={removeSupplierCatalog}
                  className="flex items-center justify-center w-10 h-10 border-2 border-red-300 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  title="Remove Supplier Catalog"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

          {brands.length === 0 && (
            <p className="text-sm text-gray-500">No brands added yet. Click &quot;Add Brand&quot; to get started.</p>
          )}

          <div className="space-y-6 mt-4">
            {brands.map((brand) => (
              <div key={brand.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand Name
                      </label>
                  <input
                    type="text"
                        value={brand.name}
                        onChange={(e) => updateBrand(brand.id, 'name', e.target.value)}
                        placeholder="e.g., BrandX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categories
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={brand.categoryInput}
                          onChange={(e) => updateBrand(brand.id, 'categoryInput', e.target.value)}
                          onKeyDown={(e) => handleBrandCategoryKeyDown(brand.id, e)}
                          placeholder="Type and press Enter or comma"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                  <button
                          type="button"
                          onClick={() => addBrandCategory(brand.id)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBrand(brand.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove brand"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                </div>

                {/* Existing categories as badges */}
                {brand.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brand.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200"
                      >
                        <span>{category}</span>
                        <button
                          type="button"
                          onClick={() => removeBrandCategory(brand.id, category)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          aria-label="Remove category"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalogs Section (only for manufacturers) */}
      {whoAreYou === 'manufacturer' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Catalogs</h2>
                <p className="text-sm text-gray-500">Product catalogs and their descriptions.</p>
              </div>
            </div>
            <button
              onClick={addCatalog}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Catalog
            </button>
          </div>

          <div className="space-y-6">
            {catalogs.map((catalog, index) => (
              <div key={catalog.id} className="border border-gray-200 rounded-lg p-4 pt-8 relative">
                {catalogs.length > 1 && (
                  <button
                    onClick={() => removeCatalog(catalog.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove catalog"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
                
                <div className="mb-4 flex items-center justify-between">
                  {catalogs.length > 1 && (
                    <span className="text-sm font-medium text-gray-700">Catalog {index + 1}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handlePdfUpload(catalog.id, e)}
                        className="hidden"
                        id={`catalog-upload-${catalog.id}`}
                        disabled={uploadingPdf === catalog.id}
                      />
                      <label
                        htmlFor={`catalog-upload-${catalog.id}`}
                        className="flex items-center justify-center w-10 h-10 border-2 border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-orange-500 transition-colors cursor-pointer"
                        title={catalog.pdfUrl ? 'Update Catalog PDF' : 'Upload Catalog PDF'}
                      >
                        {uploadingPdf === catalog.id ? (
                          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : catalog.pdfUrl ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        )}
                      </label>
                    </div>
                    {catalog.pdfUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const catalogIndex = catalogs.findIndex(c => c.id === catalog.id);
                            if (catalogIndex !== -1) {
                              handleViewPdf(catalog.id, catalogIndex);
                            }
                          }}
                          disabled={viewingPdf === catalog.id}
                          className="flex items-center justify-center w-10 h-10 border-2 border-green-300 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          title="View Catalog PDF"
                        >
                          {viewingPdf === catalog.id ? (
                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePdfFile(catalog.id)}
                          className="flex items-center justify-center w-10 h-10 border-2 border-red-300 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          title="Remove Catalog PDF"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catalog Name
                    </label>
                    <input
                      type="text"
                      value={catalog.name}
                      onChange={(e) => updateCatalog(catalog.id, 'name', e.target.value)}
                      placeholder="e.g., Industrial Supplies 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={catalog.description}
                      onChange={(e) => updateCatalog(catalog.id, 'description', e.target.value)}
                      placeholder="Describe the products and categories in this catalog..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
