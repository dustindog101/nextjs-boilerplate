// --- START OF FILE app/order/new/page.tsx (Modified) ---

"use client";
import React, { useState } from 'react';

// --- Type Definitions ---
interface IdFormData {
  id: number;
  state: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  issueMonth: string;
  issueDay: string;
  issueYear: string;
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
  photo?: File; // File object, will not be passed directly to checkout/DB
  signature?: File; // File object, will not be passed directly to checkout/DB
}

// --- Prop Type Definitions for Components ---
interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string; // Added type prop for input elements
}

interface FormSelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

interface FileInputProps {
  label: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
}

interface IdFormProps {
  formData: IdFormData;
  onChange: (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isFile?: boolean) => void;
}


// --- Data for Dropdowns ---
const stateOptions = ['Pennsylvania', 'New Jersey', 'Old Maine', 'Washington', 'Oregon', 'South Carolina', 'Missouri', 'Illinois', 'Connecticut', 'Arizona', 'Florida', 'Texas'];
const eyeColorOptions = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Black'];
const hairColorOptions = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'Bald'];
const sexOptions = ['M', 'F'];
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const yearOptions = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));


// --- SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const UploadIcon = () => <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;


// --- Reusable Form Components ---
const FormInput: React.FC<FormInputProps> = ({ label, name, value, onChange, placeholder = '', type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
    </div>
);

const FormSelect: React.FC<FormSelectProps> = ({ label, name, value, onChange, options }) => (
    <div>
        {label && <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <select id={name} name={name} value={value} onChange={onChange} aria-label={label || name} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const FileInput: React.FC<FileInputProps> = ({ label, name, onChange, fileName }) => (
     <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-center justify-center w-full">
            <label htmlFor={name} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                    {fileName ? (<p className="text-xs text-green-400">{fileName}</p>) : (<p className="text-xs text-gray-500">PNG, JPG, or GIF</p>)}
                </div>
                <input id={name} name={name} type="file" className="hidden" onChange={onChange} />
            </label>
        </div>
    </div>
);

// --- ID Form Component ---
const IdForm: React.FC<IdFormProps> = ({ formData, onChange }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(formData.id, e);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(formData.id, e, true);

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3"> <FormSelect label="State" name="state" value={formData.state} onChange={handleInputChange} options={stateOptions} /> </div>
                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="Optional" />
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                <div className="md:col-span-3"> <FormInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} /> </div>
                <FormInput label="City" name="city" value={formData.city} onChange={handleInputChange} />
                <FormInput label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="5 digits" type="number" />
                <FormInput label="ZIP+4" name="zipPlus4" value={formData.zipPlus4} onChange={handleInputChange} placeholder="Optional 4 digits" type="number" />
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-2">
                        <FormSelect name="dobMonth" value={formData.dobMonth} onChange={handleInputChange} options={monthOptions} />
                        <FormSelect name="dobDay" value={formData.dobDay} onChange={handleInputChange} options={dayOptions} />
                        <FormSelect name="dobYear" value={formData.dobYear} onChange={handleInputChange} options={yearOptions} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Issue Date</label>
                    <div className="grid grid-cols-3 gap-2">
                        <FormSelect name="issueMonth" value={formData.issueMonth} onChange={handleInputChange} options={monthOptions} />
                        <FormSelect name="issueDay" value={formData.issueDay} onChange={handleInputChange} options={dayOptions} />
                        <FormSelect name="issueYear" value={formData.issueYear} onChange={handleInputChange} options={yearOptions} />
                    </div>
                </div>
                <FormSelect label="Sex" name="sex" value={formData.sex} onChange={handleInputChange} options={sexOptions} />
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                    <div className="grid grid-cols-2 gap-2">
                        <FormInput label="Feet" name="heightFeet" value={formData.heightFeet} onChange={handleInputChange} placeholder="ft" type="number" />
                        <FormInput label="Inches" name="heightInches" value={formData.heightInches} onChange={handleInputChange} placeholder="in" type="number" />
                    </div>
                </div>
                <FormInput label="Weight (lbs)" name="weight" value={formData.weight} onChange={handleInputChange} type="number" />
                <FormSelect label="Eye Color" name="eyeColor" value={formData.eyeColor} onChange={handleInputChange} options={eyeColorOptions} />
                <FormSelect label="Hair Color" name="hairColor" value={formData.hairColor} onChange={handleInputChange} options={hairColorOptions} />
                <div className="md:col-span-3 grid md:grid-cols-2 gap-4">
                     <FileInput label="Photo Upload" name="photo" onChange={handleFileChange} fileName={formData.photo?.name} />
                     <FileInput label="Signature Upload" name="signature" onChange={handleFileChange} fileName={formData.signature?.name} />
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function OrderFormPage() {
    const createNewIdForm = (): IdFormData => ({
        id: Date.now(),
        state: stateOptions[0],
        dobMonth: '01', dobDay: '01', dobYear: '2000',
        issueMonth: '01', issueDay: '01', issueYear: String(new Date().getFullYear()),
        firstName: '', middleName: '', lastName: '',
        streetAddress: '', city: '', zipCode: '', zipPlus4: '',
        heightFeet: '', heightInches: '', weight: '',
        eyeColor: eyeColorOptions[0], hairColor: hairColorOptions[0], sex: sexOptions[0],
    });

    const [idForms, setIdForms] = useState<IdFormData[]>([createNewIdForm()]);
    const [activeFormId, setActiveFormId] = useState<number>(idForms[0].id);
    const [isSidebarOpen, setSidebarOpen] = useState(false); // Sidebar is closed by default on mobile

    const addIdForm = () => {
        const newForm = createNewIdForm();
        setIdForms([...idForms, newForm]);
        setActiveFormId(newForm.id);
        if (window.innerWidth < 768) {
            setSidebarOpen(true);
        }
    };

    const removeIdForm = (idToRemove: number) => {
        if (idForms.length <= 1) return;
        const newForms = idForms.filter(form => form.id !== idToRemove);
        setIdForms(newForms);
        if (activeFormId === idToRemove) {
            setActiveFormId(newForms[0].id);
        }
    };

    const handleFormChange = (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isFile = false) => {
        setIdForms(prevForms =>
            prevForms.map(form => {
                if (form.id === id) {
                    if (isFile) {
                        const target = e.target as HTMLInputElement;
                        return { ...form, [target.name]: target.files ? target.files[0] : undefined };
                    }
                    return { ...form, [e.target.name]: e.target.value };
                }
                return form;
            })
        );
    };
    
    const activeForm = idForms.find(form => form.id === activeFormId);

    const handleProceedToCheckout = () => {
        if (idForms.length === 0) {
            alert('Please create at least one ID form before proceeding to checkout.');
            return;
        }
        const idFormsForStorage = idForms.map(({ photo, signature, ...rest }) => rest);

        try {
            localStorage.setItem('idPirateOrderForms', JSON.stringify(idFormsForStorage));
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Failed to save ID forms to localStorage:', error);
            alert('Could not proceed to checkout. Please try again.');
        }
    };

    return (
        <div className="text-gray-200">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
              .font-pirate-special { font-family: 'Uncial+Antiqua', cursive; }
              .sidebar-transition { transition: transform 0.3s ease-in-out; }
            `}</style>
            
            <div className="relative flex min-h-screen">
                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div 
                        onClick={() => setSidebarOpen(false)} 
                        className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    ></div>
                )}
                
                {/* Sidebar */}
                <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 border-r border-gray-700 sidebar-transition ${isSidebarOpen ? 'transform-none' :'-translate-x-full md:translate-x-0'}`}>
                    <div className="h-full px-3 py-4 overflow-y-auto">
                        <div className="h-16 flex items-center pl-2 md:hidden"> {/* Spacer for universal header */}
                             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white mr-4 p-2">
                                <MenuIcon />
                            </button>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-4 px-2">Your IDs</h3>
                        <ul className="space-y-2 font-medium">
                            {idForms.map((form, index) => (
                                <li key={form.id}>
                                    <button
                                        onClick={() => {
                                            setActiveFormId(form.id);
                                            if (window.innerWidth < 768) { setSidebarOpen(false); }
                                        }}
                                        className={`w-full flex items-center p-2 rounded-lg transition duration-75 group ${activeFormId === form.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">ID #{index + 1} ({form.state || 'New'})</span>
                                        {idForms.length > 1 && (
                                            <span onClick={(e) => { e.stopPropagation(); removeIdForm(form.id);}} className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-red-500 hover:text-white rounded-full">
                                                <TrashIcon />
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                             <li>
                                <button onClick={addIdForm} className="w-full flex items-center p-2 text-gray-300 rounded-lg hover:bg-gray-700 group">
                                    <PlusIcon />
                                    <span className="ms-3">Add Another ID</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <div className={`flex-1 p-4 sm:p-8 sidebar-transition md:ml-64`}>
                     {/* Mobile-only menu button */}
                     <div className="md:hidden flex items-center mb-4">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-2">
                           <MenuIcon />
                        </button>
                     </div>
                    <header className="text-center mb-12">
                        <h1 className="font-pirate-special text-5xl md:text-6xl font-bold text-white tracking-wider">
                            Create Your Order
                        </h1>
                        <p className="mt-2 text-lg text-gray-400">Editing ID #{idForms.findIndex(f => f.id === activeFormId) + 1}</p>
                    </header>

                    {activeForm && <IdForm formData={activeForm} onChange={handleFormChange} />}
                    
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleProceedToCheckout}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
                        >
                            Proceed to Checkout
                        </button>
                    </div>

                    <footer className="text-center py-8 mt-8 text-gray-500 text-sm">
                        © {new Date().getFullYear()} ID Pirate. All rights reserved.
                    </footer>
                </div>
            </div>
        </div>
    );
}

// --- END OF FILE app/order/new/page.tsx (Modified) ---