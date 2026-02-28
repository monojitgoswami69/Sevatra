import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStaff } from '../../services/staffService';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NewStaff: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isActiveStatus, setIsActiveStatus] = useState(true);
  const [prescribingRights, setPrescribingRights] = useState(false);
  const [icuOtAccess, setIcuOtAccess] = useState(true);
  const [onCallDuty, setOnCallDuty] = useState('yes');
  const [blsCertified, setBlsCertified] = useState(false);
  const [aclsCertified, setAclsCertified] = useState(false);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [workingDays, setWorkingDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false
  });

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Identity & Verification
    govIdType: '',
    govIdNumber: '',
    licenseNumber: '',
    issuingAuthority: '',
    validityPeriod: '',
    verificationStatus: 'active',
    // Professional Details
    role: '',
    department: '',
    employeeId: 'EMP-0000',
    qualifications: '',
    joiningDate: '',
    reportingAuthority: '',
    // Compliance & Legal
    insurancePolicyNumber: '',
    // Shift Timing
    shiftType: 'morning',
    // Emergency Contact
    guardianNumber: '',
    guardianRelation: '',
    guardianRelationCustom: '',
    emergencyNumber: ''
  });

  const [credentials, setCredentials] = useState([
    { degree: '', specialization: '', institution: '', completionYear: '' }
  ]);

  const [authorizedProcedures, setAuthorizedProcedures] = useState([
    'General Consultation',
    'Minor Surgery',
    'Emergency Prescribing',
    'ICU Admissions'
  ]);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfilePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      console.log('Profile photo selected:', file);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCredentialChange = (index: number, field: string, value: string) => {
    const updated = [...credentials];
    updated[index] = { ...updated[index], [field]: value };
    setCredentials(updated);
  };

  const addCredential = () => {
    setCredentials([...credentials, { degree: '', specialization: '', institution: '', completionYear: '' }]);
  };

  const removeProcedure = (index: number) => {
    setAuthorizedProcedures(prev => prev.filter((_, i) => i !== index));
  };

  const handleWorkingDayToggle = (day: keyof typeof workingDays) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      // Map the elaborate form fields to the API payload
      const roleMap: Record<string, string> = {
        'attending_physician': 'doctor',
        'resident_doctor': 'doctor',
        'surgeon': 'surgeon',
        'specialist': 'specialist',
        'nurse_practitioner': 'nurse',
        'registered_nurse': 'nurse',
        'charge_nurse': 'nurse',
      };
      const shiftMap: Record<string, string> = {
        'morning': 'day',
        'afternoon': 'day',
        'night': 'night',
        'rotating': 'rotating',
      };

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (!fullName || !formData.role || !formData.department) {
        setSaveError('Name, role, and department/specialty are required.');
        setIsSaving(false);
        return;
      }

      await createStaff({
        fullName,
        role: roleMap[formData.role] || 'doctor',
        specialty: formData.department || 'General Medicine',
        qualification: formData.qualifications || undefined,
        experienceYears: undefined,
        contact: formData.phone || undefined,
        email: formData.email || undefined,
        shift: shiftMap[formData.shiftType] || 'day',
        maxPatients: undefined,
      });

      navigate('/staff');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none invert z-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        
        <div className="relative z-10 p-8 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 bg-[#111811]/95 backdrop-blur-sm z-20 py-4 border-b border-white/5 -mx-8 px-8 mb-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Add New Staff</h1>
                <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-[#1c271c] rounded-full border border-[#3b543b]">
                  <span className="text-[10px] font-semibold text-[#9db99d] uppercase tracking-widest">Active Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isActiveStatus}
                      onChange={(e) => setIsActiveStatus(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-[#3b543b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#13ec13]"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/staff')}
                className="flex items-center gap-2 rounded-xl bg-transparent border border-[#3b543b] px-4 py-2.5 text-sm font-medium text-[#9db99d] hover:text-white hover:border-[#9db99d] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => navigate('/staff')}
                className="flex items-center gap-2 rounded-xl bg-[#1c271c] border border-[#3b543b] px-4 py-2.5 text-sm font-medium text-[#9db99d] hover:text-white hover:bg-[#152015] transition-colors"
              >
                Drafts
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#13ec13] px-6 py-2.5 text-sm font-bold text-[#111811] hover:bg-[#3bf03b] shadow-lg shadow-green-900/40 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
            {saveError && <p className="text-red-400 text-sm mt-2">{saveError}</p>}
          </header>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Profile Photo */}
            <div className="lg:col-span-1 h-full">
              <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20 h-full flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-6">Profile Photo</h3>
                <div className="flex flex-col items-center">
                  <div className="relative group h-40 w-40 mb-6">
                    <div className="h-40 w-40 rounded-full bg-[#152015] border-2 border-dashed border-[#3b543b] flex items-center justify-center overflow-hidden">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-[#3b543b]">add_a_photo</span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    <button 
                      onClick={handleProfilePhotoClick}
                      type="button"
                      className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-[#13ec13] text-[#111811] flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#9db99d] text-center">Allowed *.jpeg, *.jpg, *.png<br/>Max size of 3 MB</p>
                </div>
              </div>
            </div>

            {/* Right Column - Personal Information */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20 h-full">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec13]">person</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">First Name</label>
                    <input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="John" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Last Name</label>
                    <input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="Doe" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Email Address</label>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="john.doe@lifesevatra.com" 
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Phone Number</label>
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="+1 (555) 000-0000" 
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Date of Birth</label>
                    <input 
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all [color-scheme:dark]" 
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Verification */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">badge</span>
              Identity &amp; Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Gov ID Type</label>
                <select 
                  name="govIdType"
                  value={formData.govIdType}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all cursor-pointer"
                >
                  <option value="">Select ID Type</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="license">Driving License</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Upload Gov ID</label>
                <input 
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle file upload here
                      console.log('Gov ID selected:', file);
                      // You can also update formData with file name or URL
                      setFormData(prev => ({ ...prev, govIdNumber: file.name }));
                    }
                  }}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#13ec13] file:text-green-950 hover:file:bg-[#3bf03b] file:cursor-pointer" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">License #</label>
                <input 
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="LIC-12345" 
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Issuing Authority</label>
                <input 
                  name="issuingAuthority"
                  value={formData.issuingAuthority}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="State Board" 
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Validity Period (Expiry)</label>
                <input 
                  name="validityPeriod"
                  value={formData.validityPeriod}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all [color-scheme:dark]" 
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Verification Status</label>
                <select 
                  name="verificationStatus"
                  value={formData.verificationStatus}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all cursor-pointer"
                >
                  <option value="active">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Credentials */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">school</span>
              Professional Credentials
            </h3>
            <div className="space-y-4">
              {credentials.map((cred, index) => (
                <div key={index} className="bg-[#152015] rounded-xl p-4 border border-[#3b543b]/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Degree / Qualification</label>
                      <select 
                        value={cred.degree}
                        onChange={(e) => handleCredentialChange(index, 'degree', e.target.value)}
                        className="w-full bg-[#1c271c] border border-[#3b543b] rounded-lg px-3 py-2 text-sm text-white focus:border-[#13ec13] outline-none cursor-pointer"
                      >
                        <option value="">Select Degree</option>
                        <option value="mbbs">MBBS</option>
                        <option value="md">MD (Doctor of Medicine)</option>
                        <option value="ms">MS (Master of Surgery)</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Specialization</label>
                      <select 
                        value={cred.specialization}
                        onChange={(e) => handleCredentialChange(index, 'specialization', e.target.value)}
                        className="w-full bg-[#1c271c] border border-[#3b543b] rounded-lg px-3 py-2 text-sm text-white focus:border-[#13ec13] outline-none cursor-pointer"
                      >
                        <option value="">Select Specialization</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="neurology">Neurology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Institution / University</label>
                      <input 
                        value={cred.institution}
                        onChange={(e) => handleCredentialChange(index, 'institution', e.target.value)}
                        className="w-full bg-[#1c271c] border border-[#3b543b] rounded-lg px-3 py-2 text-sm text-white focus:border-[#13ec13] outline-none" 
                        placeholder="University Name" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Completion Year</label>
                      <input 
                        value={cred.completionYear}
                        onChange={(e) => handleCredentialChange(index, 'completionYear', e.target.value)}
                        className="w-full bg-[#1c271c] border border-[#3b543b] rounded-lg px-3 py-2 text-sm text-white focus:border-[#13ec13] outline-none" 
                        placeholder="YYYY" 
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addCredential}
                className="w-full py-3 border border-dashed border-[#3b543b] rounded-xl text-sm text-[#9db99d] hover:text-[#13ec13] hover:border-[#13ec13] hover:bg-[#13ec13]/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Add Another Degree
              </button>
            </div>
          </div>

          {/* Compliance & Legal */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">policy</span>
              Compliance &amp; Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Indemnity Insurance Policy #</label>
                <input 
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="Policy Number" 
                  type="text"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Required Certifications</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <label className="flex-1 flex items-center p-3 rounded-xl border border-[#3b543b]/50 bg-[#152015] hover:border-[#3b543b] transition-colors cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={blsCertified}
                      onChange={(e) => setBlsCertified(e.target.checked)}
                      className="w-4 h-4 rounded border-[#3b543b] bg-transparent text-[#13ec13] focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="ml-3 text-sm text-[#9db99d] group-hover:text-white">Basic Life Support (BLS)</span>
                  </label>
                  <label className="flex-1 flex items-center p-3 rounded-xl border border-[#3b543b]/50 bg-[#152015] hover:border-[#3b543b] transition-colors cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={aclsCertified}
                      onChange={(e) => setAclsCertified(e.target.checked)}
                      className="w-4 h-4 rounded border-[#3b543b] bg-transparent text-[#13ec13] focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="ml-3 text-sm text-[#9db99d] group-hover:text-white">Advanced Cardiac Life Support (ACLS)</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-2 pt-4 border-t border-[#3b543b]/50">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox"
                    checked={ndaSigned}
                    onChange={(e) => setNdaSigned(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[#3b543b] bg-transparent text-[#13ec13] focus:ring-[#13ec13] focus:ring-offset-0"
                    id="nda"
                  />
                  <label className="text-sm text-[#9db99d] cursor-pointer" htmlFor="nda">
                    Staff member has signed the <span className="text-[#13ec13] hover:underline">Non-Disclosure Agreement (NDA)</span> and <span className="text-[#13ec13] hover:underline">Code of Conduct</span> policies.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Privileges */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">stethoscope</span>
              Clinical Privileges
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider block">Authorized Procedures</label>
                <div className="flex flex-wrap gap-2">
                  {authorizedProcedures.map((proc, index) => (
                    <span key={index} className="inline-flex items-center gap-1 rounded-lg bg-[#152015] border border-[#3b543b] px-3 py-1.5 text-xs text-[#9db99d]">
                      {proc}
                      <button 
                        onClick={() => removeProcedure(index)}
                        className="hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))}
                  <button className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#3b543b] px-3 py-1.5 text-xs text-[#9db99d] hover:text-[#13ec13] hover:border-[#13ec13] transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span> Add Procedure
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-[#152015] rounded-xl border border-[#3b543b]/50">
                  <div>
                    <p className="text-sm font-medium text-white">Prescribing Rights</p>
                    <p className="text-xs text-[#9db99d] mt-1">Can prescribe narcotics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={prescribingRights}
                      onChange={(e) => setPrescribingRights(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#3b543b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#13ec13]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#152015] rounded-xl border border-[#3b543b]/50">
                  <div>
                    <p className="text-sm font-medium text-white">ICU/OT Access</p>
                    <p className="text-xs text-[#9db99d] mt-1">Critical care zones</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={icuOtAccess}
                      onChange={(e) => setIcuOtAccess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#3b543b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#13ec13]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">badge</span>
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Staff Role</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Role</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="admin">Administrator</option>
                  <option value="technician">Lab Technician</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Department</label>
                <select 
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Department</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="er">Emergency Room</option>
                  <option value="surgery">Surgery</option>
                  <option value="icu">Intensive Care Unit</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Employee ID</label>
              <input 
                name="employeeId"
                value={formData.employeeId}
                readOnly
                className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                type="text"
              />
              <p className="text-xs text-[#9db99d]">Auto-generated system ID</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Qualifications / Specialization</label>
              <textarea 
                name="qualifications"
                value={formData.qualifications}
                onChange={handleInputChange}
                className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all resize-none" 
                placeholder="e.g. MBBS, MD in Cardiology, 10 years experience..." 
                rows={3}
              />
            </div>
          </div>

          {/* Shift Timing & Availability */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">schedule</span>
              Shift Timing &amp; Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Shift Type</label>
                <select 
                  name="shiftType"
                  value={formData.shiftType}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="morning">Morning Shift (08:00 AM - 04:00 PM)</option>
                  <option value="evening">Evening Shift (04:00 PM - 12:00 AM)</option>
                  <option value="night">Night Shift (12:00 AM - 08:00 AM)</option>
                  <option value="rotating">Rotating Shift</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Joining Date</label>
                <input 
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all [color-scheme:dark]" 
                  type="date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider mb-2 block">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => (
                  <label key={day} className="cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={workingDays[day]}
                      onChange={() => handleWorkingDayToggle(day)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#3b543b] bg-[#152015] text-[#9db99d] text-sm font-medium peer-checked:bg-[#13ec13]/20 peer-checked:text-[#13ec13] peer-checked:border-[#13ec13] transition-all hover:border-[#9db99d]">
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">emergency</span>
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Guardian Number</label>
                <input 
                  name="guardianNumber"
                  value={formData.guardianNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="+1 (555) 000-0000" 
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Guardian Relation</label>
                <select 
                  name="guardianRelation"
                  value={formData.guardianRelation}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Relation</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.guardianRelation === 'other' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Specify Relation</label>
                  <input 
                    name="guardianRelationCustom"
                    value={formData.guardianRelationCustom}
                    onChange={handleInputChange}
                    className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                    placeholder="Enter custom relation" 
                    type="text"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Emergency Number</label>
                <input 
                  name="emergencyNumber"
                  value={formData.emergencyNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3 text-white placeholder-[#3b543b] focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="+1 (555) 000-0000" 
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9db99d] uppercase tracking-wider">Available for On-Call Duties?</label>
                <div className="flex items-center gap-4 bg-[#152015] border border-[#3b543b] rounded-xl px-4 py-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="onCallDuty"
                      value="yes"
                      checked={onCallDuty === 'yes'}
                      onChange={(e) => setOnCallDuty(e.target.value)}
                      className="w-4 h-4 text-[#13ec13] bg-transparent border-[#3b543b] focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="text-sm text-white">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="onCallDuty"
                      value="no"
                      checked={onCallDuty === 'no'}
                      onChange={(e) => setOnCallDuty(e.target.value)}
                      className="w-4 h-4 text-[#13ec13] bg-transparent border-[#3b543b] focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="text-sm text-white">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
};

export default NewStaff;

