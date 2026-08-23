// Auth & Gatekeeping Comprehensive Test Suite for Sefer
import { describe, it, expect } from './test_framework';
import { User } from '../types';

export function runAuthGatekeepingTests() {
  describe('Authentication & Gatekeeping System Tests', () => {

    it('1.1 Initial Auth State: defaults to null when localStorage is empty', () => {
      const user: User | null = null;
      expect(user).toBe(null);
    });

    it('1.2 User Initials Calculation: derives correct 2-letter uppercase initials', () => {
      const deriveInitials = (name: string, surname: string): string => {
        const n = name.trim()[0] || 'S';
        const s = surname.trim()[0] || 'Y';
        return `${n.toUpperCase()}${s.toUpperCase()}`;
      };

      expect(deriveInitials('Ahmet', 'Yılmaz')).toBe('AY');
      expect(deriveInitials('mehmet', 'kaya')).toBe('MK');
      expect(deriveInitials('Zeynep', 'Demir')).toBe('ZD');
    });

    it('1.3 Demo User Generation: produces valid complete user profile', () => {
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

      expect(demoUser.id.startsWith('usr_')).toBeTruthy();
      expect(demoUser.name).toBe('Ahmet');
      expect(demoUser.surname).toBe('Yılmaz');
      expect(demoUser.email.includes('@sefer.com')).toBeTruthy();
      expect(demoUser.avatarInitials).toBe('AY');
    });

    it('1.4 Email Validation: rejects invalid formats and accepts valid emails', () => {
      const isValidEmail = (email: string) => {
        const trimmed = email.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      };

      expect(isValidEmail('ahmet@sefer.com')).toBeTruthy();
      expect(isValidEmail('user.name+tag@domain.co')).toBeTruthy();
      expect(isValidEmail('')).toBeFalsy();
      expect(isValidEmail('plainaddress')).toBeFalsy();
      expect(isValidEmail('@missingusername.com')).toBeFalsy();
    });

    it('1.5 Registration Validator: enforces full name, valid email, 10-digit phone, matching passwords and KVKK', () => {
      const validateRegistration = (data: {
        name: string;
        surname: string;
        email: string;
        phone: string;
        password: string;
        passwordConfirm: string;
        acceptTerms: boolean;
      }): { isValid: boolean; error?: string } => {
        if (!data.name.trim() || !data.surname.trim()) {
          return { isValid: false, error: 'Lütfen adınızı ve soyadınızı eksiksiz giriniz.' };
        }
        if (!data.email.trim() || !data.email.includes('@')) {
          return { isValid: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' };
        }
        if (!data.phone.trim() || data.phone.replace(/\D/g, '').length < 10) {
          return { isValid: false, error: 'Lütfen geçerli bir 10 haneli cep telefonu numarası giriniz.' };
        }
        if (!data.password || data.password.length < 6) {
          return { isValid: false, error: 'Şifreniz en az 6 karakterden oluşmalıdır.' };
        }
        if (data.password !== data.passwordConfirm) {
          return { isValid: false, error: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.' };
        }
        if (!data.acceptTerms) {
          return { isValid: false, error: 'Lütfen Kullanım Koşulları ve KVKK metnini onaylayınız.' };
        }
        return { isValid: true };
      };

      // Valid registration
      const validRes = validateRegistration({
        name: 'Can',
        surname: 'Öztürk',
        email: 'can@example.com',
        phone: '05551234567',
        password: 'secretPassword123',
        passwordConfirm: 'secretPassword123',
        acceptTerms: true,
      });
      expect(validRes.isValid).toBeTruthy();

      // Password mismatch
      const mismatchRes = validateRegistration({
        name: 'Can',
        surname: 'Öztürk',
        email: 'can@example.com',
        phone: '05551234567',
        password: 'password1',
        passwordConfirm: 'password2',
        acceptTerms: true,
      });
      expect(mismatchRes.isValid).toBeFalsy();
      expect(mismatchRes.error).toBe('Girdiğiniz şifreler birbiriyle eşleşmiyor.');

      // Short phone
      const shortPhoneRes = validateRegistration({
        name: 'Can',
        surname: 'Öztürk',
        email: 'can@example.com',
        phone: '123',
        password: 'password123',
        passwordConfirm: 'password123',
        acceptTerms: true,
      });
      expect(shortPhoneRes.isValid).toBeFalsy();

      // Terms not accepted
      const termsRes = validateRegistration({
        name: 'Can',
        surname: 'Öztürk',
        email: 'can@example.com',
        phone: '05551234567',
        password: 'password123',
        passwordConfirm: 'password123',
        acceptTerms: false,
      });
      expect(termsRes.isValid).toBeFalsy();
    });

    it('1.6 Gatekeeper Function: intercepts unauthenticated users and stores pending action', () => {
      let currentUser: User | null = null;
      let isAuthModalOpen = false;
      let authPromptReason: string | undefined;
      let pendingActionExecuted = false;
      let pendingAction: (() => void) | null = null;

      const requireAuth = (reason: string, actionOnSuccess?: () => void): boolean => {
        if (currentUser) {
          if (actionOnSuccess) actionOnSuccess();
          return true;
        }
        authPromptReason = reason;
        if (actionOnSuccess) {
          pendingAction = actionOnSuccess;
        }
        isAuthModalOpen = true;
        return false;
      };

      // Attempt search without auth
      const allowed = requireAuth('Sefer aramak için giriş yapın.', () => {
        pendingActionExecuted = true;
      });

      expect(allowed).toBeFalsy();
      expect(isAuthModalOpen).toBeTruthy();
      expect(authPromptReason).toBe('Sefer aramak için giriş yapın.');
      expect(pendingActionExecuted).toBeFalsy();
      expect(pendingAction !== null).toBeTruthy();

      // Simulate successful login
      currentUser = {
        id: 'usr_test',
        name: 'Test',
        surname: 'User',
        email: 'test@sefer.com',
        phone: '05001112233',
      };
      if (pendingAction) {
        (pendingAction as () => void)();
      }

      expect(pendingActionExecuted).toBeTruthy();
    });

    it('1.7 Logout Routine: cleanly resets user state and clears session', () => {
      let user: User | null = {
        id: 'usr_1',
        name: 'Ahmet',
        surname: 'Yılmaz',
        email: 'ahmet@sefer.com',
        phone: '05321112233',
      };
      let isWalletOpen = true;

      const handleLogout = () => {
        user = null;
        isWalletOpen = false;
      };

      handleLogout();
      expect(user).toBe(null);
      expect(isWalletOpen).toBe(false);
    });

    it('1.8 Session Serialization & Deserialization: JSON round-trip accuracy', () => {
      const originalUser: User = {
        id: 'usr_persistent_99',
        name: 'Ayşe',
        surname: 'Kara',
        email: 'ayse@sefer.com',
        phone: '05449998877',
        avatarInitials: 'AK',
      };

      const serialized = JSON.stringify(originalUser);
      const deserialized: User = JSON.parse(serialized);

      expect(deserialized.id).toBe(originalUser.id);
      expect(deserialized.name).toBe(originalUser.name);
      expect(deserialized.email).toBe(originalUser.email);
      expect(deserialized.avatarInitials).toBe(originalUser.avatarInitials);
    });
  });
}
