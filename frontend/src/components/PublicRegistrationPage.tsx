import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Globe, 
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

interface Props {
  token: string;
}

export const PublicRegistrationPage: React.FC<Props> = ({ token }) => {
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);

  // Student lookup state
  const [regNoInput, setRegNoInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<any>(null);

  // Form editable inputs (prefilled from student)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeLink, setResumeLink] = useState('');
  const [linkedinId, setLinkedinId] = useState('');
  const [githubId, setGithubId] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    company_name: string;
    student_name: string;
    reg_no: string;
    registered_at?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setCompanyError('Registration token is missing in URL.');
      setLoadingCompany(false);
      return;
    }

    setLoadingCompany(true);
    setCompanyError(null);

    api.getPublicRegistrationInfo(token)
      .then(res => {
        if (res.valid && res.company) {
          setCompany(res.company);
        } else {
          setCompanyError('Invalid or inactive registration link.');
        }
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.response?.data?.details || 'Registration is unavailable or this link is invalid.';
        setCompanyError(msg);
      })
      .finally(() => setLoadingCompany(false));
  }, [token]);

  const handleLookupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = regNoInput.trim();
    if (!query) {
      setLookupError('Please enter your Registration Number.');
      return;
    }

    setLookingUp(true);
    setLookupError(null);
    setSubmitError(null);
    setVerifiedStudent(null);

    try {
      const res = await api.lookupStudentForRegistration(token, query);
      if (res.found && res.student) {
        setVerifiedStudent(res.student);
        setEmail(res.student.email || '');
        setPhone(res.student.phone || '');
        setResumeLink(res.student.resume_link || '');
        setLinkedinId(res.student.linkedin_id || '');
        setGithubId(res.student.github_id || '');
        setPortfolioLink(res.student.portfolio_link || '');
      } else {
        setLookupError('Student record not found. Please contact the Placement Team.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Student record not found. Please contact the Placement Team.';
      setLookupError(errMsg);
    } finally {
      setLookingUp(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedStudent) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.submitCompanyRegistration(token, {
        reg_no: verifiedStudent.reg_no,
        email: email.trim(),
        phone: phone.trim(),
        resume_link: resumeLink.trim()
      });

      setRegistrationSuccess({
        company_name: res.company_name,
        student_name: res.student_name,
        reg_no: res.reg_no
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.details || 'Failed to submit registration. Please try again.';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E2E8F0] max-w-md w-full text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-3 border-[#3B82F6] border-t-transparent rounded-full mx-auto"></div>
          <h3 className="font-bold text-[#1E293B] text-base">Loading Registration Form</h3>
          <p className="text-xs text-[#64748B]">Verifying company drive credentials...</p>
        </div>
      </div>
    );
  }

  if (companyError || !company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E2E8F0] max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="font-bold text-[#1E293B] text-lg">Registration Unavailable</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {companyError || 'This registration link is invalid, expired, or has not been approved yet.'}
          </p>
          <div className="pt-2 text-[11px] text-[#94A3B8]">
            Please contact your college Placement Cell for assistance.
          </div>
        </div>
      </div>
    );
  }

  // Registration Success State
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-[#E2E8F0] max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-extrabold text-xl text-[#1E293B]">Registration Successful!</h2>
            <p className="text-xs text-[#64748B]">
              Your application for <strong>{registrationSuccess.company_name}</strong> has been recorded.
            </p>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-[#64748B]">Company:</span>
              <span className="font-bold text-[#1E293B]">{registrationSuccess.company_name}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-[#64748B]">Student Name:</span>
              <span className="font-bold text-[#1E293B]">{registrationSuccess.student_name}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-[#64748B]">Registration Number:</span>
              <span className="font-mono font-bold text-[#3B82F6]">{registrationSuccess.reg_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Registration Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                REGISTERED
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium text-left flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
            <span>
              Your registration is confirmed. Please keep checking your college portal and registered email for drive schedules and round announcements.
            </span>
          </div>

          <button
            onClick={() => {
              setRegistrationSuccess(null);
              setVerifiedStudent(null);
              setRegNoInput('');
            }}
            className="text-xs font-bold text-[#3B82F6] hover:underline"
          >
            Register another student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#3B82F6] rounded-full text-xs font-bold border border-blue-200 mb-1">
            <GraduationCap className="h-4 w-4" />
            <span>Placement &amp; Corporate Relations Cell</span>
          </div>
          <h1 className="text-2xl font-black text-[#1E293B]">Student Campus Drive Registration</h1>
          <p className="text-xs text-[#64748B]">Official placement portal registration for eligible graduating students</p>
        </div>

        {/* Company Overview Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white flex items-center justify-center shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1E293B]">{company.name}</h2>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                  <span className="font-medium">{company.job_title || 'Software Development'}</span>
                  {company.location && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {company.ctc_lpa && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center sm:text-right">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Package Offered</span>
                <span className="text-base font-black text-[#3B82F6]">{company.ctc_lpa} LPA</span>
              </div>
            )}
          </div>

          {/* JD Summary if available */}
          {company.jd_summary && (
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#1E293B] block">Job Description &amp; Requirements:</span>
              <p className="line-clamp-3 leading-relaxed">{company.jd_summary}</p>
            </div>
          )}
        </div>

        {/* STEP 1: Student Roll No Lookup */}
        {!verifiedStudent ? (
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Step 1: Enter Your College Registration Number</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                We will verify your student eligibility against the official placement database.
              </p>
            </div>

            <form onSubmit={handleLookupStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Registration Number / Roll No <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24CSE001, 24IT012..."
                    value={regNoInput}
                    onChange={(e) => setRegNoInput(e.target.value)}
                    className="w-full pl-3 pr-24 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-mono font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  />
                  <button
                    type="submit"
                    disabled={lookingUp || !regNoInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>{lookingUp ? 'Checking...' : 'Verify'}</span>
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{lookupError}</span>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* STEP 2: Verified Profile & Registration Confirmation Form */
          <form onSubmit={handleRegisterSubmit} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-sm">Step 2: Verify Your Details &amp; Confirm</h3>
                  <p className="text-[11px] text-[#64748B]">Pre-filled from your official student record</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVerifiedStudent(null);
                  setRegNoInput('');
                }}
                className="text-xs font-semibold text-[#64748B] hover:text-[#1E293B] underline"
              >
                Change Reg No
              </button>
            </div>

            {/* Read-only Verified Student Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[#64748B] text-[11px] block">Reg No</span>
                <span className="font-mono font-bold text-[#3B82F6]">{verifiedStudent.reg_no}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">Student Name</span>
                <span className="font-bold text-[#1E293B]">{verifiedStudent.name}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">Department</span>
                <span className="font-semibold text-[#1E293B]">{verifiedStudent.department}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">Gender / Residence</span>
                <span className="font-medium text-[#1E293B]">{verifiedStudent.gender} &bull; {verifiedStudent.student_type}</span>
              </div>
            </div>

            {/* Editable Confirmation Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#1E293B]">Email ID</label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#1E293B]">Contact Mobile Number</label>
                  <div className="relative">
                    <Phone className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#1E293B]">Resume Link (Google Drive / Cloud PDF)</label>
                <div className="relative">
                  <FileText className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748B]" />
                  <input
                    type="url"
                    value={resumeLink}
                    onChange={(e) => setResumeLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#64748B] text-[11px]">LinkedIn</label>
                  <input
                    type="text"
                    value={linkedinId}
                    onChange={(e) => setLinkedinId(e.target.value)}
                    placeholder="linkedin.com/in/..."
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-[#64748B] text-[11px]">GitHub</label>
                  <input
                    type="text"
                    value={githubId}
                    onChange={(e) => setGithubId(e.target.value)}
                    placeholder="github.com/..."
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-[#64748B] text-[11px]">Portfolio</label>
                  <input
                    type="text"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="portfolio..."
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                By submitting, you agree to attend all screening rounds for <strong>{company.name}</strong>.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <span>{submitting ? 'Submitting Registration...' : 'Confirm & Register'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
