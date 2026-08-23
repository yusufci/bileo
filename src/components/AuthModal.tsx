import React, { useState, useEffect } from 'react';
import {
  BileoClose,
  BileoMail,
  BileoLock,
  BileoPhone,
  BileoEye,
  BileoEyeOff,
  BileoCheck,
  BileoAlertCircle,
  BileoArrowRight,
  BileoShieldCheck,
  BileoSparkles,
  BileoGoogleIcon,
} from './icons';
import { User, AuthMode } from '../types';
import { SeferLogo } from './SeferLogo';
import { authenticateWithGoogle } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: AuthMode;
  promptReason?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  promptReason,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const user = await authenticateWithGoogle();
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google ile oturum açılamadı.');
    }
  };

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoUser: User = {
        id: 'usr_demo_101',
        name: 'Ahmet',
        surname: 'Yılmaz',
        email: 'ahmet.yilmaz@sefer.com',
        phone: '0532 123 45 67',
        tcNo: '10000000146',
        gender: 'male',
        avatarInitials: 'AY',
        createdAt: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(demoUser);
      onClose();
    }, 400);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(loginEmail)) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (!loginPassword || loginPassword.length < 4) {
      setErrorMessage('Şifreniz en az 4 karakterden oluşmalıdır.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = loginEmail.trim().toLowerCase();
      const parts = cleanEmail.split('@')[0].split('.');
      const derivedName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Değerli';
      const derivedSurname = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Yolcumuz';

      const user: User = {
        id: `usr_${Date.now()}`,
        name: cleanEmail.includes('ahmet') ? 'Ahmet' : derivedName,
        surname: cleanEmail.includes('yilmaz') ? 'Yılmaz' : derivedSurname,
        email: cleanEmail,
        phone: '0532 987 65 43',
        avatarInitials: `${derivedName[0] || 'S'}${derivedSurname[0] || 'Y'}`,
        createdAt: new Date().toISOString(),
      };

      onLoginSuccess(user);
      onClose();
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim() || !regSurname.trim()) {
      setErrorMessage('Lütfen adınızı ve soyadınızı eksiksiz giriniz.');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Lütfen geçerli bir 10 haneli cep telefonu numarası giriniz.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Lütfen Kullanım Koşulları ve KVKK metnini onaylayınız.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: regName.trim(),
        surname: regSurname.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        avatarInitials: `${regName.trim()[0].toUpperCase()}${regSurname.trim()[0].toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };

      onLoginSuccess(newUser);
      onClose();
    }, 700);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!isValidEmail(forgotEmail)) {
      setErrorMessage('Lütfen şifre sıfırlama için geçerli bir e-posta giriniz.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-soft-lg overflow-hidden my-6 select-none animate-fadeIn">
        
        {/* Top Header with Sefer Branding & Close */}
        <div className="p-6 sm:p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SeferLogo size="md" variant="bordeaux" showTagline={false} />
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-cream-100 text-charcoal flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Reason Banner if Triggered by Gatekeeper */}
        {promptReason && (
          <div className="mx-6 sm:mx-8 mb-4 p-3.5 rounded-2xl bg-bordeaux-50 text-xs text-bordeaux-800 font-semibold flex items-center gap-2.5">
            <BileoShieldCheck className="w-4 h-4 text-bordeaux-700 flex-shrink-0" />
            <span>{promptReason}</span>
          </div>
        )}

        {/* Tab Switcher: Giriş Yap / Kayıt Ol */}
        {mode !== 'forgot_password' && (
          <div className="px-6 sm:px-8">
            <div className="flex items-center bg-[#FAF7F2] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-bordeaux-700 shadow-soft'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-bordeaux-700 shadow-soft'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Yeni Hesap Oluştur
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8 pt-5 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-xs font-bold text-rose-700 flex items-center gap-2 animate-fadeIn">
              <BileoAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-fadeIn">
              <BileoCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. GİRİŞ YAP FORMU */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Google Sign-In Primary Action */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#1E1B18] font-bold text-xs border border-[#E2DCD2] hover:border-charcoal/40 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <BileoGoogleIcon className="w-4 h-4 flex-shrink-0" />
                <span>Google ile Giriş Yap</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-[1px] flex-1 bg-[#E2DCD2]/60" />
                <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">veya e-posta ile</span>
                <div className="h-[1px] flex-1 bg-[#E2DCD2]/60" />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <BileoMail className="w-4 h-4 text-charcoal-muted absolute left-4 top-3.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ornek@sefer.com"
                    className="w-full bg-[#FAF7F2] rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-charcoal focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-charcoal-muted">
                    Şifre
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-extrabold text-bordeaux-700 hover:text-bordeaux-900 cursor-pointer transition-colors"
                  >
                    Şifremi Unuttum?
                  </button>
                </div>
                <div className="relative">
                  <BileoLock className="w-4 h-4 text-charcoal-muted absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF7F2] rounded-2xl pl-11 pr-11 py-3 text-xs font-semibold text-charcoal focus:outline-none transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-charcoal-muted hover:text-charcoal cursor-pointer"
                  >
                    {showPassword ? <BileoEyeOff className="w-4 h-4" /> : <BileoEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-charcoal-muted font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-bordeaux-700 w-3.5 h-3.5 rounded"
                  />
                  <span>Oturumumu açık tut</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
                <BileoArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Access Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-[#FAF7F2] hover:bg-cream-100 text-charcoal font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <BileoSparkles className="w-4 h-4 text-bordeaux-700" />
                  <span>Tek Tıkla Demo Girişi (Ahmet Yılmaz)</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. YENİ HESAP OLUŞTUR (KAYIT OL) FORMU */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Google Sign-Up Primary Action */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#1E1B18] font-bold text-xs border border-[#E2DCD2] hover:border-charcoal/40 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <BileoGoogleIcon className="w-4 h-4 flex-shrink-0" />
                <span>Google ile Hızlı Kayıt Ol</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-[1px] flex-1 bg-[#E2DCD2]/60" />
                <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">veya form ile</span>
                <div className="h-[1px] flex-1 bg-[#E2DCD2]/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-muted mb-1">Adınız</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ahmet"
                    className="w-full bg-[#FAF7F2] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-muted mb-1">Soyadınız</label>
                  <input
                    type="text"
                    value={regSurname}
                    onChange={(e) => setRegSurname(e.target.value)}
                    placeholder="Yılmaz"
                    className="w-full bg-[#FAF7F2] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-muted mb-1">E-posta Adresi</label>
                <div className="relative">
                  <BileoMail className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ahmet@sefer.com"
                    className="w-full bg-[#FAF7F2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-muted mb-1">Cep Telefonu</label>
                <div className="relative">
                  <BileoPhone className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0532 123 45 67"
                    className="w-full bg-[#FAF7F2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-muted mb-1">Şifre</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full bg-[#FAF7F2] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-muted mb-1">Şifre Tekrarı</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Şifreyi onaylayın"
                    className="w-full bg-[#FAF7F2] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-charcoal-muted font-medium pt-1">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="accent-bordeaux-700 w-3.5 h-3.5 rounded mt-0.5"
                />
                <span>
                  <strong className="text-charcoal">Kullanım Koşulları</strong> ve <strong className="text-charcoal">KVKK Aydınlatma Metnini</strong> okudum, kabul ediyorum.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur ve Devam Et'}</span>
                <BileoArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 3. ŞİFREMİ UNUTTUM FORMU */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-charcoal mb-1">Şifre Sıfırlama</h4>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Hesabınıza kayıtlı e-posta adresinizi giriniz. Size şifre yenileme bağlantısı göndereceğiz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <BileoMail className="w-4 h-4 text-charcoal-muted absolute left-4 top-3.5" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ornek@sefer.com"
                    className="w-full bg-[#FAF7F2] rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-charcoal focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}</span>
                <BileoArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-extrabold text-charcoal hover:text-bordeaux-700 cursor-pointer transition-colors"
                >
                  ← Giriş Ekranına Dön
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Note */}
        <div className="p-4 bg-[#FAF7F2] text-center text-[10px] text-charcoal-muted font-medium">
          256-Bit SSL Güvenli Bağlantı & Sefer Kişisel Veri Koruma Standartları
        </div>

      </div>
    </div>
  );
};
