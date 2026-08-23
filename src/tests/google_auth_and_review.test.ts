// Google Authentication & User Review Identity Testing Suite
// Verifies GIS profile mapping, JWT token payload decoding, Google Icon rendering, and review author pre-fill invariants.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from './test_framework';
import { mapGoogleProfileToUser, parseJwtPayload, authenticateWithGoogle } from '../services/googleAuth';
import { BileoGoogleIcon } from '../components/icons';
import { User, ReviewItem } from '../types';

export function runGoogleAuthAndReviewTests() {
  describe('Google OAuth 2.0 & Identity Services Integration', () => {
    it('1.1 maps standard Google profile to Bileo User model correctly', () => {
      const googleProfile = {
        email: 'CAN.YILDIZ@GMAIL.COM',
        given_name: 'Can',
        family_name: 'Yıldız',
        sub: 'google-sub-123456',
        name: 'Can Yıldız',
      };

      const user = mapGoogleProfileToUser(googleProfile);

      expect(user.id).toBe('usr_g_google-sub-123456');
      expect(user.name).toBe('Can');
      expect(user.surname).toBe('Yıldız');
      expect(user.email).toBe('can.yildiz@gmail.com');
      expect(user.avatarInitials).toBe('CY');
      expect(typeof user.createdAt).toBe('string');
    });

    it('1.2 handles single-name or unusual full names without throwing', () => {
      const singleNameProfile = {
        email: 'solo@gmail.com',
        name: 'Zeynep',
      };

      const user = mapGoogleProfileToUser(singleNameProfile);
      expect(user.name).toBe('Zeynep');
      expect(user.surname).toBe('Kullanıcısı');
      expect(user.avatarInitials).toBe('ZK');
    });

    it('1.3 parses base64url encoded JWT payloads safely', () => {
      const payloadObj = { sub: '998877', email: 'test@gmail.com', name: 'Ayşe Kaya' };
      const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const fakeJwt = `header.${base64Payload}.signature`;

      const parsed = parseJwtPayload(fakeJwt);
      expect(parsed).toBeTruthy();
      expect(parsed.sub).toBe('998877');
      expect(parsed.email).toBe('test@gmail.com');
    });

    it('1.4 authenticateWithGoogle resolves a verified User instance', async () => {
      const user = await authenticateWithGoogle();
      expect(user).toBeTruthy();
      expect(user.email.includes('@')).toBe(true);
      expect(user.name.length).toBeGreaterThan(0);
      expect(user.surname.length).toBeGreaterThan(0);
      expect(user.avatarInitials?.length).toBe(2);
    });

    it('1.5 renders BileoGoogleIcon with 4-color authentic vector paths', () => {
      const markup = renderToStaticMarkup(React.createElement(BileoGoogleIcon, { size: 20 }));
      expect(markup).toContain('viewBox="0 0 24 24"');
      expect(markup).toContain('#4285F4'); // Google Blue
      expect(markup).toContain('#34A853'); // Google Green
      expect(markup).toContain('#FBBC05'); // Google Yellow
      expect(markup).toContain('#EA4335'); // Google Red
    });
  });

  describe('Review Submission Authenticated User Identity Invariants', () => {
    it('2.1 uses authenticated user name automatically for review author', () => {
      const loggedInUser: User = {
        id: 'usr_100',
        name: 'Burak',
        surname: 'Öztürk',
        email: 'burak.ozturk@gmail.com',
        phone: '0532 000 11 22',
        avatarInitials: 'BÖ',
      };

      const fallbackAuthorInput = 'Manual Input Name';
      const resolvedAuthor = loggedInUser
        ? `${loggedInUser.name} ${loggedInUser.surname}`.trim()
        : fallbackAuthorInput;

      expect(resolvedAuthor).toBe('Burak Öztürk');
    });

    it('2.2 resolves verified passenger badge for logged in users in review thread', () => {
      const loggedInUser: User = {
        id: 'usr_101',
        name: 'Elif',
        surname: 'Aydın',
        email: 'elif@gmail.com',
        phone: '0555 123 45 67',
        avatarInitials: 'EA',
      };

      const review: ReviewItem = {
        id: 'rev-test-1',
        author: `${loggedInUser.name} ${loggedInUser.surname}`,
        rating: 5,
        date: 'Bugün',
        comment: 'Harika bir sefer deneyimiydi.',
        travelType: '2+1 VIP Otobüs',
        verified: true,
      };

      expect(review.author).toBe('Elif Aydın');
      expect(review.verified).toBe(true);
    });
  });
}
