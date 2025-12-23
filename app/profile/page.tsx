'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { getVendorProfile, updateVendorProfile, uploadCatalogPdf, VendorProfile as VendorProfileType } from '@/lib/api';

interface ContactDetail {
  id: string;
  contactPerson: string;
  email: string;
  phone: string;
}

interface BusinessAddress {
  id: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
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
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState<string | null>(null); // Track which catalog is uploading

  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [businessAddresses, setBusinessAddresses] = useState<BusinessAddress[]>([]);
  const [experience, setExperience] = useState<string>('');
  const [teamSize, setTeamSize] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [platformRatings, setPlatformRatings] = useState<PlatformRating[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });

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
        
        // Convert backend format to frontend format (with ids)
        setPlatformRatings(
          (profile.platformRatings || []).map((rating, index) => ({
            id: (index + 1).toString(),
            platform: rating.platform,
            rating: rating.rating,
            count: rating.count,
          }))
        );
        
        setContactDetails(
          (profile.contactDetails || []).map((contact, index) => ({
            id: (index + 1).toString(),
            contactPerson: contact.contactPerson,
            email: contact.email,
            phone: contact.phone,
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
          }))
        );
        
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
        
        if (profile.bankDetails) {
          setBankDetails({
            bankName: profile.bankDetails.bankName || '',
            accountHolderName: profile.bankDetails.accountHolderName || '',
            accountNumber: profile.bankDetails.accountNumber || '',
            ifscCode: profile.bankDetails.ifscCode || '',
          });
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
      const profileData: Partial<VendorProfileType> = {
        experience: experience ? parseInt(experience) : undefined,
        teamSize: teamSize ? parseInt(teamSize) : undefined,
        about: about || undefined,
        website: website || undefined,
        platformRatings: platformRatings.map(rating => ({
          platform: rating.platform,
          rating: rating.rating,
          count: rating.count,
        })),
        contactDetails: contactDetails.map(contact => ({
          contactPerson: contact.contactPerson,
          email: contact.email,
          phone: contact.phone,
        })),
        businessAddresses: businessAddresses.map(address => ({
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        })),
        catalogs: catalogs.map(catalog => ({
          name: catalog.name,
          description: catalog.description || '',
          pdfFileName: catalog.pdfFileName,
          pdfUrl: catalog.pdfUrl,
        })),
        industries: industries.map(industry => industry.name),
        bankDetails: {
          bankName: bankDetails.bankName || undefined,
          accountHolderName: bankDetails.accountHolderName || undefined,
          accountNumber: bankDetails.accountNumber || undefined,
          ifscCode: bankDetails.ifscCode || undefined,
        },
      };

      await updateVendorProfile(token, profileData);
      
      // Show success message
      setError(null);
      alert('Profile saved successfully!');
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
        alert('Please upload a PDF file only');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size should be less than 10MB');
        return;
      }

      setUploadingPdf(id);
      const token = getAuthToken();
      if (!token) {
        alert('Not authenticated');
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
      alert(err.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(null);
    }
  };

  const removePdfFile = (id: string) => {
    updateCatalog(id, 'pdfFile', null);
    updateCatalog(id, 'pdfFileName', '');
  };

  // Industry management
  const addIndustry = () => {
    const newIndustry: Industry = {
      id: Date.now().toString(),
      name: '',
    };
    setIndustries([...industries, newIndustry]);
  };

  const removeIndustry = (id: string) => {
    if (industries.length > 1) {
      setIndustries(industries.filter(industry => industry.id !== id));
    }
  };

  const updateIndustry = (id: string, field: keyof Industry, value: string) => {
    setIndustries(industries.map(industry =>
      industry.id === id ? { ...industry, [field]: value } : industry
    ));
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <span className="text-sm font-medium text-gray-700">Address {index + 1}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
              <p className="text-sm text-gray-500">Payment account information (masked for security).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                defaultValue="HDFC Bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                defaultValue="Premium Supplies Co. Pvt Ltd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                defaultValue=".......7890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                defaultValue="HDFC0001234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> To update bank details, please contact support for verification.
            </p>
          </div>
        </div>

        {/* Industries Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
            <button
              onClick={addIndustry}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Industry
            </button>
          </div>

          <div className="space-y-4">
            {industries.map((industry, index) => (
              <div key={industry.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={industry.name}
                    onChange={(e) => updateIndustry(industry.id, 'name', e.target.value)}
                    placeholder={`Industry ${index + 1} (e.g., Manufacturing, Healthcare, etc.)`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                {industries.length > 1 && (
                  <button
                    onClick={() => removeIndustry(industry.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove industry"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Catalogs Section */}
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
              <div key={catalog.id} className="border border-gray-200 rounded-lg p-4 relative">
                {catalogs.length > 1 && (
                  <button
                    onClick={() => removeCatalog(catalog.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove catalog"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                )}
                
                {catalogs.length > 1 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Catalog {index + 1}</span>
                  </div>
                )}

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catalog PDF
                    </label>
                    {uploadingPdf === catalog.id ? (
                      <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-600">Uploading PDF...</p>
                        </div>
                      </div>
                    ) : !catalog.pdfFile && !catalog.pdfUrl ? (
                      <div className="mt-1">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF only (MAX. 10MB)</p>
                          </div>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handlePdfUpload(catalog.id, e)}
                            className="hidden"
                            disabled={uploadingPdf === catalog.id}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {catalog.pdfFileName}
                            </p>
                            <div className="flex items-center gap-2">
                              {catalog.pdfFile && (
                                <p className="text-xs text-gray-500">
                                  {(catalog.pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              )}
                              {catalog.pdfUrl && (
                                <a
                                  href={catalog.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-orange-500 hover:text-orange-600 underline"
                                >
                                  View PDF
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePdfFile(catalog.id)}
                          className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove PDF"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
