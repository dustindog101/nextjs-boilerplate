"use client";
import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router'; // Removed: Not compatible with current environment
// For this environment, we'll use window.location.href directly for navigation.

// --- Interfaces ---
interface JwtPayload {
  userId: string;
  username: string;
  exp: number; // Expiration timestamp in seconds
}

// Re-using IdFormData structure from new order page.
// Note: photo/signature File objects are NOT included in data passed via localStorage,
// nor are they directly handled by the backend's current scope for updates.
interface IdFormData {
  id: number; // Client-side unique ID for managing forms in the UI
  state: string;
  dobMonth: string; // MM format
  dobDay: string;   // DD format
  dobYear: string;  //YYYY format
  issueMonth: string; // MM format
  issueDay: string;   // DD format
  issueYear: string;  //YYYY format
  firstName: string;
  middleName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  zipPlus4: string;
  heightFeet: string;
  heightInches: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
  sex: string;
  photo?: File; // Re-included this property
  signature?: File; // Re-included this property
}


// Full order details structure as received from backend summary
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered'; // Status from backend
  shipping: string; // Flat string address
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid';
  notes: string;
  price: {
    subtotal: number;
    total: number;
  };
  ids: IdFormData[]; // Array of detailed ID data
  userId: string; // User who placed the order (for authorization)
}

// --- Data for Dropdowns (Re-used from new order page for consistency) ---
const stateOptions = ['Pennsylvania', 'New Jersey', 'Old Maine', 'Washington', 'Oregon', 'South Carolina', 'Missouri', 'Illinois', 'Connecticut', 'Arizona', 'Florida', 'Texas'];
const eyeColorOptions = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Black'];
const hairColorOptions = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'Bald'];
const sexOptions = ['M', 'F'];
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const yearOptions = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));


// --- SVG Icons (Modified to accept props like className) ---
const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${props.className || ''}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path>
  </svg>
);
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const HashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
const CancelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);


// --- Reusable Form Components (Adapted from new order page) ---
interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean; // New prop for view mode
}
const FormInput: React.FC<FormInputProps> = ({ label, name, value, onChange, placeholder = '', type = 'text', readOnly = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`} />
  </div>
);

interface FormSelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  readOnly?: boolean; // New prop for view mode
}
const FormSelect: React.FC<FormSelectProps> = ({ label, name, value, onChange, options, readOnly = false }) => (
  <div>
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
    <select id={name} name={name} value={value} onChange={onChange} aria-label={label || name} disabled={readOnly}
      className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// This FileInput is simplified for view/edit. Actual file upload logic is out of scope for this MVP.
interface FileInputProps {
  label: string;
  fileName?: string; // Display existing filename or "No file uploaded"
  readOnly?: boolean; // If true, only displays filename
}
const FileInput: React.FC<FileInputProps> = ({ label, fileName, readOnly = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    <div className="flex items-center justify-center w-full">
      <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 rounded-lg bg-gray-700/50 ${readOnly ? 'opacity-70 cursor-not-allowed' : 'border-dashed'}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <InfoIcon className="mb-2 text-gray-500" />
          <p className="mb-2 text-sm text-gray-400">
            {fileName ? (
              <span className="font-semibold text-green-400">{fileName}</span>
            ) : (
              <span className="font-semibold">No file uploaded</span>
            )}
          </p>
          {!readOnly && <p className="text-xs text-gray-500">Upload not available in edit mode (MVP)</p>}
        </div>
      </div>
    </div>
  </div>
);

// --- Individual ID Form Component (used within accordion) ---
interface IdFormProps {
  formData: IdFormData;
  onChange: (field: keyof IdFormData, value: string) => void;
  isEditable: boolean; // Controls if inputs are active
  index: number; // For display purposes
}
const IdForm: React.FC<IdFormProps> = ({ formData, onChange, isEditable, index }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name as keyof IdFormData, e.target.value);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-700/50 rounded-lg mt-4 border border-gray-600">
      <h4 className="font-semibold text-lg text-white mb-4">ID #{index + 1} Details</h4>
      {!isEditable && (
        <div className="p-3 mb-4 rounded-lg bg-yellow-600/20 border border-yellow-500 text-yellow-300 text-sm flex items-center">
          <InfoIcon className="mr-2" /> ID details are locked for editing at this order status.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-3 lg:col-span-1"> <FormSelect label="State" name="state" value={formData.state} onChange={handleInputChange} options={stateOptions} readOnly={!isEditable} /> </div>
        <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} readOnly={!isEditable} />
        <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="Optional" readOnly={!isEditable} />
        <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} readOnly={!isEditable} />
        <div className="md:col-span-3"> <FormInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} readOnly={!isEditable} /> </div>
        <FormInput label="City" name="city" value={formData.city} onChange={handleInputChange} readOnly={!isEditable} />
        <FormInput label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="5 digits" type="number" readOnly={!isEditable} />
        <FormInput label="ZIP+4" name="zipPlus4" value={formData.zipPlus4} onChange={handleInputChange} placeholder="Optional 4 digits" type="number" readOnly={!isEditable} />
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
          <div className="grid grid-cols-3 gap-2">
            <FormSelect name="dobMonth" value={formData.dobMonth} onChange={handleInputChange} options={monthOptions} readOnly={!isEditable} />
            <FormSelect name="dobDay" value={formData.dobDay} onChange={handleInputChange} options={dayOptions} readOnly={!isEditable} />
            <FormSelect name="dobYear" value={formData.dobYear} onChange={handleInputChange} options={yearOptions} readOnly={!isEditable} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Issue Date</label>
          <div className="grid grid-cols-3 gap-2">
            <FormSelect name="issueMonth" value={formData.issueMonth} onChange={handleInputChange} options={monthOptions} readOnly={!isEditable} />
            <FormSelect name="issueDay" value={formData.issueDay} onChange={handleInputChange} options={dayOptions} readOnly={!isEditable} />
            <FormSelect name="issueYear" value={formData.issueYear} onChange={handleInputChange} options={yearOptions} readOnly={!isEditable} />
          </div>
        </div>
        <FormSelect label="Sex" name="sex" value={formData.sex} onChange={handleInputChange} options={sexOptions} readOnly={!isEditable} />
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
          <div className="grid grid-cols-2 gap-2">
            <FormInput label="Feet" name="heightFeet" value={formData.heightFeet} onChange={handleInputChange} placeholder="ft" type="number" readOnly={!isEditable} />
            <FormInput label="Inches" name="heightInches" value={formData.heightInches} onChange={handleInputChange} placeholder="in" type="number" readOnly={!isEditable} />
          </div>
        </div>
        <FormInput label="Weight (lbs)" name="weight" value={formData.weight} onChange={handleInputChange} type="number" readOnly={!isEditable} />
        <FormSelect label="Eye Color" name="eyeColor" value={formData.eyeColor} onChange={handleInputChange} options={eyeColorOptions} readOnly={!isEditable} />
        <FormSelect label="Hair Color" name="hairColor" value={formData.hairColor} onChange={handleInputChange} options={hairColorOptions} readOnly={!isEditable} />
        <div className="md:col-span-3 grid md:grid-cols-2 gap-4">
          {/* File inputs are for display only in MVP. Re-uploading not supported in edit mode here. */}
          <FileInput label="Photo Upload" fileName={formData.photo?.name || "photo.jpg (mock)"} readOnly={true} />
          <FileInput label="Signature Upload" fileName={formData.signature?.name || "signature.png (mock)"} readOnly={true} />
        </div>
      </div>
      {/* If this were a modifiable array, you might have remove buttons here */}
    </div>
  );
};

// --- Main Page Component ---
export default function ViewEditOrderPage() {
  // const router = useRouter(); // Removed: Not compatible with current environment
  const [loggedInUser, setLoggedInUser] = useState<JwtPayload | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [orderData, setOrderData] = useState<OrderDetails | null>(null); // Original fetched data
  const [editableOrderData, setEditableOrderData] = useState<OrderDetails | null>(null); // Data for editing
  const [isEditing, setIsEditing] = useState(false); // Controls view/edit mode

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for user dropdown

  // Lambda Function URL for Order Lookup & Update
  // IMPORTANT: For local MVP, these are commented out.
  // Uncomment and replace with your actual URLs when deploying to server.
  // const LAMBDA_LOOKUP_URL = 'https://wdzff7ud3albhgtlrtat2w46y40yglzn.lambda-url.us-east-1.on.aws/'; // For GET summary
  // const LAMBDA_UPDATE_URL = 'https://your-update-order-lambda-url/'; // New Lambda URL for UPDATE

  // --- Utility functions ---
  const decodeJwt = (token: string): JwtPayload | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // --- Handle User Logout ---
  // Moved to the top-level of the component so it's always defined
  const handleLogout = () => {
    localStorage.removeItem('idPirateAuthToken');
    // --- MVP Placeholder: No actual JWT removal needed for static MVP.
    // But keep this for future integration. ---
    // Use window.location.href for navigation
    window.location.href = '/account'; 
  };


  // --- Authentication Check & Initial Data Fetch ---
  useEffect(() => {
    // --- MVP Placeholder Start (Auth & Data Fetch) ---
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtdnAtZGV2LWxvY2FsLXVzZXIiLCJ1c2VybmFtZSI6Ik1WUEN1c3RvbWVyIiwiZXhwIjoxNzA1NTk2MDAwMH0.signature";
    const mockDecoded: JwtPayload = { userId: "mvp-dev-local-user", username: "MVPCustomer", exp: Math.floor(Date.now() / 1000) + (60 * 60) };
    setLoggedInUser(mockDecoded);
    setIsAuthChecking(false);

    // Simulate fetching orderId from URL (e.g., /order/mock-order-123)
    const urlParts = window.location.pathname.split('/');
    const mockOrderId = urlParts[urlParts.length - 1]; // Gets last part of URL

    // Mock Order Data based on a specific ID or default
    const mockOrderData: OrderDetails = {
      orderId: mockOrderId === 'mock-order-123' ? 'mock-order-123' : 'newly-created-order-abc', // Example specific ID
      createdAt: "2024-06-25T10:00:00Z",
      status: mockOrderId === 'mock-order-123' ? 'pending' : 'processing', // Control editability for demo
      shipping: "123 Mockingbird Lane, Testville, TS 12345, USA",
      paymentMethod: "Bitcoin",
      paymentStatus: "Paid",
      notes: "Mock order notes for testing purposes.",
      price: { subtotal: 190, total: 210 },
      userId: "mvp-dev-local-user",
      ids: [
        { id: 1, state: 'Pennsylvania', dobMonth: '01', dobDay: '01', dobYear: '2000', issueMonth: '01', issueDay: '01', issueYear: '2020', firstName: 'John', middleName: 'D', lastName: 'Doe', streetAddress: '123 Mock St', city: 'Test City', zipCode: '12345', zipPlus4: '6789', heightFeet: '5', heightInches: '10', weight: '180', eyeColor: 'Brown', hairColor: 'Black', sex: 'M' },
        { id: 2, state: 'New Jersey', dobMonth: '05', dobDay: '15', dobYear: '1998', issueMonth: '03', issueDay: '10', issueYear: '2018', firstName: 'Jane', middleName: 'A', lastName: 'Smith', streetAddress: '456 Fake Ave', city: 'Mock City', zipCode: '54321', zipPlus4: '9876', heightFeet: '5', heightInches: '5', weight: '130', eyeColor: 'Blue', hairColor: 'Blonde', sex: 'F' },
      ],
    };

    setOrderData(mockOrderData);
    setEditableOrderData(JSON.parse(JSON.stringify(mockOrderData))); // Deep copy for editing
    setIsLoadingInitialData(false);
    // --- MVP Placeholder End ---

    /* // --- Uncomment this block for actual server integration ---
    const orderIdFromUrl = window.location.pathname.split('/').pop(); // Gets last segment of URL
    if (!orderIdFromUrl) {
      setFetchError('No Order ID provided in URL.');
      setIsLoadingInitialData(false);
      return;
    }

    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) {
      window.location.href = '/account'; // Redirect to login if no token
      return;
    }

    const decoded = decodeJwt(token);
    // In a real scenario, you might send this token to a backend /verify endpoint
    // to ensure it's truly valid and not just locally decoded.
    if (!decoded || decoded.exp * 1000 < Date.now()) { // Token invalid or expired
      localStorage.removeItem('idPirateAuthToken');
      window.location.href = '/account'; // Redirect to login
      return;
    }

    setLoggedInUser(decoded);
    setIsAuthChecking(false);

    const fetchOrder = async () => {
      setIsLoadingInitialData(true);
      setFetchError(null);
      try {
        const payload = {
          requestType: "summary", // Get full order details
          orderId: orderIdFromUrl
        };
        const response = await fetch(LAMBDA_LOOKUP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        const data = await response.json();

        if (response.ok) {
          if (data && data.orderId) { // Check for actual order data
            setOrderData(data);
            setEditableOrderData(JSON.parse(JSON.stringify(data))); // Deep copy
            // Optional: check if data.userId matches decoded.userId here for extra client-side auth
            setFetchError(null);
          } else {
            setFetchError('Order data is empty or malformed.');
          }
        } else if (response.status === 404) {
          setFetchError(data.error || 'Order not found.');
        } else if (response.status === 401 || response.status === 403) {
          setFetchError(data.error || 'Unauthorized access. Please log in again.');
          localStorage.removeItem('idPirateAuthToken');
          window.location.href = '/account';
        } else {
          setFetchError(data.error || 'An unexpected error occurred while fetching order details.');
        }
      } catch (error: any) {
        console.error('Network error fetching order details:', error);
        setFetchError(`Network error: ${error.message || 'Please check your internet connection.'}`);
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchOrder();
    */
  }, []); // Run only once on mount

  // --- Handlers for editing order data ---
  const handleGeneralDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof OrderDetails) => {
    setEditableOrderData(prevData => {
      if (!prevData) return null;
      // Handle nested price object separately if needed, otherwise direct update
      // This part would need more robust logic if 'price' object itself were directly editable through UI inputs.
      // For now, assuming price is calculated/read-only based on IDs.
      if (field === 'price') { 
        console.warn("Attempted to directly edit price object, which is read-only in this context.");
        return prevData; // Do not modify price via this handler
      }
      return { ...prevData, [field]: e.target.value };
    });
  };

  const handleIdDetailsChange = (idIndex: number, fieldName: keyof IdFormData, value: string) => {
    setEditableOrderData(prevData => {
      if (!prevData) return null;
      const updatedIds = prevData.ids.map((id, idx) => {
        if (idx === idIndex) {
          return { ...id, [fieldName]: value };
        }
        return id;
      });
      return { ...prevData, ids: updatedIds };
    });
  };

  const handleEditOrder = () => {
    if (orderData && (orderData.status === 'shipped' || orderData.status === 'delivered' || orderData.status === 'processing')) { 
      // General details (shipping, notes, paymentMethod) are editable if NOT shipped/delivered.
      // ID details are only fully editable if status is 'pending'.
      if (!isGeneralDetailsEditable && !isIdDetailsFullyEditable) {
        setSaveFeedback("This order cannot be edited as it has already been shipped or delivered.");
        setIsEditing(false); // Ensure it's not in edit mode
        return;
      }
      // If order is 'processing', only general details might be editable.
      if (orderData.status === 'processing') {
        setSaveFeedback("This order is being processed. Only general details can be modified.");
      } else if (!isIdDetailsFullyEditable) { // This handles 'shipped' or 'delivered' specifically
         setSaveFeedback("This order is closed. No edits allowed.");
      }
      setIsEditing(true); // Enter edit mode, but controls will be disabled based on isEditable props
      return;
    }
    setIsEditing(true);
    setSaveFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditableOrderData(JSON.parse(JSON.stringify(orderData))); // Revert changes
    setIsEditing(false);
    setSaveFeedback(null);
  };

  const handleSaveChanges = async () => {
    setSaveFeedback(null);
    setIsSavingChanges(true);

    // --- MVP Placeholder Start (Save Changes) ---
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
    
    // Simulate validation
    if (editableOrderData?.shipping.trim().length < 10) {
      setSaveFeedback("Error: Shipping address is too short.");
      setIsSavingChanges(false);
      return;
    }
    // Simulate ID validation if editable
    if (isEditing && isIdDetailsFullyEditable && editableOrderData?.ids.some(id => !id.firstName || !id.lastName)) {
      setSaveFeedback("Error: Please fill in all required ID details.");
      setIsSavingChanges(false);
      return;
    }


    setOrderData(JSON.parse(JSON.stringify(editableOrderData))); // Commit changes locally
    setIsEditing(false);
    setSaveFeedback("Order updated successfully!");
    setIsSavingChanges(false);
    // --- MVP Placeholder End ---

    /* // --- Uncomment this block for actual server integration ---
    if (!loggedInUser || !orderData || !editableOrderData) {
      setSaveFeedback("Error: Missing user or order data.");
      setIsSavingChanges(false);
      return;
    }

    // Basic validation before sending to backend (backend should also validate)
    // Adjust validation rules based on what fields are actually editable given the order status
    if (isGeneralDetailsEditable) {
      if (editableOrderData.shipping.trim() === '' || editableOrderData.paymentMethod.trim() === '') {
        setSaveFeedback("Please fill in all required general order details (shipping, payment method).");
        setIsSavingChanges(false);
        return;
      }
    }
    if (isIdDetailsFullyEditable) {
      if (editableOrderData.ids.some(id => !id.firstName || !id.lastName || !id.state || !id.dobMonth || !id.dobDay || !id.dobYear)) { // Add more specific ID field checks
        setSaveFeedback("Please fill in all required ID details.");
        setIsSavingChanges(false);
        return;
      }
    }
    
    try {
      const payload = {
        requestType: "update_order", // New request type for Lambda
        orderId: orderData.orderId,
        updatedData: editableOrderData // Send the entire editable object
      };

      const response = await fetch(LAMBDA_UPDATE_URL, { // Use your new update Lambda URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idPirateAuthToken')}` // Send JWT
        },
        body: JSON.stringify(payload),
        mode: 'cors',
      });

      const data = await response.json();

      if (response.ok) {
        setOrderData(JSON.parse(JSON.stringify(editableOrderData))); // Commit changes locally
        setIsEditing(false);
        setSaveFeedback(data.message || "Order updated successfully!");
      } else {
        setSaveFeedback(data.error || "Failed to save changes. Please try again.");
      }
    } catch (error: any) {
      console.error('Network error saving changes:', error);
      setSaveFeedback(`Network error: ${error.message || 'Please check your internet connection.'}`);
    } finally {
      setIsSavingChanges(false);
    }
    */
  };

  if (isAuthChecking || isLoadingInitialData) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl font-semibold text-gray-300">Loading order details...</p>
        <svg className="animate-spin mt-4 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center p-8 bg-red-800/70 rounded-lg border border-red-700 max-w-md">
          <InfoIcon className="mx-auto mb-4 text-red-400 h-12 w-12" />
          <p className="text-xl text-red-400 font-semibold mb-2">Error Loading Order:</p>
          <p className="text-gray-300">{fetchError}</p>
          <a href="/dashboard" className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
            <BackArrowIcon className="mr-2"/> Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!orderData || !editableOrderData) { // Should not happen if fetchError is handled, but a safeguard
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl font-semibold text-gray-400">No order data available.</p>
        <a href="/dashboard" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
          <BackArrowIcon className="mr-2"/> Back to Dashboard
        </a>
      </div>
    );
  }

  // Determine if general order details are editable (e.g., shipping, notes)
  const isGeneralDetailsEditable = !['shipped', 'delivered'].includes(orderData.status);
  // Determine if ID details are fully editable (usually only in 'pending' status)
  const isIdDetailsFullyEditable = orderData.status === 'pending';

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col font-inter text-gray-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
        /* Dropdown Styles */
        .group:hover .group-hover-show {
          display: block;
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        /* Custom scrollbar for tables for professional look */
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #374151; /* gray-700 */
          border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #4B5563; /* gray-600 */
          border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #6B7280; /* gray-500 */
        }
      `}</style>

      {/* Header (Consistent with Dashboard) */}
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center px-4 sm:px-8">
        {/* Left: Home Button */}
        <div className="flex-shrink-0">
          <a href="/dashboard" className="flex items-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base">
            <BackArrowIcon className="mr-1 sm:mr-2" />
            Orders
          </a>
        </div>
        
        {/* Center: ID Pirate Logo */}
        <div className="flex-grow flex justify-center">
          <h1 className="font-pirate-special text-3xl sm:text-4xl font-bold text-white tracking-wider truncate px-2">
            ID Pirate
          </h1>
        </div>
        
        {/* Right: User Dropdown */}
        <div className="flex-shrink-0 relative">
          {loggedInUser && (
            <div 
              className="relative group cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <span className="text-gray-300 flex items-center text-sm sm:text-base">
                <UserIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="font-semibold">{loggedInUser.username}</span>
                <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </span>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="group-hover-show absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-1 z-50 origin-top-right animate-fade-in-scale">
                  <a href="/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">My Orders</a>
                  <a href="/settings" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Settings</a>
                  <a href="/reseller-dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Reseller Dashboard</a>
                  <a href="/risk-warn" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Risk Warning</a>
                  <div className="border-t border-gray-600 my-1"></div>
                  <button
                    onClick={handleLogout} // Calls the handleLogout function
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 hover:text-red-300"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <h2 className="font-pirate-special text-4xl font-bold text-white text-center mb-8">
          Order Details
        </h2>

        {/* Save/Error Feedback Message */}
        {saveFeedback && (
          <div className={`p-4 mb-6 rounded-lg text-center font-semibold text-white ${saveFeedback.includes('Error') ? 'bg-red-600' : 'bg-green-600'}`}>
            {saveFeedback}
          </div>
        )}

        {/* Order Overview Card */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
          <h3 className="font-semibold text-2xl text-white mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-300">
            <p><span className="font-semibold text-white">Order ID:</span> {orderData.orderId}</p>
            <p><span className="font-semibold text-white">Order Date:</span> {new Date(orderData.createdAt).toLocaleDateString()}</p>
            <p><span className="font-semibold text-white">Total Items:</span> {orderData.ids.length}</p>
            <p><span className="font-semibold text-white">Total Price:</span> ${orderData.price?.total ? orderData.price.total.toFixed(2) : 'N/A'}</p>
          </div>

          {/* Status Tracker (Re-used from tracking page) */}
          <div className="relative flex justify-between items-center text-center py-6 px-2 sm:px-4 mb-6 bg-gray-700/30 rounded-lg">
            {['pending', 'processing', 'shipped', 'delivered'].map((stageKey, index) => {
              const currentStatus = orderData.status; // Get status from actual orderData
              const currentStageIndex = ['pending', 'processing', 'shipped', 'delivered'].findIndex(s => s === currentStatus);
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;

              const stageLabel = 
                stageKey === 'pending' ? 'Order Created' :
                stageKey === 'processing' ? 'Order Processing' :
                stageKey === 'shipped' ? 'Shipped' :
                stageKey === 'delivered' ? 'Delivered' : stageKey; // Fallback

              const StageIcon = 
                stageKey === 'pending' ? InfoIcon : // Use info icon for pending
                stageKey === 'processing' ? PackageIcon : // Use package for processing
                stageKey === 'shipped' ? CalendarIcon : // Re-using calendar for shipped
                stageKey === 'delivered' ? HashIcon : // Re-using hash for delivered
                InfoIcon; // Default

              return (
                <React.Fragment key={stageKey}>
                  {/* Line connecting previous stage */}
                  {index > 0 && (
                    <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r ${isCompleted ? 'from-green-500 to-green-500' : 'from-gray-700 to-gray-700'} ${isCurrent ? 'to-transparent' : ''}`} style={{ width: `${(100 / (['pending', 'processing', 'shipped', 'delivered'].length - 1)) * index}%`, zIndex: 0, top: '40%' }}></div>
                  )}
                  
                  {/* Stage Item */}
                  <div className={`relative z-10 flex flex-col items-center flex-1 mx-1`}>
                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out 
                        ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                        ${isCurrent ? 'ring-4 ring-blue-500 ring-offset-gray-800 animate-pulse' : ''}
                    `}>
                      {isCurrent ? (
                          <StageIcon className="text-white h-5 w-5" />
                      ) : (
                          <svg className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <p className={`mt-2 text-sm text-center font-semibold ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{stageLabel}</p>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* End Status Tracker */}

          {/* Payment Status (Re-used from tracking page) */}
          <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">Payment Status: <span className={`${orderData.paymentStatus === 'Paid' ? 'text-green-400' : 'text-red-400'}`}>{orderData.paymentStatus || 'N/A'}</span></h3>
              <div className="flex items-center text-xl font-bold text-gray-300">
                  <span className="mr-2 text-blue-400 text-3xl">₿</span> {/* Placeholder for payment method logo */}
                  {orderData.paymentMethod || 'N/A'}
              </div>
          </div>

        </div>

        {/* Edit/Save/Cancel Buttons */}
        <div className="flex justify-end gap-4 mb-8">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancelEdit} 
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
                disabled={isSavingChanges}
              >
                <CancelIcon className="mr-2" /> Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
                disabled={isSavingChanges}
              >
                {isSavingChanges ? (
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <SaveIcon className="mr-2" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            // Only allow edit if status permits
            isGeneralDetailsEditable ? (
              <button 
                onClick={handleEditOrder} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <EditIcon className="mr-2" /> Edit Order
              </button>
            ) : (
              <div className="text-gray-500 text-sm p-2 rounded-lg bg-gray-700/50">
                <InfoIcon className="inline-block mr-1"/> Order not editable at this stage.
              </div>
            )
          )}
        </div>


        {/* General Order Details Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
          <h3 className="font-semibold text-2xl text-white mb-4">General Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="shipping" className="block text-sm font-medium text-gray-400 mb-1">Shipping Address</label>
              <textarea 
                id="shipping"
                name="shipping"
                rows={3}
                value={editableOrderData.shipping} 
                onChange={(e) => handleGeneralDetailsChange(e, 'shipping')}
                readOnly={!isEditing || !isGeneralDetailsEditable}
                className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${(!isEditing || !isGeneralDetailsEditable) ? 'opacity-70 cursor-not-allowed' : ''}`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={editableOrderData.paymentMethod}
                onChange={(e) => handleGeneralDetailsChange(e, 'paymentMethod')}
                disabled={!isEditing || !isGeneralDetailsEditable}
                className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${(!isEditing || !isGeneralDetailsEditable) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <option value="Bitcoin">Bitcoin</option>
                <option value="Zelle">Zelle</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Cash App">Cash App</option>
                <option value="Venmo">Venmo</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-400 mb-1">Order Notes</label>
              <textarea 
                id="notes"
                name="notes"
                rows={3}
                value={editableOrderData.notes} 
                onChange={(e) => handleGeneralDetailsChange(e, 'notes')}
                readOnly={!isEditing || !isGeneralDetailsEditable}
                className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${(!isEditing || !isGeneralDetailsEditable) ? 'opacity-70 cursor-not-allowed' : ''}`}
              ></textarea>
            </div>
          </div>
          {!isGeneralDetailsEditable && (
             <p className="text-gray-500 text-sm mt-4">General details cannot be edited for this order status.</p>
          )}
        </div>

        {/* Individual ID Details Section (Accordion/Collapsible) */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="font-semibold text-2xl text-white mb-4">Individual IDs ({editableOrderData.ids.length})</h3>
          <div className="space-y-4">
            {editableOrderData.ids.map((idData, index) => (
              <IdAccordion key={idData.id} title={`ID #${index + 1} (${idData.state} - ${idData.firstName} ${idData.lastName})`} >
                <IdForm 
                  formData={idData} 
                  onChange={(field, value) => handleIdDetailsChange(index, field, value)} 
                  isEditable={isEditing && isIdDetailsFullyEditable} // Only editable if overall editing AND status allows
                  index={index}
                />
              </IdAccordion>
            ))}
          </div>
          {/* Optional: Add button for adding new IDs if status is 'pending' and desired */}
          {/* {isEditing && isIdDetailsFullyEditable && (
            <button className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
              Add Another ID
            </button>
          )} */}
        </div>
      </main>

      {/* Footer (Pushed to bottom by flex-grow on main) */}
      <footer className="py-8 text-gray-500 text-sm text-center">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}


// --- Reusable Accordion Component for ID Forms ---
interface IdAccordionProps {
  title: string;
  children: React.ReactNode;
}
const IdAccordion: React.FC<IdAccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        className="w-full flex justify-between items-center px-4 py-3 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-white text-left">{title}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};
