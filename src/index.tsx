import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  X,
  ClipboardCheck,
  Users,
  Settings,
  Lock,
  QrCode,
  Link as LinkIcon,
  Plus,
  Search,
  ChevronLeft,
  CheckCircle2,
  Camera,
  Trash2,
  Printer,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Hash,
  Menu,
  LayoutDashboard,
  Info,
  Instagram,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { QRCodeCanvas } from 'qrcode.react';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
import { FormType, BaseFormData, MinorPiercingFormData } from './types';

// --- Config ---
const CONFIG_URL = 'https://ujqjxdmnlwbwrxmjuuwo.supabase.co';
const CONFIG_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcWp4ZG1ubHdid3J4bWp1dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDU3MDMsImV4cCI6MjA3OTE4MTcwM30.0yDhBtDJsdeLIjDMq7_LopVS9mmXlqpQGxc_TTZhhGQ';
const STAFF_PASSCODE = 'PINK';

// --- Components ---

const SignaturePad = ({ label, onSave, onClear }: { label: string, onSave: (data: string) => void, onClear: () => void }) => {
  const sigCanvas = React.useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    onSave(sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '');
  };

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      <div className="signature-pad overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="#1e293b"
          canvasProps={{ className: 'w-full h-full' }}
          onEnd={save}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 italic">Sign in the box above</span>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          CLEAR PAD
        </button>
      </div>
    </div>
  );
};

const ImageCapture = ({ label, onCapture, imageSrc }: { label: string, onCapture: (data: string) => void, imageSrc?: string }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL('image/jpeg');
      onCapture(data);
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      {!imageSrc ? (
        <button
          type="button"
          onClick={startCamera}
          className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary transition-all bg-white"
        >
          <Camera size={32} />
          <span className="font-bold text-sm">SCAN PHOTO ID</span>
        </button>
      ) : (
        <div className="relative group">
          <img src={imageSrc} className="w-full h-48 object-cover rounded-xl border-2 border-slate-200" />
          <button
            type="button"
            onClick={() => onCapture('')}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
          >
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-2xl shadow-2xl" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-8 flex gap-4 w-full max-w-lg">
              <button onClick={capture} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl text-lg shadow-xl">CAPTURE</button>
              <button onClick={stopCamera} className="px-8 py-4 bg-white/20 text-white font-bold rounded-2xl text-lg backdrop-blur-md">CANCEL</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="form-label flex items-center gap-2">
      {Icon && <Icon size={14} className="text-primary" />}
      {label}
    </label>
    <input className="form-input" {...props} />
  </div>
);

// --- Components ---

const InfoItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
    <p className="text-slate-900 font-bold">{value || '—'}</p>
  </div>
);

// --- Main App ---

const App = () => {
  const [mode, setMode] = useState<'kiosk' | 'staff'>(() => {
    const savedMode = localStorage.getItem('pe_app_mode');
    return (savedMode as 'kiosk' | 'staff') || 'kiosk';
  });
  const [view, setView] = useState<'hub' | 'menu' | 'form' | 'success' | 'staff-queue' | 'staff-settings' | 'public-queue' | 'staff-history' | 'staff-artists' | 'staff-hub'>(() => {
    const savedView = localStorage.getItem('pe_app_view');
    return (savedView as any) || 'hub';
  });
  const [selectedFormType, setSelectedFormType] = useState<FormType>('tattoo');
  const [queueFilter, setQueueFilter] = useState<'tattoo' | 'piercing'>('tattoo');
  const [staffQueueFilter, setStaffQueueFilter] = useState<'all' | 'tattoo' | 'piercing'>('all');
  const [forms, setForms] = useState<any[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingForm, setViewingForm] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<{ name: string, phone: string } | null>(null);

  // Supabase Client
  const supabase = useMemo(() => {
    return createClient(CONFIG_URL, CONFIG_KEY);
  }, []);

  const fetchForms = async () => {
    const { data, error } = await supabase
      .from('consent_forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const seen = new Set();
      const mappedForms = data
        .map(d => ({ ...d.form_data, id: d.id, db_id: d.id, timestamp: d.created_at }))
        .filter(f => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
      setForms(mappedForms);
    }
  };

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('name', { ascending: true });

    if (data) {
      setArtists(data.map(a => a.name));
    }
  };

  const addArtist = async (name: string) => {
    if (!name || artists.includes(name)) return;
    const { error } = await supabase
      .from('artists')
      .insert([{ name }]);

    if (error) {
      console.error("Error adding artist:", error);
      alert("Failed to add artist. Please ensure the 'artists' table exists in Supabase. Error: " + error.message);
    } else {
      fetchArtists();
    }
  };

  const removeArtist = async (name: string) => {
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('name', name);

    if (error) {
      console.error("Error removing artist:", error);
      alert("Failed to remove artist: " + error.message);
    } else {
      fetchArtists();
    }
  };

  const handleArchive = async (updatedForm: any) => {
    const finalForm = {
      ...updatedForm,
      isArchived: true
    };
    const { error } = await supabase
      .from('consent_forms')
      .update({ form_data: finalForm })
      .eq('id', updatedForm.db_id || updatedForm.id);

    if (!error) {
      fetchForms();
    }
  };

  const handleDelete = async (form: any) => {
    if (!form) return;
    const idToDelete = form.db_id || form.id;
    if (!idToDelete) {
      alert("Could not find form ID to delete.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this form?")) return;
    const { error } = await supabase
      .from('consent_forms')
      .delete()
      .eq('id', idToDelete);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete form: " + error.message);
    } else {
      setViewingForm(null);
      fetchForms();
    }
  };

  useEffect(() => {
    localStorage.setItem('pe_app_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('pe_app_view', view);
  }, [view]);

  useEffect(() => {
    fetchForms();
    fetchArtists();

    const formsChannel = supabase
      .channel('forms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consent_forms' }, () => {
        fetchForms();
        // Force a page reload if the user is on the queue view, to make the UI update correctly
        // We do this by checking if the URL contains mode=kiosk or if the view state is queue
        const currentView = localStorage.getItem('pe_app_view');
        if (currentView === 'public-queue' || currentView === 'staff-queue') {
          window.location.reload();
        }
      })
      .subscribe();

    const artistsChannel = supabase
      .channel('artists-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artists' }, fetchArtists)
      .subscribe();

    return () => {
      supabase.removeChannel(formsChannel);
      supabase.removeChannel(artistsChannel);
    };
  }, []);

  const handleFormSubmit = async (formData: any) => {
    const now = new Date();
    const timestamp = now.getTime();
    const isMinor = selectedFormType === 'minor-piercing';

    // --- VALIDATION ---
    if (!formData.aftercareAcknowledged) {
      alert("You must acknowledge the aftercare instructions and legal release.");
      return;
    }

    if (isMinor) {
      if (!formData.adultSignature || !formData.minorSignature) {
        alert("Both Guardian and Minor signatures are required.");
        return;
      }
      if (!formData.parentGuardianName || !formData.phone) {
        alert("Guardian name and phone number are required.");
        return;
      }
    } else {
      if (!formData.signature) {
        alert("Your signature is required.");
        return;
      }
    }

    // 1. Prepare initial submission data (excluding base64 signatures and IDs)
    const { signature, adultSignature, minorSignature, idPhoto, guardianIdPhoto, minorIdPhoto, ...restData } = formData;

    const submission = {
      ...restData,
      type: selectedFormType,
      submissionDate: now.toLocaleDateString(),
      submissionTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
      isArchived: false
    };

    // 2. Insert initial row to get ID
    const { data: insertedData, error: insertError } = await supabase
      .from('consent_forms')
      .insert([{
        form_data: submission,
        form_type: selectedFormType,
        service_category: selectedFormType === 'minor-piercing' ? 'piercing' : selectedFormType,
        is_minor: isMinor,
        guardian_name: formData.parentGuardianName || null,
        guardian_phone: isMinor ? formData.phone : null,
        consent_agreed_input: formData.aftercareAcknowledged
      }])
      .select()
      .single();

    if (insertError || !insertedData) {
      console.error("Insert error:", insertError);
      alert("Submission failed. Please try again.");
      return;
    }

    const formId = insertedData.id;

    try {
      // 3. Helper to upload base64 to storage
      const uploadToStorage = async (base64: string, path: string) => {
        if (!base64 || !base64.startsWith('data:')) return null;

        try {
          // Convert base64 to blob manually for better compatibility
          const parts = base64.split(';base64,');
          const contentType = parts[0].split(':')[1];
          const raw = window.atob(parts[1]);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          const blob = new Blob([uInt8Array], { type: contentType });

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('signatures')
            .upload(path, blob, { contentType: contentType, upsert: true });

          if (uploadError) throw uploadError;
          return uploadData.path;
        } catch (e: any) {
          console.error("Error in uploadToStorage:", e);
          throw new Error(`Storage upload failed: ${e.message}`);
        }
      };

      // 4. Handle Signature and ID Uploads
      let signatureUrl = null;
      let guardianSignatureUrl = null;
      let minorSignatureUrl = null;
      let idPhotoUrl = null;
      let guardianIdPhotoUrl = null;
      let minorIdPhotoUrl = null;

      const getUrl = (path: string | null) => {
        if (!path) return null;
        return supabase.storage.from('signatures').getPublicUrl(path).data.publicUrl;
      };

      if (selectedFormType === 'minor-piercing') {
        const gSigPath = await uploadToStorage(adultSignature, `consent/${formId}/guardian_sig_${timestamp}.png`);
        const mSigPath = await uploadToStorage(minorSignature, `consent/${formId}/minor_sig_${timestamp}.png`);
        const gIdPath = await uploadToStorage(guardianIdPhoto, `consent/${formId}/guardian_id_${timestamp}.jpg`);
        const mIdPath = await uploadToStorage(minorIdPhoto, `consent/${formId}/minor_id_${timestamp}.jpg`);

        guardianSignatureUrl = getUrl(gSigPath);
        minorSignatureUrl = getUrl(mSigPath);
        guardianIdPhotoUrl = getUrl(gIdPath);
        minorIdPhotoUrl = getUrl(mIdPath);
      } else {
        const sigPath = await uploadToStorage(signature, `consent/${formId}/adult_sig_${timestamp}.png`);
        const idPath = await uploadToStorage(idPhoto, `consent/${formId}/adult_id_${timestamp}.jpg`);

        signatureUrl = getUrl(sigPath);
        idPhotoUrl = getUrl(idPath);
      }

      // 5. Update row with signature URLs and consent flags
      // Also update the form_data JSONB with the new URLs so they show up in the UI
      const updatedFormData = {
        ...submission,
        signature: signatureUrl,
        adultSignature: guardianSignatureUrl,
        minorSignature: minorSignatureUrl,
        idPhoto: idPhotoUrl,
        guardianIdPhoto: guardianIdPhotoUrl,
        minorIdPhoto: minorIdPhotoUrl
      };

      const { error: updateError } = await supabase
        .from('consent_forms')
        .update({
          form_data: updatedFormData,
          signature_url: signatureUrl,
          guardian_signature_url: guardianSignatureUrl,
          minor_signature_url: minorSignatureUrl,
          consent_agreed: formData.aftercareAcknowledged,
          consent_signed_at: formData.aftercareAcknowledged ? now.toISOString() : null,
          waiver_version: 'v1'
        })
        .eq('id', formId);

      if (updateError) throw updateError;

      setView('success');
    } catch (err: any) {
      console.error("Upload/Update error:", err);
      const errorMessage = err.message || "Unknown error";
      alert(`Failed to save signature: ${errorMessage}. Please ensure the 'signatures' bucket exists in Supabase and has public upload permissions.`);
      // Fail safely: delete the incomplete record
      await supabase.from('consent_forms').delete().eq('id', formId);
    }
  };

  const handleStaffLogin = () => {
    if (passcodeInput.toUpperCase() === STAFF_PASSCODE) {
      setMode('staff');
      setView('staff-hub');
      setIsPasscodeModalOpen(false);
      setPasscodeInput('');
    } else {
      alert("Incorrect Passcode");
    }
  };

  const filteredForms = forms.filter(f =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.minorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateWaitTime = (category: 'tattoo' | 'piercing') => {
    const waitingForms = forms.filter(f => !f.isArchived && (category === 'piercing' ? (f.type === 'piercing' || f.type === 'minor-piercing') : f.type === 'tattoo'));
    const count = waitingForms.length;
    if (category === 'piercing') {
      // 1hr for 5 people = 12 mins per person
      return count * 12;
    } else {
      // 2.5hrs for 5 people = 30 mins per person
      return count * 30;
    }
  };

  const getClientHistory = (name: string, phone: string) => {
    return forms.filter(f => (f.name === name || f.minorName === name) && f.phone === phone);
  };

  return (
    <>
      {/* Print View */}
      <PrintableDocument client={viewingForm} />

      <div className={cn("min-h-screen bg-slate-50 font-sans", viewingForm && "print:hidden")}>
        {/* Kiosk Mode */}
        {mode === 'kiosk' && (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="fixed top-4 left-4 z-50 p-3 bg-white rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-primary transition-all md:hidden"
            >
              <Menu size={24} />
            </button>

            {/* Sidebar Drawer */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    drag="x"
                    dragConstraints={{ left: -300, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -100) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[101] shadow-2xl flex flex-col p-6 md:hidden touch-none"
                  >
                    <div className="flex justify-between items-center mb-12">
                      <button
                        onClick={() => { setView('hub'); setIsSidebarOpen(false); }}
                        className="text-left"
                      >
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter">PINK ELEPHANT</h2>
                        <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-primary">Kiosk Menu</p>
                      </button>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                      </button>
                    </div>

                    <nav className="space-y-2 flex-1">
                      <button
                        onClick={() => { setView('hub'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'hub' ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <LayoutDashboard size={20} />
                        App Hub
                      </button>
                      <button
                        onClick={() => { setView('menu'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'menu' ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <Plus size={20} />
                        New Form
                      </button>
                      <button
                        onClick={() => { setView('public-queue'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'public-queue' ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <Users size={20} />
                        Waitlist
                      </button>
                    </nav>

                    <div className="pt-6 border-t border-slate-100">
                      <button
                        onClick={() => { setIsPasscodeModalOpen(true); setIsSidebarOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-primary transition-all"
                      >
                        <Lock size={20} />
                        Staff Access
                      </button>
                    </div>

                    {/* Drag Handle Visual */}
                    <div className="absolute top-1/2 -right-1 w-1 h-12 bg-slate-200 rounded-full -translate-y-1/2" />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Edge Trigger for Swipe */}
            {!isSidebarOpen && (
              <div
                className="fixed top-0 left-0 bottom-0 w-4 z-[40] md:hidden"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const startX = touch.clientX;
                  const handleTouchMove = (moveEvent: TouchEvent) => {
                    const moveX = moveEvent.touches[0].clientX;
                    if (moveX - startX > 50) {
                      setIsSidebarOpen(true);
                      document.removeEventListener('touchmove', handleTouchMove);
                    }
                  };
                  document.addEventListener('touchmove', handleTouchMove);
                  document.addEventListener('touchend', () => {
                    document.removeEventListener('touchmove', handleTouchMove);
                  }, { once: true });
                }}
              />
            )}

            <header className="text-center mb-8 sm:mb-12">
              <button
                onClick={() => setView('hub')}
                className="inline-block mb-4 hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-xl mx-auto">
                  <ClipboardCheck className="w-8 h-8 sm:w-12 sm:h-12" />
                </div>
              </button>
              <button onClick={() => setView('hub')} className="block w-full text-center">
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter mb-2">THE PINK ELEPHANT</h1>
                <p className="text-slate-500 font-bold tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs uppercase">Piercing & Tattoo Parlor</p>
              </button>
            </header>

            <AnimatePresence mode="wait">
              {view === 'hub' && (
                <motion.div
                  key="hub"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-6"
                >
                  {/* Main Action: New Form */}
                  <button
                    onClick={() => setView('menu')}
                    className="md:col-span-4 h-64 sm:h-80 bg-primary rounded-[2rem] p-8 text-white flex flex-col justify-between items-start text-left group relative overflow-hidden shadow-xl shadow-primary/20"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                      <ClipboardCheck size={200} />
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      <Plus size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Start New Intake</h2>
                      <p className="text-white/80 font-bold text-sm sm:text-base max-w-xs leading-tight">Digital consent forms for tattoos, piercings, and minors.</p>
                    </div>
                  </button>

                  {/* Live Waitlist */}
                  <button
                    onClick={() => setView('public-queue')}
                    className="md:col-span-2 h-64 sm:h-80 bg-white rounded-[2rem] p-8 flex flex-col justify-between items-start text-left border border-slate-200 hover:border-primary transition-all group shadow-sm"
                  >
                    <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                      <Users size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Live Waitlist</h2>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Real-time Tracking</p>
                    </div>
                  </button>

                  {/* Aftercare Guide */}
                  <div className="md:col-span-3 bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between items-start group overflow-hidden relative">
                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
                      <BookOpen size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white/10 p-2 rounded-xl">
                        <Sparkles size={20} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">New Feature</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-2 tracking-tight">Aftercare Guides</h2>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">Learn how to properly care for your new body art to ensure perfect healing.</p>
                      <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">
                        Read Guides <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Studio Info Bento */}
                  <div className="md:col-span-3 flex flex-col gap-4 sm:gap-6">
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <a href="https://www.instagram.com/thepinkelephantparlorhtx/?hl=en" target="_blank" rel="noopener noreferrer" className="bg-white rounded-[2rem] p-6 border border-slate-200 flex flex-col justify-center items-center text-center gap-2 hover:bg-slate-50 transition-colors">
                        <Instagram className="text-pink-500" size={24} />
                        <span className="text-xs font-black text-slate-900">@thepinkelephantparlorhtx</span>
                      </a>
                      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 flex flex-col justify-center items-center text-center gap-2">
                        <MapPin className="text-slate-600" size={24} />
                        <span className="text-xs font-black text-slate-900">6309 Lyons Ave</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <Clock className="text-primary" size={20} />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Hours</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Monday</span><span className="font-bold text-slate-900">11 AM – 10 PM</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Tuesday</span><span className="font-bold text-slate-400">Closed</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Wednesday</span><span className="font-bold text-slate-900">11 AM – 10 PM</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Thursday</span><span className="font-bold text-slate-900">11 AM – 10 PM</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Friday</span><span className="font-bold text-slate-900">11 AM – 12 AM</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Saturday</span><span className="font-bold text-slate-900">11 AM – 12 AM</span></div>
                        <div className="flex justify-between items-center py-1 sm:col-span-2 sm:border-none"><span className="text-slate-500 font-medium">Sunday</span><span className="font-bold text-slate-900">11 AM – 11 PM</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Access Footer */}
                  <div className="pt-4">
                    <button
                      onClick={() => setIsPasscodeModalOpen(true)}
                      className="w-full py-4 bg-slate-100 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                    >
                      <Lock size={14} /> Staff Access
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'menu' && (
                <motion.div
                  key="menu"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="grid gap-3 sm:gap-4"
                >
                  <button
                    onClick={() => setView('hub')}
                    className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors mb-2"
                  >
                    <ChevronLeft size={14} /> Back to Hub
                  </button>
                  <button
                    onClick={() => { setSelectedFormType('tattoo'); setView('form'); }}
                    className="p-5 sm:p-8 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl text-left hover:border-primary hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">TATTOO CONSENT</h3>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">Standard release for adult tattoo procedures</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setSelectedFormType('piercing'); setView('form'); }}
                    className="p-5 sm:p-8 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl text-left hover:border-primary hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">PIERCING CONSENT</h3>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">Standard release for adult piercing procedures</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setSelectedFormType('minor-piercing'); setView('form'); }}
                    className="p-5 sm:p-8 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl text-left hover:border-amber-500 hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 text-amber-600">PARENTAL PIERCING</h3>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">Consent for minors under 18 years of age</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setView('public-queue')}
                    className="p-5 sm:p-8 bg-slate-900 border-2 border-slate-900 rounded-2xl sm:rounded-3xl text-left hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-1">VIEW WAITLIST</h3>
                        <p className="text-sm sm:text-base text-slate-400 font-medium">Check your position in the queue</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsPasscodeModalOpen(true)}
                    className="mt-8 sm:mt-12 text-slate-400 font-black text-[10px] sm:text-xs hover:text-primary transition-colors uppercase tracking-[0.2em] sm:tracking-[0.3em] py-4"
                  >
                    Staff Dashboard Access
                  </button>
                </motion.div>
              )}

              {view === 'public-queue' && (
                <motion.div
                  key="public-queue"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <button onClick={() => setView('hub')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                          Live Waitlist
                        </h2>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Est. Wait: <span className="text-primary">{calculateWaitTime(queueFilter)} MINS</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto">
                      <button
                        onClick={() => setQueueFilter('tattoo')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest",
                          queueFilter === 'tattoo' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        TATTOO
                      </button>
                      <button
                        onClick={() => setQueueFilter('piercing')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest",
                          queueFilter === 'piercing' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        PIERCING
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-3 sm:space-y-4">
                      {forms
                        .filter(f => {
                          if (queueFilter === 'tattoo') return f.type === 'tattoo';
                          return f.type === 'piercing' || f.type === 'minor-piercing';
                        })
                        .filter(f => !f.isArchived)
                        .length === 0 ? (
                        <div className="text-center py-12 sm:py-20">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <Users size={32} />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Waitlist is currently empty</p>
                        </div>
                      ) : (
                        forms
                          .filter(f => {
                            if (queueFilter === 'tattoo') return f.type === 'tattoo';
                            return f.type === 'piercing' || f.type === 'minor-piercing';
                          })
                          .filter(f => !f.isArchived)
                          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                          .map((form, index) => {
                            const name = form.name || form.minorName || "Anonymous";
                            const maskedName = name.split(' ').map((n: string, i: number) => i === 0 ? n : n[0] + '.').join(' ');

                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={form.id}
                                className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm"
                              >
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-primary font-black border-2 border-slate-100 shadow-sm text-sm sm:text-base">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{maskedName}</h4>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                      {form.type.replace('-', ' ')} • {form.submissionTime}
                                    </p>
                                  </div>
                                </div>
                                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border border-slate-200 shadow-sm shrink-0">
                                  <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Waiting</span>
                                </div>
                              </motion.div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => setIsPasscodeModalOpen(true)}
                      className="w-full py-4 text-slate-400 font-black text-[10px] sm:text-xs hover:text-primary transition-colors uppercase tracking-[0.2em] sm:tracking-[0.3em]"
                    >
                      Staff Dashboard Access
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'form' && (
                <motion.div
                  key="form"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3 sm:gap-4">
                    <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                      {selectedFormType.replace('-', ' ')} Form
                    </h2>
                  </div>

                  <div className="p-4 sm:p-8">
                    <ConsentFormContent
                      type={selectedFormType}
                      onSubmit={handleFormSubmit}
                    />
                  </div>
                </motion.div>
              )}

              {view === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 mb-4">Submission Complete!</h2>
                  <p className="text-slate-500 text-lg mb-12">Please return the device to the studio staff.</p>
                  <button
                    onClick={() => setView('menu')}
                    className="btn-primary px-12 py-4 text-xl"
                  >
                    DONE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Staff Mode */}
        {mode === 'staff' && (
          <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            {/* Mobile Staff Header */}
            <header className="md:hidden bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Menu size={24} />
                </button>
                <button
                  onClick={() => setView('staff-hub')}
                  className="text-left"
                >
                  <h2 className="text-white font-black text-lg tracking-tighter leading-none">PINK ELEPHANT</h2>
                  <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-primary">Staff Dashboard</p>
                </button>
              </div>
              <div className="px-3 py-1 bg-slate-800 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-bold text-slate-300 uppercase">Online</span>
              </div>
            </header>

            {/* Sidebar Drawer (Mobile) */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    drag="x"
                    dragConstraints={{ left: -300, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -100) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 text-slate-400 z-[101] shadow-2xl flex flex-col p-6 md:hidden touch-none"
                  >
                    <div className="flex justify-between items-center mb-12">
                      <button
                        onClick={() => { setView('staff-hub'); setIsSidebarOpen(false); }}
                        className="text-left"
                      >
                        <h2 className="text-white font-black text-2xl tracking-tighter">PINK ELEPHANT</h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Staff Dashboard</p>
                      </button>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                        <X size={20} />
                      </button>
                    </div>

                    <nav className="space-y-2 flex-1">
                      <button
                        onClick={() => { setView('staff-hub'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'staff-hub' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <LayoutDashboard size={20} />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { setView('staff-queue'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'staff-queue' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <Users size={20} />
                        Live Queue
                      </button>
                      <button
                        onClick={() => { setView('staff-history'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'staff-history' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <FileText size={20} />
                        Form History
                      </button>
                      <button
                        onClick={() => { setView('staff-artists'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'staff-artists' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <User size={20} />
                        Studio Artists
                      </button>
                      <button
                        onClick={() => { setView('staff-settings'); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                          view === 'staff-settings' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <Settings size={20} />
                        System Settings
                      </button>
                    </nav>

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      <button
                        onClick={() => { setMode('kiosk'); setView('menu'); setIsSidebarOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all"
                      >
                        <Lock size={20} />
                        Lock Kiosk
                      </button>
                    </div>

                    {/* Drag Handle Visual */}
                    <div className="absolute top-1/2 -right-1 w-1 h-12 bg-slate-700 rounded-full -translate-y-1/2" />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Edge Trigger for Swipe */}
            {!isSidebarOpen && (
              <div
                className="fixed top-0 left-0 bottom-0 w-4 z-[40] md:hidden"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const startX = touch.clientX;
                  const handleTouchMove = (moveEvent: TouchEvent) => {
                    const moveX = moveEvent.touches[0].clientX;
                    if (moveX - startX > 50) {
                      setIsSidebarOpen(true);
                      document.removeEventListener('touchmove', handleTouchMove);
                    }
                  };
                  document.addEventListener('touchmove', handleTouchMove);
                  document.addEventListener('touchend', () => {
                    document.removeEventListener('touchmove', handleTouchMove);
                  }, { once: true });
                }}
              />
            )}

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-72 bg-slate-900 text-slate-400 flex-col p-6 shrink-0 border-r border-slate-800">
              <button
                onClick={() => setView('staff-hub')}
                className="mb-12 text-left"
              >
                <h2 className="text-white font-black text-2xl tracking-tighter">PINK ELEPHANT</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Staff Dashboard</p>
              </button>

              <nav className="space-y-2 flex-1">
                <button
                  onClick={() => setView('staff-hub')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    view === 'staff-hub' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => setView('staff-queue')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    view === 'staff-queue' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Users size={20} />
                  Live Queue
                </button>
                <button
                  onClick={() => setView('staff-history')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    view === 'staff-history' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <FileText size={20} />
                  Form History
                </button>
                <button
                  onClick={() => setView('staff-artists')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    view === 'staff-artists' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <User size={20} />
                  Studio Artists
                </button>
                <button
                  onClick={() => setView('staff-settings')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    view === 'staff-settings' ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Settings size={20} />
                  System Settings
                </button>
              </nav>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="px-4 py-3 bg-slate-800/50 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">STUDIO ONLINE</span>
                </div>
                <button
                  onClick={() => { setMode('kiosk'); setView('menu'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all"
                >
                  <Lock size={20} />
                  Lock Kiosk
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {view === 'staff-hub' && (
                <div className="max-w-4xl mx-auto">
                  <header className="mb-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl mb-6">
                      <ClipboardCheck size={40} />
                    </div>
                    <div className="mb-8 text-center">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">PINK ELEPHANT</h1>
                      <p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Staff Dashboard</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online</span>
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                    <button
                      onClick={() => setView('staff-queue')}
                      className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                      <Users size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-bold text-[10px] uppercase tracking-tight text-slate-900">Live Queue</span>
                    </button>

                    <button
                      onClick={() => setView('staff-history')}
                      className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                      <FileText size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-bold text-[10px] uppercase tracking-tight text-slate-900">Form History</span>
                    </button>

                    <button
                      onClick={() => setView('staff-artists')}
                      className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                      <User size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-bold text-[10px] uppercase tracking-tight text-slate-900">Studio Artists</span>
                    </button>

                    <button
                      onClick={() => setView('staff-settings')}
                      className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                      <Settings size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-bold text-[10px] uppercase tracking-tight text-slate-900">System Settings</span>
                    </button>

                    <button
                      onClick={() => { setMode('kiosk'); setView('hub'); }}
                      className="aspect-square bg-white border-2 border-black flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                      <Lock size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-bold text-[10px] uppercase tracking-tight text-slate-900">Lock Kiosk</span>
                    </button>
                  </div>
                </div>
              )}

              {view === 'staff-queue' && (
                <div className="max-w-6xl mx-auto">
                  <button
                    onClick={() => setView('staff-hub')}
                    className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors mb-4"
                  >
                    <ChevronLeft size={14} /> Back to Hub
                  </button>
                  <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Live Queue</h1>
                      <p className="text-sm sm:text-base text-slate-500 font-medium">Manage incoming client consent forms</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(['all', 'tattoo', 'piercing'] as const).map((f) => {
                          const count = forms.filter(form => {
                            if (form.isArchived) return false;
                            if (f === 'all') return true;
                            if (f === 'tattoo') return form.type === 'tattoo';
                            return form.type === 'piercing' || form.type === 'minor-piercing';
                          }).length;

                          return (
                            <button
                              key={f}
                              onClick={() => setStaffQueueFilter(f)}
                              className={cn(
                                "px-3 py-1 border border-black text-[10px] font-bold uppercase tracking-tight transition-all flex items-center gap-2 whitespace-nowrap",
                                staffQueueFilter === f ? "bg-black text-white" : "bg-white text-slate-900 hover:bg-slate-50"
                              )}
                            >
                              {f}{count}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsQRModalOpen(true)}
                          className="flex flex-col items-center justify-center w-12 h-12 border border-black bg-white hover:bg-slate-50 transition-all"
                        >
                          <QrCode size={16} />
                          <span className="text-[8px] font-bold uppercase">QR</span>
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/?mode=kiosk`;
                            navigator.clipboard.writeText(url);
                            alert("Kiosk URL copied to clipboard!");
                          }}
                          className="flex flex-col items-center justify-center w-12 h-12 border border-black bg-white hover:bg-slate-50 transition-all"
                        >
                          <LinkIcon size={16} />
                          <span className="text-[8px] font-bold uppercase">Link</span>
                        </button>
                      </div>
                    </div>
                  </header>

                  <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      placeholder="Search by client name..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-black text-sm outline-none focus:bg-slate-50 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms
                      .filter(f => {
                        if (f.isArchived) return false;
                        if (staffQueueFilter === 'all') return true;
                        if (staffQueueFilter === 'tattoo') return f.type === 'tattoo';
                        return f.type === 'piercing' || f.type === 'minor-piercing';
                      })
                      .map((form) => (
                        <motion.div
                          layout
                          key={form.id}
                          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => setViewingForm(form)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              form.type === 'tattoo' ? "bg-pink-100 text-pink-600" :
                                form.type === 'piercing' ? "bg-purple-100 text-purple-600" :
                                  "bg-amber-100 text-amber-600"
                            )}>
                              {form.type}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">{form.submissionTime}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(form); }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-1">{form.name || form.minorName}</h3>
                          <p className="text-sm text-slate-500 font-medium mb-6">{form.phone}</p>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewingForm(form); }}
                              className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                            >
                              VIEW FILE
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Archive this form?")) {
                                  handleArchive(form);
                                }
                              }}
                              className="flex-1 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-dark transition-colors"
                            >
                              DONE
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    {filteredForms.filter(f => !f.isArchived).length === 0 && (
                      <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Queue is empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'staff-history' && (
                <div className="max-w-6xl mx-auto">
                  <button
                    onClick={() => setView('staff-hub')}
                    className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors mb-4"
                  >
                    <ChevronLeft size={14} /> Back to Hub
                  </button>
                  <header className="mb-8 flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {selectedClient ? "Client History" : "Form History"}
                      </h1>
                      <p className="text-slate-500 font-medium">
                        {selectedClient ? `Showing all visits for ${selectedClient.name}` : "Archived and completed consent forms"}
                      </p>
                    </div>
                    {selectedClient && (
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                      >
                        <ChevronLeft size={18} />
                        BACK TO ALL
                      </button>
                    )}
                  </header>

                  {!selectedClient && (
                    <div className="mb-8 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        placeholder="Search history by name..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-black text-sm outline-none focus:bg-slate-50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="bg-white border border-black overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-900 border-r border-black">Client</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-900 border-r border-black">Type</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-900 border-r border-black">Date</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-900 border-r border-black">Artist</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-900 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {(selectedClient
                          ? getClientHistory(selectedClient.name, selectedClient.phone)
                          : filteredForms.filter(f => f.isArchived)
                        ).map((form) => (
                          <tr
                            key={form.id}
                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            onClick={() => {
                              if (!selectedClient) {
                                setSelectedClient({ name: form.name || form.minorName, phone: form.phone });
                              } else {
                                setViewingForm(form);
                              }
                            }}
                          >
                            <td className="px-4 py-3 border-r border-black">
                              <div className="font-bold text-slate-900 text-sm">{form.name || form.minorName}</div>
                              <div className="text-[10px] text-slate-400">{form.phone}</div>
                            </td>
                            <td className="px-4 py-3 border-r border-black">
                              <span className={cn(
                                "px-2 py-0.5 border border-black text-[9px] font-black uppercase tracking-tight",
                                form.type === 'tattoo' ? "bg-pink-100 text-pink-600" : "bg-purple-100 text-purple-600"
                              )}>
                                {form.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 border-r border-black">
                              {form.submissionDate}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-black">
                              {form.artistName || '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewingForm(form); }}
                                className="px-3 py-1 border border-black text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all"
                              >
                                VIEW
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(selectedClient ? getClientHistory(selectedClient.name, selectedClient.phone) : filteredForms.filter(f => f.isArchived)).length === 0 && (
                      <div className="text-center py-20">
                        <p className="text-slate-400 font-bold uppercase tracking-widest">No forms found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'staff-artists' && (
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={() => setView('staff-hub')}
                    className="md:hidden flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors mb-4"
                  >
                    <ChevronLeft size={14} /> Back to Hub
                  </button>
                  <header className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Studio Artists</h1>
                    <p className="text-slate-500 font-medium">Manage the list of active artists in the studio</p>
                  </header>

                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex gap-4 mb-8">
                      <input
                        id="new-artist-name"
                        placeholder="Enter artist name..."
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const name = (e.target as HTMLInputElement).value.trim();
                            if (name) {
                              addArtist(name);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('new-artist-name') as HTMLInputElement;
                          const name = input.value.trim();
                          if (name) {
                            addArtist(name);
                            input.value = '';
                          }
                        }}
                        className="btn-primary px-8"
                      >
                        ADD ARTIST
                      </button>
                    </div>

                    <div className="space-y-3">
                      {artists.map((artist) => (
                        <div key={artist} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary border border-slate-200 font-black">
                              {artist[0]}
                            </div>
                            <span className="font-bold text-slate-900">{artist}</span>
                          </div>
                          <button
                            onClick={() => removeArtist(artist)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      {artists.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No artists added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === 'staff-settings' && (
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={() => setView('staff-hub')}
                    className="md:hidden flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors mb-4"
                  >
                    <ChevronLeft size={14} /> Back to Hub
                  </button>
                  <header className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    <p className="text-slate-500 font-medium">Configure studio-wide application settings</p>
                  </header>
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Settings coming soon...</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Passcode Modal */}
        <AnimatePresence>
          {isPasscodeModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 text-center">STAFF ACCESS</h2>
                <p className="text-slate-500 text-center mb-6 sm:mb-8 font-medium text-sm sm:text-base">Enter the studio passcode to continue</p>

                <div className="space-y-4">
                  <input
                    type="password"
                    autoFocus
                    className="w-full text-center text-3xl sm:text-4xl tracking-[0.5em] font-black py-4 sm:py-6 border-2 border-slate-200 rounded-2xl focus:border-primary outline-none"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleStaffLogin} className="flex-1 btn-primary py-4">UNLOCK</button>
                    <button onClick={() => setIsPasscodeModalOpen(false)} className="px-6 btn-secondary py-4">CANCEL</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Viewer Modal */}
        <AnimatePresence>
          {viewingForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden"
              >
                <header className="p-4 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white",
                      viewingForm.type === 'tattoo' ? "bg-pink-500" :
                        viewingForm.type === 'piercing' ? "bg-purple-500" :
                          "bg-amber-500"
                    )}>
                      <FileText size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">{viewingForm.name || viewingForm.minorName}</h2>
                      <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5">
                        {viewingForm.type} • {viewingForm.submissionDate} @ {viewingForm.submissionTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button onClick={() => handleDelete(viewingForm)} className="btn-secondary px-3 sm:px-4 py-2 sm:py-3 text-red-500 hover:bg-red-50 hover:border-red-200 flex-1 sm:flex-none">
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm">Delete</span>
                    </button>
                    <button onClick={() => window.print()} className="btn-primary px-4 sm:px-6 py-2 sm:py-3 shadow-lg shadow-primary/20 flex-1 sm:flex-none">
                      <Printer size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm">PRINT</span>
                    </button>
                    <button onClick={() => setViewingForm(null)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors shrink-0">
                      <Plus className="rotate-45" size={20} />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 sm:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
                    <div className="lg:col-span-2 space-y-8 sm:space-y-12">
                      <section>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                          <User size={14} />
                          Client Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          <InfoItem label="Full Name" value={viewingForm.name || viewingForm.minorName} />
                          <InfoItem label="Phone" value={viewingForm.phone} />
                          <InfoItem label="Address" value={viewingForm.address} />
                          <InfoItem label="City/State/Zip" value={`${viewingForm.city}, ${viewingForm.state} ${viewingForm.zip}`} />
                          {viewingForm.type === 'minor-piercing' && (
                            <>
                              <InfoItem label="Guardian Name" value={viewingForm.parentGuardianName} />
                              <InfoItem label="Relation" value={viewingForm.relationToMinor} />
                            </>
                          )}
                        </div>
                      </section>

                      {viewingForm.type === 'minor-piercing' && (
                        <section>
                          <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Procedure Details</h3>
                          <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-slate-700 font-medium leading-relaxed text-sm sm:text-base">{viewingForm.procedureExplanation}</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
                              <span>Expected Healing Time: {viewingForm.healingTime}</span>
                            </div>
                          </div>
                        </section>
                      )}

                      <section>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Legal Signatures</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Client / Guardian</label>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <img src={viewingForm.signature || viewingForm.adultSignature} className="max-h-20 sm:max-h-24 mix-blend-multiply mx-auto" />
                            </div>
                          </div>
                          {viewingForm.minorSignature && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase">Minor</label>
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <img src={viewingForm.minorSignature} className="max-h-20 sm:max-h-24 mix-blend-multiply mx-auto" />
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                          <FileText size={14} />
                          Studio Artist Section
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
                          <InfoItem label="Artist Name" value={viewingForm.artistName} />
                          <InfoItem label="Price" value={viewingForm.price} />
                          <InfoItem label="Client Age" value={viewingForm.clientAge} />
                          <InfoItem label="Client DOB" value={viewingForm.clientDOB} />
                          <InfoItem label="Location" value={viewingForm.location} />
                          <InfoItem label="Jewelry/Color" value={viewingForm.jewelryUsed || viewingForm.colorsUsed} />
                          <InfoItem label="Catalogue #" value={viewingForm.catalogueNumber} />
                          <InfoItem label="ID Type Verified" value={viewingForm.idType} />
                        </div>

                      </section>
                    </div>

                    <div className="space-y-8">
                      <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Camera size={14} />
                          Photo Identification
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Primary ID</label>
                            <img src={viewingForm.idPhoto || viewingForm.guardianIdPhoto} className="w-full rounded-2xl border border-slate-200 shadow-sm" />
                          </div>
                          {viewingForm.minorIdPhoto && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase">Minor ID</label>
                              <img src={viewingForm.minorIdPhoto} className="w-full rounded-2xl border border-slate-200 shadow-sm" />
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {/* QR Modal */}
          {isQRModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
              onClick={() => setIsQRModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border-4 border-black p-8 flex flex-col items-center gap-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">KIOSK QR CODE</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Scan to open on your device</p>
                </div>

                <div className="p-4 bg-white border-2 border-black">
                  <QRCodeCanvas
                    value={`${window.location.origin}/?mode=kiosk`}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/?mode=kiosk`;
                      navigator.clipboard.writeText(url);
                      alert("Kiosk URL copied to clipboard!");
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-slate-200 transition-all"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => setIsQRModalOpen(false)}
                    className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const PrintableDocument = ({ client }: { client: any }) => {
  if (!client) return null;
  const isMinor = client.type === 'minor-piercing';

  return (
    <div id="print-area" className="hidden print:block absolute top-0 left-0 w-full bg-white z-[500] p-4 sm:p-8 text-black font-serif text-[11px] leading-snug min-h-[100vh]">
      <div className="max-w-4xl mx-auto border-2 border-black p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white p-2">
              <ClipboardCheck size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tighter leading-none">THE Pink Elephant</h1>
              <p className="text-[9px] font-bold tracking-[0.4em] uppercase border-t border-b border-black py-0.5 mt-1">Piercing & Tattoo Parlor</p>
            </div>
          </div>
          <h2 className="text-lg font-bold mt-2 uppercase underline mb-0">
            {client.type.replace('-', ' ')} consent and release form
          </h2>
        </div>

        {/* Legal Text */}
        <div className="text-[10px] mb-3 space-y-2 leading-tight">
          <p className="font-bold">PLEASE READ:</p>
          {client.type === 'tattoo' ? (
            <>
              <p>You are hereby notified of the possible risks and dangers associated with the application of each tattoo. These risks and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-8 space-y-1">
                <li>the possibility of discomfort or pain;</li>
                <li>the permanence of the markings;</li>
                <li>the risk of infection; and</li>
                <li>the possibility of allergic reaction to the pigments or other materials used.</li>
              </ol>
            </>
          ) : isMinor ? (
            <div className="space-y-4">
              <p>I acknowledge by signing this release form that I hereby release THE PINK ELEPHANT and it's employees and agents from all manner of liabilities, claims, actions, and demands, in law or in equity, which I or my heirs have or might have now or hereafter by reason of complying with my requests to pierce my child.</p>
              <p>I certify that I am the parent or legal guardian of the minor receiving the piercing. I agree that I will assume all responsibility for any medical, legal, or other situation resulting from my request to pierce my child. I understand that I must remain in the presence of this minor during piercing procedures.</p>
              <p>I understand that my child will be pierced using appropriate instruments and techniques.</p>
              <p>I understand that this type of piercing usually takes <span className="underline font-bold px-2">{client.healingTime || '________'}</span> or longer to heal.</p>
            </div>
          ) : (
            <>
              <p>You are hereby notified of the possible risks and dangers associated with receiving a body piercing. These risk and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-8 space-y-1">
                <li>The possibility of discomfort or pain;</li>
                <li>The possibility of scarring;</li>
                <li>The possibility of bleeding;</li>
                <li>The possibility of swelling;</li>
                <li>The risk of infection;</li>
                <li>The possibility of nerve damage; and</li>
                <li>The increased risk of adolescents during certain stages of development.</li>
              </ol>
            </>
          )}

          <p className="text-center font-bold border-t border-b border-black py-2 my-4">
            NO PERSON MAY BE {client.type === 'tattoo' ? 'TATTOOED' : 'PIERCED'} WHO APPEARS TO BE UNDER THE INFLUENCE OF ALCOHOL OR DRUGS
          </p>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          <div className="border-b border-black pb-0.5"><strong>Name:</strong> {client.name || client.minorName}</div>
          <div className="border-b border-black pb-0.5"><strong>Date:</strong> {client.submissionDate}</div>
          <div className="border-b border-black pb-0.5"><strong>Address:</strong> {client.address}</div>
          <div className="border-b border-black pb-0.5"><strong>Phone#:</strong> {client.phone}</div>
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div className="border-b border-black pb-0.5"><strong>City:</strong> {client.city}</div>
            <div className="border-b border-black pb-0.5"><strong>State:</strong> {client.state}</div>
            <div className="border-b border-black pb-0.5"><strong>Zip:</strong> {client.zip}</div>
          </div>
          {isMinor && (
            <>
              <div className="border-b border-black pb-0.5"><strong>Parent/Guardian:</strong> {client.parentGuardianName}</div>
              <div className="border-b border-black pb-0.5"><strong>Relation:</strong> {client.relationToMinor}</div>
            </>
          )}
        </div>

        {/* Acknowledgement */}
        <div className="font-bold mb-2 uppercase text-[9px] text-center">
          I have received a copy of applicable written care instructions and I have read and understand such written care instructions.
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div className="border-t border-black pt-1">
            <img src={client.signature || client.adultSignature} className="max-h-12 mix-blend-multiply mb-0.5 object-contain" />
            <p className="text-[9px] uppercase font-bold">Signature (Client/Guardian)</p>
          </div>
          {isMinor && (
            <div className="border-t border-black pt-1">
              <img src={client.minorSignature} className="max-h-12 mix-blend-multiply mb-0.5 object-contain" />
              <p className="text-[10px] uppercase font-bold">Minor Signature</p>
            </div>
          )}
        </div>

        {/* Artist Box */}
        <div className="border-2 border-black p-2 mb-2">
          <h3 className="text-xs font-black uppercase mb-1 text-center">To be completed by the studio artist:</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9px]">
            <div className="border-b border-slate-300"><strong>Artist Name:</strong> {client.artistName || '________________'}</div>
            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Tattoo' : 'Piercing'} price:</strong> {client.price || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Client\'s Age:</strong> {client.clientAge || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Client\'s DOB:</strong> {client.clientDOB || '________________'}</div>
            <div className="col-span-2 border-b border-slate-300"><strong>Type of valid identification provided:</strong> {client.idType || '________________'}</div>
            <div className="col-span-2 border-b border-slate-300"><strong>Location of {client.type}:</strong> {client.location || '________________'}</div>

            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Color(s)' : 'Jewelry'} used:</strong> {client.colorsUsed || client.jewelryUsed || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Catalogue #:</strong> {client.catalogueNumber || '________________'}</div>
            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Color(s)' : 'Jewelry'} used:</strong> ________________</div>
            <div className="border-b border-slate-300"><strong>Catalogue #:</strong> ________________</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[9px] leading-tight italic text-slate-600">
          {client.type === 'tattoo' ? (
            <p>An artist may not tattoo a person younger than 18 years of age without meeting the requirements of 25 Texas Administration Code, §229.406(d), whose parent or guardian determines it to be in the best interest of the minor child to cover an existing tattoo.</p>
          ) : (
            <p>This document was electronically signed and verified through The Pink Elephant Consent System. Digital Reference ID: {client.id}</p>
          )}
        </div>
      </div>

      {/* ID Photos on front page for print */}
      <div className="mt-2 border-t-2 border-black pt-2 print-id-section" style={{ breakInside: 'avoid' }}>
        <h3 className="text-xs font-bold mb-2 uppercase text-center">Identification Verification</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center" style={{ breakInside: 'avoid' }}>
            <p className="text-[8px] font-bold uppercase mb-1">Primary ID</p>
            <img src={client.idPhoto || client.guardianIdPhoto} className="mx-auto border-2 border-black shadow-md object-contain max-h-[150px] print:max-h-[140px]" style={{ pageBreakInside: 'avoid' }} />
          </div>
          {client.minorIdPhoto && (
            <div className="text-center" style={{ breakInside: 'avoid' }}>
              <p className="text-[8px] font-bold uppercase mb-1">Minor ID</p>
              <img src={client.minorIdPhoto} className="mx-auto border-2 border-black shadow-md object-contain max-h-[150px] print:max-h-[140px]" style={{ pageBreakInside: 'avoid' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConsentFormContent = ({ type, onSubmit }: { type: FormType, onSubmit: (data: any) => void }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    address: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    aftercareAcknowledged: false,
    signature: '',
    // Minor specific
    parentGuardianName: '',
    minorName: '',
    relationToMinor: '',
    minorIdPhoto: '',
    guardianIdPhoto: '',
    adultSignature: '',
    minorSignature: '',
    procedureExplanation: '',
    healingTime: '',
    idPhoto: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const isMinor = type === 'minor-piercing';

  const canSubmit = useMemo(() => {
    if (isMinor) {
      return (
        formData.parentGuardianName &&
        formData.minorName &&
        formData.guardianIdPhoto &&
        formData.adultSignature &&
        formData.minorSignature &&
        formData.aftercareAcknowledged
      );
    }
    return (
      formData.name &&
      formData.phone &&
      formData.idPhoto &&
      formData.signature &&
      formData.aftercareAcknowledged
    );
  }, [formData, isMinor]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Risk Disclosure Section */}
      <section className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
        <h3 className="text-[10px] sm:text-sm font-black text-slate-900 uppercase tracking-widest mb-3 sm:mb-4">
          {isMinor ? 'Parental Consent & Release' : 'Risk Disclosure & Release'}
        </h3>
        <div className="text-[10px] sm:text-xs text-slate-600 space-y-2 sm:space-y-3 leading-relaxed">
          {type === 'tattoo' ? (
            <>
              <p className="font-bold">PLEASE READ:</p>
              <p>You are hereby notified of the possible risks and dangers associated with the application of each tattoo. These risks and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>the possibility of discomfort or pain;</li>
                <li>the permanence of the markings;</li>
                <li>the risk of infection; and</li>
                <li>the possibility of allergic reaction to the pigments or other materials used.</li>
              </ol>
            </>
          ) : isMinor ? (
            <div className="space-y-4">
              <p>I acknowledge by signing this release form that I hereby release THE PINK ELEPHANT and it's employees and agents from all manner of liabilities, claims, actions, and demands, in law or in equity, which I or my heirs have or might have now or hereafter by reason of complying with my requests to pierce my child.</p>
              <p>I certify that I am the parent or legal guardian of the minor receiving the piercing. I agree that I will assume all responsibility for any medical, legal, or other situation resulting from my request to pierce my child. I understand that I must remain in the presence of this minor during piercing procedures.</p>
              <p>I understand that my child will be pierced using appropriate instruments and techniques.</p>
            </div>
          ) : (
            <>
              <p className="font-bold">PLEASE READ:</p>
              <p>You are hereby notified of the possible risks and dangers associated with receiving a body piercing. These risk and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>The possibility of discomfort or pain;</li>
                <li>The possibility of scarring;</li>
                <li>The possibility of bleeding;</li>
                <li>The possibility of swelling;</li>
                <li>The risk of infection;</li>
                <li>The possibility of nerve damage; and</li>
                <li>The increased risk of adolescents during certain stages of development.</li>
              </ol>
            </>
          )}
          <p className="font-black text-slate-900 border-t border-slate-200 pt-3 text-center">
            NO PERSON MAY BE {type === 'tattoo' ? 'TATTOOED' : 'PIERCED'} WHO APPEARS TO BE UNDER THE INFLUENCE OF ALCOHOL OR DRUGS.
          </p>
        </div>
      </section>

      {/* Personal Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {isMinor ? (
          <>
            <FormField label="Parent / Guardian Name" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} icon={User} />
            <FormField label="Minor Name" name="minorName" value={formData.minorName} onChange={handleChange} icon={User} />
            <FormField label="Relation to Minor" name="relationToMinor" value={formData.relationToMinor} onChange={handleChange} icon={Users} />
          </>
        ) : (
          <FormField label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={User} />
        )}
        <FormField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} icon={Phone} />
        <FormField label="Address" name="address" value={formData.address} onChange={handleChange} icon={MapPin} />
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="col-span-1"><FormField label="City" name="city" value={formData.city} onChange={handleChange} /></div>
          <div className="col-span-1"><FormField label="State" name="state" value={formData.state} onChange={handleChange} /></div>
          <div className="col-span-1"><FormField label="Zip" name="zip" value={formData.zip} onChange={handleChange} /></div>
        </div>
      </section>

      {isMinor && (
        <section className="space-y-6">
          <div className="space-y-1.5">
            <label className="form-label">Procedure Explanation</label>
            <textarea
              name="procedureExplanation"
              className="form-input min-h-[100px]"
              placeholder="Explain the manner in which the procedure will be performed and the specific part of the body..."
              value={formData.procedureExplanation}
              onChange={handleChange}
            />
          </div>
          <FormField label="Expected Healing Time" name="healingTime" placeholder="e.g. 4-6 weeks" value={formData.healingTime} onChange={handleChange} icon={Calendar} />
        </section>
      )}

      {/* IDs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {isMinor ? (
          <>
            <ImageCapture label="Guardian Photo ID" onCapture={(img) => setFormData({ ...formData, guardianIdPhoto: img })} imageSrc={formData.guardianIdPhoto} />
            <ImageCapture label="Minor Photo ID" onCapture={(img) => setFormData({ ...formData, minorIdPhoto: img })} imageSrc={formData.minorIdPhoto} />
          </>
        ) : (
          <ImageCapture label="Valid Photo ID" onCapture={(img) => setFormData({ ...formData, idPhoto: img })} imageSrc={formData.idPhoto} />
        )}
      </section>

      {/* Signatures */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {isMinor ? (
          <>
            <SignaturePad label="Guardian Signature" onSave={(sig) => setFormData({ ...formData, adultSignature: sig })} onClear={() => setFormData({ ...formData, adultSignature: '' })} />
            <SignaturePad label="Minor Signature" onSave={(sig) => setFormData({ ...formData, minorSignature: sig })} onClear={() => setFormData({ ...formData, minorSignature: '' })} />
          </>
        ) : (
          <SignaturePad label="Your Signature" onSave={(sig) => setFormData({ ...formData, signature: sig })} onClear={() => setFormData({ ...formData, signature: '' })} />
        )}
      </section>

      {/* Final Acknowledgment */}
      <section className="pt-8 border-t border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center h-6">
            <input
              type="checkbox"
              name="aftercareAcknowledged"
              className="w-6 h-6 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
              checked={formData.aftercareAcknowledged}
              onChange={handleChange}
            />
          </div>
          <div className="text-sm font-medium text-slate-600 leading-relaxed">
            I certify under penalty of perjury that the information herein is true and correct.
            I have received a copy of applicable written care instructions and I have read and understand such written care instructions.
          </div>
        </label>
      </section>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="btn-primary w-full py-6 text-xl shadow-xl shadow-primary/20"
      >
        {submitting ? 'SUBMITTING...' : 'SUBMIT CONSENT FORM'}
      </button>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
