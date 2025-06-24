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
  photo?: File;
  signature?: File;
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
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const UploadIcon = () => (
    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
);


// --- Reusable Form Components ---
const FormInput = ({ label, name, value, onChange, placeholder = '' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input type="text" id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
    </div>
);

const FormSelect = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const FileInput = ({ label, name, onChange, fileName }) => (
     <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-center justify-center w-full">
            <label htmlFor={name} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                    {fileName ? (
                         <p className="text-xs text-green-400">{fileName}</p>
                    ) : (
                         <p className="text-xs text-gray-500">PNG, JPG, or GIF</p>
                    )}
                </div>
                <input id={name} name={name} type="file" className="hidden" onChange={onChange} />
            </label>
        </div> 
    </div>
);


// --- ID Form Component ---
const IdForm = ({ formData, onChange, onRemove }) => {
    const handleInputChange = (e) => onChange(formData.id, e);
    const handleFileChange = (e) => onChange(formData.id, e, true);

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative">
            <button onClick={() => onRemove(formData.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors">
                <TrashIcon />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                    <FormSelect label="State" name="state" value={formData.state} onChange={handleInputChange} options={stateOptions} />
                </div>

                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="Optional" />
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />

                <div className="md:col-span-3">
                    <FormInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} />
                </div>
                
                <FormInput label="City" name="city" value={formData.city} onChange={handleInputChange} />
                <FormInput label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="5 digits" />
                <FormInput label="ZIP+4" name="zipPlus4" value={formData.zipPlus4} onChange={handleInputChange} placeholder="Optional 4 digits" />

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
                        <FormInput name="heightFeet" value={formData.heightFeet} onChange={handleInputChange} placeholder="ft" />
                        <FormInput name="heightInches" value={formData.heightInches} onChange={handleInputChange} placeholder="in" />
                    </div>
                </div>

                <FormInput label="Weight (lbs)" name="weight" value={formData.weight} onChange={handleInputChange} />
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

    const addIdForm = () => {
        setIdForms([...idForms, createNewIdForm()]);
    };

    const removeIdForm = (idToRemove: number) => {
        if (idForms.length > 1) {
            setIdForms(idForms.filter(form => form.id !== idToRemove));
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

    return (
        <div className="bg-gray-900 min-h-screen text-gray-200">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
              .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
            `}</style>
            
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="font-pirate-special text-6xl md:text-7xl font-bold text-white tracking-wider">
                        Create Your Order
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Fill out the details for each ID below.</p>
                </header>

                <div className="space-y-8">
                    {idForms.map((form) => (
                        <IdForm key={form.id} formData={form} onChange={handleFormChange} onRemove={removeIdForm} />
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button onClick={addIdForm} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <PlusIcon/>
                        Add Another ID
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
             <footer className="text-center py-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
            </footer>
        </div>
    );
}
