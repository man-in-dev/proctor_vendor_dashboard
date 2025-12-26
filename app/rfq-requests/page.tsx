'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { getVendorRfqs, createQuote, type RfqRequest, type CreateQuotePayload } from '@/lib/api';

export default function RfqRequestsPage() {
  const [rfqs, setRfqs] = useState<RfqRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RfqRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    unitPrice: '',
    deliveryDate: '',
    validTill: '',
    description: '',
    attachment: null as File | null,
  });

  useEffect(() => {
    loadRfqs();
  }, []);

  const loadRfqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const rfqData = await getVendorRfqs(token);
      setRfqs(rfqData);
    } catch (err: any) {
      setError(err.message || 'Failed to load RFQ requests');
      console.error('Error loading RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesSearch = 
      rfq.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.rfqId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || rfq.vendorStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'invited':
        return 'bg-teal-100 text-teal-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-teal-100 text-teal-800';
    }
  };

  const handleOpenQuoteForm = (rfq: RfqRequest) => {
    setSelectedRfq(rfq);
    setIsQuoteFormOpen(true);
    // Reset form
    setFormData({
      unitPrice: '',
      deliveryDate: '',
      validTill: '',
      description: '',
      attachment: null,
    });
  };

  const handleCloseQuoteForm = () => {
    setIsQuoteFormOpen(false);
    setSelectedRfq(null);
    setFormData({
      unitPrice: '',
      deliveryDate: '',
      validTill: '',
      description: '',
      attachment: null,
    });
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const quotePayload: CreateQuotePayload = {
        vendorAssignmentId: selectedRfq.assignmentId,
        unitPrice: formData.unitPrice,
        deliveryDate: formData.deliveryDate || undefined,
        validTill: formData.validTill || undefined,
        description: formData.description || undefined,
        attachment: formData.attachment ? formData.attachment.name : undefined,
        quoteStatus: 'Submitted',
      };

      await createQuote(token, quotePayload);

      // Show success and close
      handleCloseQuoteForm();
      // Reload RFQs to update status
      loadRfqs();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote');
      console.error('Error submitting quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, attachment: e.target.files[0] });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading RFQ requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">RFQ Requests</h1>
        <p className="text-gray-600">View and respond to Request for Quotations from buyers</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search RFQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Filter</span>
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option>All Status</option>
          <option>New</option>
          <option>Assigned</option>
          <option>Invited</option>
          <option>Completed</option>
        </select>
      </div>

      {/* RFQ List */}
      <div className="space-y-4">
        {filteredRfqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <p className="text-gray-600 text-lg">No RFQ requests found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery || statusFilter !== 'All Status' 
                ? 'Try adjusting your search or filter criteria' 
                : 'You don\'t have any RFQ requests at the moment'}
            </p>
          </div>
        ) : (
          filteredRfqs.map((rfq) => (
            <div key={rfq.assignmentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{rfq.productName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(rfq.vendorStatus)}`}>
                      {rfq.vendorStatus === 'Invited' ? 'New' : rfq.vendorStatus}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">{rfq.rfqId}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      <span className="text-sm">Buyer: <span className="font-medium">{rfq.buyer.name}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                      <span className="text-sm">Quantity: <span className="font-medium">{rfq.quantity} {rfq.quantity !== 'N/A' ? 'pcs' : ''}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span className="text-sm font-medium">Deadline: {formatDate(rfq.deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Action Button */}
                <div className="flex items-center">
                  <button 
                    onClick={() => handleOpenQuoteForm(rfq)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Submit Quote</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quote Submission Form - Slide Out Panel */}
      {isQuoteFormOpen && selectedRfq && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
            onClick={handleCloseQuoteForm}
          />
          
          {/* Slide Out Panel */}
          <div 
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Submit Quote</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRfq.productName} - {selectedRfq.rfqId}</p>
              </div>
              <button
                onClick={handleCloseQuoteForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                aria-label="Close form"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitQuote} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Unit Price */}
                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="unitPrice"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="Enter unit price"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="deliveryDate"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Valid Till */}
                <div>
                  <label htmlFor="validTill" className="block text-sm font-medium text-gray-700 mb-2">
                    Quote Valid Till <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="validTill"
                    required
                    value={formData.validTill}
                    onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter additional details or notes about your quote..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
                    Attachment
                  </label>
                  <input
                    type="file"
                    id="attachment"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  {formData.attachment && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {formData.attachment.name}
                    </p>
                  )}
                </div>

              </div>

              {/* Form Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseQuoteForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Quote</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

