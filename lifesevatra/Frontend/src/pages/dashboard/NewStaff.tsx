import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStaff } from '../../services/staffService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavbar } from '../../context/NavbarContext';

interface SelectOption { value: string; label: string; icon?: string; sub?: string; }
interface CustomSelectProps {
  id?: string; value: string; onChange: (val: string) => void;
  options?: SelectOption[]; placeholder?: string;
  openId: string | null; onToggle: (id: string | null) => void;
}
const CustomSelect: React.FC<CustomSelectProps> = ({ id, value, onChange, options = [], placeholder = 'Select...', openId, onToggle }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const selected = options?.find(o => o.value === value);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && isOpen) onToggle(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 bg-muted border-border hover:border-primary text-left transition-all cursor-pointer focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(19,236,19,0.2)]">
        <span className={`flex items-center gap-2 text-sm ${selected ? 'text-card-foreground' : 'text-muted-foreground'}`}>
          {selected?.icon && <span className="material-symbols-outlined text-primary text-base">{selected.icon}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <span className={`material-symbols-outlined text-muted-foreground text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden" style={{maxHeight:'220px',overflowY:'auto'}}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); onToggle(null); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-card-foreground'}`}>
              {opt.icon && <span className={`material-symbols-outlined text-lg ${value === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>{opt.icon}</span>}
              <div>
                <p className="text-sm font-medium leading-tight">{opt.label}</p>
                {opt.sub && <p className="text-[11px] text-muted-foreground">{opt.sub}</p>}
              </div>
              {value === opt.value && <span className="material-symbols-outlined text-primary text-base ml-auto">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker: React.FC<CustomSelectProps> = ({ id, value, onChange, placeholder = 'Select date...', openId, onToggle }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  
  // Reset view when opening if value exists
  useEffect(() => {
    if (isOpen && value) setViewDate(new Date(value));
  }, [isOpen, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && isOpen) onToggle(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 = Sun

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSelect = (d: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    onChange(formatDate(newDate));
    onToggle(null);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const totalDays = daysInMonth(year, month);
  const startDay = firstDay(year, month);
  const padding = Array(startDay).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 bg-muted border-border hover:border-primary text-left transition-all cursor-pointer focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(19,236,19,0.2)]">
        <span className={`flex items-center gap-2 text-sm ${value ? 'text-card-foreground' : 'text-muted-foreground'}`}>
          <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
          {value ? new Date(value).toLocaleDateString(undefined, {year:'numeric',month:'long',day:'numeric'}) : placeholder}
        </span>
        <span className={`material-symbols-outlined text-muted-foreground text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-[300px] rounded-xl border border-border bg-card shadow-2xl p-4 right-0 md:right-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-card-foreground transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-card-foreground">{monthName} {year}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-card-foreground transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {padding.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(d => {
              const current = formatDate(new Date(year, month, d));
              const isSelected = value === current;
              const isToday = current === formatDate(new Date());
              return (
                <button
                  key={d}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSelect(d); }}
                  className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-primary text-green-950 font-bold shadow-md shadow-primary/20' 
                      : isToday 
                        ? 'bg-transparent text-primary border border-primary/50 font-semibold' 
                        : 'text-card-foreground hover:bg-muted hover:text-primary'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const NewStaff: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isActiveStatus, setIsActiveStatus] = useState(true);
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

  const [privilegeLevel, setPrivilegeLevel] = useState('independent');

  const [clinicalPrivileges, setClinicalPrivileges] = useState<Record<string, boolean>>({
    // Surgical
    minor_surgery: true, major_surgery: false, laparoscopic: false, orthopedic_proc: false,
    // Diagnostic
    general_consultation: true, ecg_interpretation: false, ultrasound_diag: false, lab_ordering: true,
    // Emergency
    emergency_triage: true, emergency_prescribing: true, intubation: false, defibrillation: false,
    // Therapeutic
    iv_therapy: true, blood_transfusion: false, ventilator_mgmt: false, dialysis_mgmt: false,
  });

  const [accessRights, setAccessRights] = useState<Record<string, boolean>>({
    prescribing: false, icu_access: true, ot_access: false, er_access: true, pharmacy_access: false, lab_access: true,
  });

  const togglePrivilege = (key: string) =>
    setClinicalPrivileges(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAccessRight = (key: string) =>
    setAccessRights(prev => ({ ...prev, [key]: !prev[key] }));

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



  const handleWorkingDayToggle = (day: keyof typeof workingDays) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Inject title and actions into DashboardLayout top navbar
  const { setNavTitle, setNavActions } = useNavbar();
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  useEffect(() => {
    setNavTitle(
      <span className="text-lg font-bold tracking-tight">Add New Staff</span>
    );
    setNavActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center justify-center rounded-xl h-9 px-5 border border-border bg-muted/50 text-card-foreground/70 text-sm font-semibold hover:text-card-foreground hover:bg-muted hover:border-muted-foreground transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-1.5 justify-center rounded-xl h-9 px-5 border border-border bg-card text-card-foreground/80 text-sm font-semibold hover:text-card-foreground hover:bg-muted transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-base">drafts</span>
          Drafts
        </button>
        <button
          onClick={() => saveRef.current()}
          className="flex items-center gap-1.5 rounded-xl h-9 px-5 bg-rose-600 dark:bg-primary text-white dark:text-green-950 text-sm font-bold hover:bg-rose-700 dark:hover:bg-[#3bf03b] shadow-md shadow-rose-500/25 dark:shadow-primary/25 hover:shadow-lg hover:shadow-rose-500/30 dark:hover:shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-base">save</span>
          Save Profile
        </button>
      </div>
    );
    return () => { setNavTitle(null); setNavActions(null); };
  }, [navigate]);

  return (
    <DashboardLayout>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none invert z-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        
        <div className="relative z-10 p-3 space-y-4">
          {saveError && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 text-base">error</span>
              <p className="text-red-500 text-sm font-medium">{saveError}</p>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Profile Photo */}
            <div className="lg:col-span-1 h-full">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20 h-full flex flex-col">
                <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">photo_camera</span>
                  Profile Photo
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative group h-52 w-52 mb-6">
                    <div className="h-52 w-52 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-[#3b543b]">photo_camera</span>
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
                      className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-[#111811] flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Allowed *.jpeg, *.jpg, *.png<br/>Max size of 3 MB</p>
                </div>
              </div>
            </div>

            {/* Right Column - Personal Information */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                    Personal Information
                  </h3>
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all ${isActiveStatus ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted'}`}>
                    <span className={`material-symbols-outlined text-base transition-colors ${isActiveStatus ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isActiveStatus ? 'check_circle' : 'cancel'}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActiveStatus ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isActiveStatus ? 'Active' : 'Inactive'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActiveStatus}
                        onChange={(e) => setIsActiveStatus(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</label>
                    <input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="John" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</label>
                    <input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="Doe" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="john.doe@lifesevatra.com" 
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                      placeholder="+1 (555) 000-0000" 
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth</label>
                    <CustomDatePicker 
                      id="dateOfBirth" 
                      value={formData.dateOfBirth}
                      onChange={(val) => handleSelectChange('dateOfBirth', val)}
                      openId={openDropdown} 
                      onToggle={setOpenDropdown}
                      placeholder="Select Date of Birth"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</label>
                    <CustomSelect
                      id="gender" value={formData.gender}
                      onChange={(val) => handleSelectChange('gender', val)}
                      openId={openDropdown} onToggle={setOpenDropdown}
                      placeholder="Select Gender"
                      options={[
                        { value: 'male', label: 'Male', icon: 'man' },
                        { value: 'female', label: 'Female', icon: 'woman' },
                        { value: 'other', label: 'Other', icon: 'person' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Verification */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Identity &amp; Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gov ID Type</label>
                <CustomSelect
                  id="govIdType" value={formData.govIdType}
                  onChange={(val) => handleSelectChange('govIdType', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select ID Type"
                  options={[
                    { value: 'aadhaar', label: 'Aadhaar Card', icon: 'fingerprint', sub: 'UIDAI identity document' },
                    { value: 'pan', label: 'PAN Card', icon: 'credit_card', sub: 'Permanent account number' },
                    { value: 'passport', label: 'Passport', icon: 'travel_explore', sub: 'International travel document' },
                    { value: 'license', label: 'Driving License', icon: 'drive_eta', sub: 'Motor vehicle authority' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Gov ID</label>
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
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 dark:file:bg-primary file:text-white dark:file:text-green-950 hover:file:bg-amber-600 dark:hover:file:bg-[#3bf03b] file:cursor-pointer transition-all active:scale-[0.98]" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License #</label>
                <input 
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="LIC-12345" 
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issuing Authority</label>
                <input 
                  name="issuingAuthority"
                  value={formData.issuingAuthority}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="State Board" 
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validity Period (Expiry)</label>
                <CustomDatePicker 
                  id="validityPeriod" 
                  value={formData.validityPeriod}
                  onChange={(val) => handleSelectChange('validityPeriod', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Status</label>
                <CustomSelect
                  id="verificationStatus" value={formData.verificationStatus}
                  onChange={(val) => handleSelectChange('verificationStatus', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Status"
                  options={[
                    { value: 'active', label: 'Verified', icon: 'verified', sub: 'Identity confirmed' },
                    { value: 'pending', label: 'Pending', icon: 'hourglass_top', sub: 'Awaiting verification' },
                    { value: 'suspended', label: 'Suspended', icon: 'block', sub: 'Access restricted' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Professional Credentials */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span>
              Professional Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Degree / Qualification</label>
                <CustomSelect
                  id="degree-0" value={credentials[0].degree}
                  onChange={(val) => handleCredentialChange(0, 'degree', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Degree"
                  options={[
                    { value: 'mbbs', label: 'MBBS', icon: 'school' },
                    { value: 'md', label: 'MD (Doctor of Medicine)', icon: 'local_hospital' },
                    { value: 'ms', label: 'MS (Master of Surgery)', icon: 'surgical' },
                    { value: 'phd', label: 'PhD', icon: 'science' },
                    { value: 'bsc_nursing', label: 'B.Sc Nursing', icon: 'medication' },
                    { value: 'gnm', label: 'GNM (General Nursing)', icon: 'health_and_safety' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specialization</label>
                <CustomSelect
                  id="specialization-0" value={credentials[0].specialization}
                  onChange={(val) => handleCredentialChange(0, 'specialization', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Specialization"
                  options={[
                    { value: 'cardiology', label: 'Cardiology', icon: 'cardiology' },
                    { value: 'neurology', label: 'Neurology', icon: 'neurology' },
                    { value: 'orthopedics', label: 'Orthopedics', icon: 'orthopedics' },
                    { value: 'pediatrics', label: 'Pediatrics', icon: 'child_care' },
                    { value: 'emergency', label: 'Emergency Medicine', icon: 'emergency' },
                    { value: 'icu', label: 'Critical Care / ICU', icon: 'vital_signs' },
                    { value: 'general', label: 'General Surgery', icon: 'surgical' },
                  ]}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution / University</label>
                <input 
                  value={credentials[0].institution}
                  onChange={(e) => handleCredentialChange(0, 'institution', e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="University Name" 
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion Year</label>
                <input 
                  value={credentials[0].completionYear}
                  onChange={(e) => handleCredentialChange(0, 'completionYear', e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="YYYY" 
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Compliance & Legal */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">policy</span>
              Compliance &amp; Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indemnity Insurance Policy #</label>
                <input 
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="Policy Number" 
                  type="text"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Certifications</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${blsCertified ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted hover:border-primary/30'}`}>
                    <input type="checkbox" checked={blsCertified} onChange={(e) => setBlsCertified(e.target.checked)} className="sr-only" />
                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all shrink-0 ${blsCertified ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
                      {blsCertified && <span className="material-symbols-outlined text-green-950 text-sm font-bold">check</span>}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-card-foreground">Basic Life Support (BLS)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">CPR & emergency response</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${aclsCertified ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted hover:border-primary/30'}`}>
                    <input type="checkbox" checked={aclsCertified} onChange={(e) => setAclsCertified(e.target.checked)} className="sr-only" />
                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all shrink-0 ${aclsCertified ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
                      {aclsCertified && <span className="material-symbols-outlined text-green-950 text-sm font-bold">check</span>}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-card-foreground">Advanced Cardiac Life Support (ACLS)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Advanced cardiac care</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="md:col-span-2 pt-4 border-t border-border">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${ndaSigned ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted hover:border-primary/30'}`}>
                  <input type="checkbox" checked={ndaSigned} onChange={(e) => setNdaSigned(e.target.checked)} className="sr-only" />
                  <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all shrink-0 mt-0.5 ${ndaSigned ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
                    {ndaSigned && <span className="material-symbols-outlined text-green-950 text-sm font-bold">check</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Staff member has signed the <span className="text-primary font-medium">Non-Disclosure Agreement (NDA)</span> and <span className="text-primary font-medium">Code of Conduct</span> policies.
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Clinical Privileges */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">stethoscope</span>
                Clinical Privileges
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary font-bold">{Object.values(clinicalPrivileges).filter(Boolean).length}</span>/{Object.keys(clinicalPrivileges).length} granted
              </div>
            </div>

            {/* Privilege Level */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Privilege Level</label>
              <CustomSelect
                id="privilegeLevel" value={privilegeLevel}
                onChange={setPrivilegeLevel}
                openId={openDropdown} onToggle={setOpenDropdown}
                placeholder="Select Level"
                options={[
                  { value: 'independent', label: 'Full / Independent', icon: 'verified' },
                  { value: 'supervised', label: 'Supervised', icon: 'supervisor_account' },
                  { value: 'provisional', label: 'Provisional', icon: 'schedule' },
                  { value: 'temporary', label: 'Temporary', icon: 'timer' },
                ]}
              />
            </div>

            {/* Procedures — compact rows by category */}
            <div className="space-y-4">
              {[
                { cat: 'Surgical', icon: 'surgical', color: 'text-red-400', items: [
                  { key: 'minor_surgery', label: 'Minor Surgery' }, { key: 'major_surgery', label: 'Major Surgery' },
                  { key: 'laparoscopic', label: 'Laparoscopic' }, { key: 'orthopedic_proc', label: 'Orthopedic' },
                ]},
                { cat: 'Diagnostic', icon: 'biotech', color: 'text-blue-400', items: [
                  { key: 'general_consultation', label: 'General Consult' }, { key: 'ecg_interpretation', label: 'ECG Interpret.' },
                  { key: 'ultrasound_diag', label: 'Ultrasound' }, { key: 'lab_ordering', label: 'Lab Orders' },
                ]},
                { cat: 'Emergency', icon: 'emergency', color: 'text-amber-400', items: [
                  { key: 'emergency_triage', label: 'Triage' }, { key: 'emergency_prescribing', label: 'ER Prescribing' },
                  { key: 'intubation', label: 'Intubation' }, { key: 'defibrillation', label: 'Defibrillation' },
                ]},
                { cat: 'Therapeutic', icon: 'medication', color: 'text-purple-400', items: [
                  { key: 'iv_therapy', label: 'IV Therapy' }, { key: 'blood_transfusion', label: 'Transfusion' },
                  { key: 'ventilator_mgmt', label: 'Ventilator' }, { key: 'dialysis_mgmt', label: 'Dialysis' },
                ]},
              ].map(cat => (
                <div key={cat.cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-sm ${cat.color}`}>{cat.icon}</span>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{cat.cat}</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    {cat.items.map(p => (
                      <button key={p.key} type="button" onClick={() => togglePrivilege(p.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                          clinicalPrivileges[p.key]
                            ? 'bg-primary/8 text-card-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}>
                        <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                          clinicalPrivileges[p.key] ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {clinicalPrivileges[p.key] && <span className="material-symbols-outlined text-green-950 text-[9px] font-bold">check</span>}
                        </div>
                        <span className="text-xs">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Zone Access — single row */}
            <div className="mt-5 pt-5 border-t border-border">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Zone Access</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'prescribing', label: 'Prescribing', icon: 'prescriptions' },
                  { key: 'icu_access', label: 'ICU', icon: 'vital_signs' },
                  { key: 'ot_access', label: 'OT', icon: 'surgical' },
                  { key: 'er_access', label: 'ER', icon: 'emergency' },
                  { key: 'pharmacy_access', label: 'Pharmacy', icon: 'vaccines' },
                  { key: 'lab_access', label: 'Lab', icon: 'science' },
                ].map(a => (
                  <button key={a.key} type="button" onClick={() => toggleAccessRight(a.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      accessRights[a.key]
                        ? 'bg-primary/10 text-primary border border-primary/25'
                        : 'bg-muted text-muted-foreground border border-transparent hover:border-border'
                    }`}>
                    <span className="material-symbols-outlined text-sm">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Role</label>
                <CustomSelect
                  id="role" value={formData.role}
                  onChange={(val) => handleSelectChange('role', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Role"
                  options={[
                    { value: 'doctor', label: 'Doctor', icon: 'stethoscope', sub: 'Medical physician' },
                    { value: 'nurse', label: 'Nurse', icon: 'medication_liquid', sub: 'Nursing staff' },
                    { value: 'admin', label: 'Administrator', icon: 'manage_accounts', sub: 'Administrative staff' },
                    { value: 'technician', label: 'Lab Technician', icon: 'science', sub: 'Laboratory services' },
                    { value: 'pharmacist', label: 'Pharmacist', icon: 'vaccines', sub: 'Pharmacy services' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
                <CustomSelect
                  id="department" value={formData.department}
                  onChange={(val) => handleSelectChange('department', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Department"
                  options={[
                    { value: 'cardiology', label: 'Cardiology', icon: 'cardiology' },
                    { value: 'neurology', label: 'Neurology', icon: 'neurology' },
                    { value: 'pediatrics', label: 'Pediatrics', icon: 'child_care' },
                    { value: 'er', label: 'Emergency Room', icon: 'emergency' },
                    { value: 'surgery', label: 'Surgery', icon: 'surgical' },
                    { value: 'icu', label: 'Intensive Care Unit', icon: 'vital_signs' },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee ID</label>
              <input 
                name="employeeId"
                value={formData.employeeId}
                readOnly
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                type="text"
              />
              <p className="text-xs text-muted-foreground">Auto-generated system ID</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualifications / Specialization</label>
              <textarea 
                name="qualifications"
                value={formData.qualifications}
                onChange={handleInputChange}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all resize-none" 
                placeholder="e.g. MBBS, MD in Cardiology, 10 years experience..." 
                rows={3}
              />
            </div>
          </div>

          {/* Shift Timing & Availability */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Shift Timing &amp; Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift Type</label>
                <CustomSelect
                  id="shiftType" value={formData.shiftType}
                  onChange={(val) => handleSelectChange('shiftType', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Shift"
                  options={[
                    { value: 'morning', label: 'Morning Shift', icon: 'wb_sunny', sub: '08:00 AM – 04:00 PM' },
                    { value: 'evening', label: 'Evening Shift', icon: 'wb_twilight', sub: '04:00 PM – 12:00 AM' },
                    { value: 'night', label: 'Night Shift', icon: 'nights_stay', sub: '12:00 AM – 08:00 AM' },
                    { value: 'rotating', label: 'Rotating Shift', icon: 'autorenew', sub: 'Variable schedule' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joining Date</label>
                <CustomDatePicker
                  id="joiningDate" 
                  value={formData.joiningDate}
                  onChange={(val) => handleSelectChange('joiningDate', val)}
                  openId={openDropdown} 
                  onToggle={setOpenDropdown}
                  placeholder="Select Joining Date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => (
                  <label key={day} className="cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={workingDays[day]}
                      onChange={() => handleWorkingDayToggle(day)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-muted text-muted-foreground text-sm font-medium peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary transition-all hover:border-[#9db99d]">
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/20">
            <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">emergency</span>
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guardian Number</label>
                <input 
                  name="guardianNumber"
                  value={formData.guardianNumber}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="+1 (555) 000-0000" 
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guardian Relation</label>
                <CustomSelect
                  id="guardianRelation" value={formData.guardianRelation}
                  onChange={(val) => handleSelectChange('guardianRelation', val)}
                  openId={openDropdown} onToggle={setOpenDropdown}
                  placeholder="Select Relation"
                  options={[
                    { value: 'father', label: 'Father', icon: 'man' },
                    { value: 'mother', label: 'Mother', icon: 'woman' },
                    { value: 'spouse', label: 'Spouse', icon: 'favorite' },
                    { value: 'sibling', label: 'Sibling', icon: 'people' },
                    { value: 'child', label: 'Child', icon: 'child_care' },
                    { value: 'other', label: 'Other', icon: 'person' },
                  ]}
                />
              </div>
              {formData.guardianRelation === 'other' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specify Relation</label>
                  <input 
                    name="guardianRelationCustom"
                    value={formData.guardianRelationCustom}
                    onChange={handleInputChange}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                    placeholder="Enter custom relation" 
                    type="text"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Number</label>
                <input 
                  name="emergencyNumber"
                  value={formData.emergencyNumber}
                  onChange={handleInputChange}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-card-foreground placeholder-[#3b543b] focus:border-primary focus:ring-1 focus:ring-[#13ec13] outline-none transition-all" 
                  placeholder="+1 (555) 000-0000" 
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available for On-Call Duties?</label>
                <div className="flex items-center gap-4 bg-muted border border-border rounded-xl px-4 py-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="onCallDuty"
                      value="yes"
                      checked={onCallDuty === 'yes'}
                      onChange={(e) => setOnCallDuty(e.target.value)}
                      className="w-4 h-4 text-primary bg-transparent border-border focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="text-sm text-card-foreground">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      name="onCallDuty"
                      value="no"
                      checked={onCallDuty === 'no'}
                      onChange={(e) => setOnCallDuty(e.target.value)}
                      className="w-4 h-4 text-primary bg-transparent border-border focus:ring-[#13ec13] focus:ring-offset-0"
                    />
                    <span className="text-sm text-card-foreground">No</span>
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


