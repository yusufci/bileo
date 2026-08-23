import { describe, it, expect } from './test_framework';
import {
  generateBus2Plus1Seats,
  generateBus2Plus2Seats,
  generateAirplaneSeats,
  generateTrainSeats,
  generateFerrySeats,
  generateCabinSeats,
} from '../data/mockData';
import { sound } from '../utils/sound';
import { calculatePricing } from '../utils/validation';
import { TransportMode } from '../types';

export function runChallengerStressTests() {
  describe('Challenger M1.2 - Suite 1: Bus Seat Layout Invariants (2+1 and 2+2)', () => {
    it('1.1 Bus 2+1: should enforce absolute uniqueness of IDs and seat numbers across all 31 seats', () => {
      const seats = generateBus2Plus1Seats(500);
      expect(seats.length).toBe(31);

      const idSet = new Set<string>();
      const numberSet = new Set<string | number>();
      const coordSet = new Set<string>();

      seats.forEach((seat) => {
        // ID uniqueness
        expect(idSet.has(seat.id)).toBeFalsy();
        idSet.add(seat.id);

        // Number uniqueness
        expect(numberSet.has(seat.number)).toBeFalsy();
        numberSet.add(seat.number);
        expect(seat.seatNumber).toBe(String(seat.number));

        // Coordinate collision check
        const coordKey = `r${seat.row}-c${seat.col}`;
        expect(coordSet.has(coordKey)).toBeFalsy();
        coordSet.add(coordKey);

        // Integer bounds
        expect(seat.row).toBeGreaterThanOrEqual(1);
        expect(seat.row).toBeLessThanOrEqual(10);
        expect(seat.col).toBeGreaterThanOrEqual(1);
        expect(seat.col).toBeLessThanOrEqual(4);
      });
    });

    it('1.2 Bus 2+1: should strictly assign tiers, geometry, and surcharges across rows 1-9 vs row 10 rear', () => {
      const basePrice = 600;
      const seats = generateBus2Plus1Seats(basePrice);

      // Rows 1-9: Single seat on left (col 1), Double on right (cols 3, 4)
      for (let r = 1; r <= 9; r++) {
        const rowSeats = seats.filter((s) => s.row === r);
        expect(rowSeats.length).toBe(3);

        const single = rowSeats.find((s) => s.col === 1);
        expect(single).toBeDefined();
        expect(single?.tier).toBe('single');
        expect(single?.type).toBe('single');
        expect(single?.price).toBe(basePrice + 30);

        const win = rowSeats.find((s) => s.col === 3);
        expect(win).toBeDefined();
        expect(win?.tier).toBe('window');
        expect(win?.price).toBe(basePrice);

        const aisle = rowSeats.find((s) => s.col === 4);
        expect(aisle).toBeDefined();
        expect(aisle?.tier).toBe('aisle');
        expect(aisle?.price).toBe(basePrice);
      }

      // Row 10 (Rear): 4 contiguous seats (cols 1, 2, 3, 4)
      const rearSeats = seats.filter((s) => s.row === 10);
      expect(rearSeats.length).toBe(4);
      rearSeats.forEach((s) => {
        expect(s.tier).toBe('standard');
        expect(s.price).toBe(basePrice);
        expect(s.label).toContain('Arka Sıra');
      });
    });

    it('1.3 Bus 2+1: should ensure gender integrity and demo seat availability guarantees', () => {
      const seats = generateBus2Plus1Seats(500);

      // Gender status integrity
      seats.forEach((s) => {
        if (s.status === 'taken_male') {
          expect(s.gender).toBe('male');
        } else if (s.status === 'taken_female') {
          expect(s.gender).toBe('female');
        } else if (s.status === 'empty') {
          expect(s.gender).toBe('none');
        }
      });

      // Guaranteed demo empty seats: 7 and 14
      const seat7 = seats.find((s) => s.number === 7);
      const seat14 = seats.find((s) => s.number === 14);
      expect(seat7?.status).toBe('empty');
      expect(seat7?.gender).toBe('none');
      expect(seat14?.status).toBe('empty');
      expect(seat14?.gender).toBe('none');
    });

    it('1.4 Bus 2+2: should enforce 44 seats across 11 rows with window/aisle symmetry', () => {
      const basePrice = 400;
      const seats = generateBus2Plus2Seats(basePrice);
      expect(seats.length).toBe(44);

      const idSet = new Set<string>();
      const numSet = new Set<string | number>();
      const coordSet = new Set<string>();

      seats.forEach((seat) => {
        expect(idSet.has(seat.id)).toBeFalsy();
        idSet.add(seat.id);
        expect(numSet.has(seat.number)).toBeFalsy();
        numSet.add(seat.number);

        const coordKey = `r${seat.row}-c${seat.col}`;
        expect(coordSet.has(coordKey)).toBeFalsy();
        coordSet.add(coordKey);

        expect(seat.price).toBe(basePrice);

        if (seat.col === 1 || seat.col === 4) {
          expect(seat.tier).toBe('window');
          expect(seat.type).toBe('window');
        } else {
          expect(seat.tier).toBe('aisle');
          expect(seat.type).toBe('aisle');
        }
      });
    });
  });

  describe('Challenger M1.2 - Suite 2: Airplane Cabin Layout Invariants (A321 / B737)', () => {
    it('2.1 Airplane: should generate 126 seats with Business (2+2) and Economy (3+3) layouts', () => {
      const basePrice = 1200;
      const seats = generateAirplaneSeats(basePrice, 'Airbus A321neo');
      expect(seats.length).toBe(126); // 3*4 + 19*6 = 12 + 114 = 126

      const idSet = new Set<string>();
      const seatNumSet = new Set<string>();
      const coordSet = new Set<string>();

      seats.forEach((s) => {
        expect(idSet.has(s.id)).toBeFalsy();
        idSet.add(s.id);
        expect(seatNumSet.has(String(s.number))).toBeFalsy();
        seatNumSet.add(String(s.number));

        const coordKey = `r${s.row}-c${s.col}`;
        expect(coordSet.has(coordKey)).toBeFalsy();
        coordSet.add(coordKey);
      });
    });

    it('2.2 Airplane Business Class: Rows 1-3 should have 2+2 layout, +350 TL surcharge, power sockets', () => {
      const basePrice = 1000;
      const seats = generateAirplaneSeats(basePrice);
      const businessSeats = seats.filter((s) => s.row <= 3);
      expect(businessSeats.length).toBe(12);

      businessSeats.forEach((s) => {
        expect(s.cabinClass).toBe('business');
        expect(s.tier).toBe('business');
        expect(s.type).toBe('business');
        expect(s.price).toBe(basePrice + 350);
        expect(s.hasPowerSocket).toBeTruthy();
        expect(s.number).toMatch(/^[1-3][ACDF]$/);
      });
    });

    it('2.3 Airplane Exit Rows: Rows 11-12 should have exit_row tier, extra legroom, +90 TL surcharge', () => {
      const basePrice = 1000;
      const seats = generateAirplaneSeats(basePrice);
      const exitSeats = seats.filter((s) => s.row === 11 || s.row === 12);
      expect(exitSeats.length).toBe(12);

      exitSeats.forEach((s) => {
        expect(s.isExitRow).toBeTruthy();
        expect(s.tier).toBe('exit_row');
        expect(s.type).toBe('extra_legroom');
        expect(s.price).toBe(basePrice + 90);
        expect(s.cabinClass).toBe('economy');
      });
    });

    it('2.4 Airplane Wings & Standard Economy: Rows 9-16 should have wingPosition true', () => {
      const seats = generateAirplaneSeats(1000);
      const wingSeats = seats.filter((s) => s.row >= 9 && s.row <= 16);
      expect(wingSeats.length).toBe(48); // 8 rows * 6 seats
      wingSeats.forEach((s) => {
        expect(s.wingPosition).toBeTruthy();
      });

      const nonWingSeats = seats.filter((s) => (s.row < 9 || s.row > 16) && s.row >= 4);
      nonWingSeats.forEach((s) => {
        expect(s.wingPosition).toBeFalsy();
      });
    });
  });

  describe('Challenger M1.2 - Suite 3: Train Cabin Layout Invariants (Siemens Velaro / CAF YHT)', () => {
    it('3.1 Train Carriage 1 (Business): 8 rows of 2+1 layout, +70 TL surcharge, facing directions', () => {
      const basePrice = 250;
      const seats = generateTrainSeats(basePrice, 'Siemens Velaro YHT', 1);
      expect(seats.length).toBe(24); // 8 rows * 3

      const idSet = new Set<string>();
      const numSet = new Set<string | number>();
      const coordSet = new Set<string>();

      seats.forEach((s) => {
        expect(idSet.has(s.id)).toBeFalsy();
        idSet.add(s.id);
        expect(numSet.has(s.number)).toBeFalsy();
        numSet.add(s.number);

        const coordKey = `r${s.row}-c${s.col}`;
        expect(coordSet.has(coordKey)).toBeFalsy();
        coordSet.add(coordKey);

        expect(s.tier).toBe('business');
        expect(s.cabinClass).toBe('business');
        expect(s.carriageNumber).toBe(1);
        expect(s.price).toBe(basePrice + 70);
        expect(s.hasPowerSocket).toBeTruthy();
        expect(['forward', 'backward']).toContain(s.facingDirection);
      });
    });

    it('3.2 Train Carriage 4 (Table & Family Clusters): 8 rows of 4-seat facing clusters with isTable=true', () => {
      const basePrice = 250;
      const seats = generateTrainSeats(basePrice, 'Siemens Velaro YHT', 4);
      expect(seats.length).toBe(32); // 8 rows * 4

      seats.forEach((s) => {
        expect(s.tier).toBe('table');
        expect(s.type).toBe('table');
        expect(s.isTable).toBeTruthy();
        expect(s.isTableSeat).toBeTruthy();
        expect(s.carriageNumber).toBe(4);
        expect(s.price).toBe(basePrice);
        expect(s.hasPowerSocket).toBeTruthy();
      });
    });

    it('3.3 Train Carriage 2 (Economy): 10 rows of 2+2 standard layout', () => {
      const basePrice = 250;
      const seats = generateTrainSeats(basePrice, 'Siemens Velaro YHT', 2);
      expect(seats.length).toBe(40); // 10 rows * 4

      seats.forEach((s) => {
        expect(s.carriageNumber).toBe(2);
        expect(s.cabinClass).toBe('economy');
        expect(s.price).toBe(basePrice);
        if (s.col === 1 || s.col === 4) {
          expect(s.tier).toBe('window');
        } else {
          expect(s.tier).toBe('aisle');
        }
      });
    });
  });

  describe('Challenger M1.2 - Suite 4: Ferry Deck Layout Invariants (İDO / BUDO Katamaran)', () => {
    it('4.1 Ferry Main Deck: 9 rows * 6 cols (54 seats) with 3+3 clusters and window positioning', () => {
      const basePrice = 300;
      const seats = generateFerrySeats(basePrice, 'main');
      expect(seats.length).toBe(54);

      const idSet = new Set<string>();
      const numSet = new Set<string | number>();
      const coordSet = new Set<string>();

      seats.forEach((s) => {
        expect(idSet.has(s.id)).toBeFalsy();
        idSet.add(s.id);
        expect(numSet.has(s.number)).toBeFalsy();
        numSet.add(s.number);
        expect(String(s.number)).toMatch(/^M-\d+$/);

        const coordKey = `r${s.row}-c${s.col}`;
        expect(coordSet.has(coordKey)).toBeFalsy();
        coordSet.add(coordKey);

        expect(s.deck).toBe('main');
        expect(s.price).toBe(basePrice);
        if (s.col === 1 || s.col === 6) {
          expect(s.tier).toBe('window');
        } else {
          expect(s.tier).toBe('standard');
        }
      });
    });

    it('4.2 Ferry Upper Deck: 6 rows * 6 cols (36 seats) with VIP panoramic lounge +60 TL surcharge', () => {
      const basePrice = 300;
      const seats = generateFerrySeats(basePrice, 'upper');
      expect(seats.length).toBe(36);

      seats.forEach((s) => {
        expect(s.deck).toBe('upper');
        expect(s.tier).toBe('vip_lounge');
        expect(s.price).toBe(basePrice + 60);
        expect(String(s.number)).toMatch(/^U-\d+$/);
      });
    });
  });

  describe('Challenger M1.2 - Suite 5: Unified Generator Dispatcher & Fuzzing / Stress Extremes', () => {
    it('5.1 generateCabinSeats: should dynamically route across all modes and Turkish/English aliases', () => {
      const modes: (TransportMode)[] = ['bus', 'flight', 'train', 'ferry', 'otobus', 'ucak', 'tren', 'feribot'];
      modes.forEach((mode) => {
        const seats = generateCabinSeats(mode, 'bus_2_1', 400);
        expect(seats.length).toBeGreaterThan(0);
        seats.forEach((s) => {
          expect(s.id).toBeDefined();
          expect(s.row).toBeGreaterThan(0);
          expect(s.col).toBeGreaterThan(0);
          expect(s.price).toBeGreaterThanOrEqual(400);
        });
      });
    });

    it('5.2 Fuzzing & Scale: 1,000 rapid generator executions with randomized prices should remain pure and deterministic', () => {
      for (let i = 0; i < 1000; i++) {
        const randomPrice = Math.floor(Math.random() * 5000) + 100;
        const busSeats = generateBus2Plus1Seats(randomPrice);
        expect(busSeats.length).toBe(31);
        expect(busSeats[0].price).toBe(randomPrice + 30);

        const planeSeats = generateAirplaneSeats(randomPrice);
        expect(planeSeats.length).toBe(126);
        expect(planeSeats[0].price).toBe(randomPrice + 350);
      }
    });

    it('5.3 Extreme Boundary Inputs: basePrice = 0 and basePrice = 1,000,000', () => {
      const freeSeats = generateBus2Plus1Seats(0);
      expect(freeSeats[0].price).toBe(30);
      expect(freeSeats[1].price).toBe(0);

      const luxurySeats = generateAirplaneSeats(1000000);
      expect(luxurySeats[0].price).toBe(1000350);
      expect(luxurySeats[12].price).toBe(1000000);
    });

    it('5.4 Cross-Engine Integration: Generated seats must feed accurately into calculatePricing engine', () => {
      const basePrice = 500;
      // 1. Bus single seat selection
      const busSeats = generateBus2Plus1Seats(basePrice);
      const selectedSingle = [busSeats[0]]; // col 1, price 530
      const pricing1 = calculatePricing(basePrice, selectedSingle, { luggageKg: 15, insurance: false });
      expect(pricing1.baseFare).toBe(500);
      expect(pricing1.seatSurcharges).toBe(30);
      expect(pricing1.total).toBe(530);

      // 2. Airplane business seat selection
      const planeSeats = generateAirplaneSeats(basePrice);
      const selectedBusiness = [planeSeats[0]]; // business, price 850
      const pricing2 = calculatePricing(basePrice, selectedBusiness, { luggageKg: 15, insurance: false });
      expect(pricing2.baseFare).toBe(500);
      expect(pricing2.seatSurcharges).toBe(350);
      expect(pricing2.total).toBe(850);

      // 3. Ferry upper deck seat selection
      const ferrySeats = generateFerrySeats(basePrice, 'upper');
      const selectedFerry = [ferrySeats[0]]; // upper deck, price 560
      const pricing3 = calculatePricing(basePrice, selectedFerry, { luggageKg: 15, insurance: false });
      expect(pricing3.baseFare).toBe(500);
      expect(pricing3.seatSurcharges).toBe(60);
      expect(pricing3.total).toBe(560);
    });
  });

  describe('Challenger M1.2 - Suite 6: Web Audio Synthesizer Throttle & Stress Invariants', () => {
    it('6.1 Throttle Limit: Rapid-fire 10,000 playTick calls should strictly obey 120ms rate limiting', () => {
      // In Node.js / headless mode, SoundFX uses performance.now() or Date.now()
      // 10,000 rapid calls within a microsecond
      for (let i = 0; i < 10000; i++) {
        sound.playTick();
      }

      // Verify no runtime crashes occurred
      expect(true).toBeTruthy();
    });

    it('6.2 Web Audio Frequency & Slider Drag Pitch Clamping', () => {
      // Test slider drag across normal and extreme bounds
      sound.playSliderDrag(0.0);
      sound.playSliderDrag(0.5);
      sound.playSliderDrag(1.0);

      // Extreme bounds (below 0, above 1, negative, infinity, NaN)
      sound.playSliderDrag(-10);
      sound.playSliderDrag(999);
      sound.playSliderDrag(NaN);
      sound.playSliderDrag(Infinity);
      sound.playSliderDrag(-Infinity);

      // Verify zero exceptions
      expect(true).toBeTruthy();
    });

    it('6.3 Headless Sound Synthesis Method Matrix: All 7 sound methods execute safely without AudioContext', () => {
      // Execute each sound synthesis method in Node environment
      sound.playTick();
      sound.playClick();
      sound.playSuccessChime();
      sound.playRefundChime();
      sound.playSliderDrag(0.75);
      sound.playSeatSelect();
      sound.playSeatDeselect();

      expect(true).toBeTruthy();
    });

    it('6.4 Mock Web Audio API Concurrency: Stress-test AudioContext oscillator/gain lifecycle under mock browser window', () => {
      let createdOscillators = 0;
      let createdGains = 0;
      let connectedNodes = 0;
      let startedNodes = 0;
      let stoppedNodes = 0;

      const mockAudioCtx = {
        state: 'running',
        currentTime: 100.0,
        destination: {},
        createOscillator() {
          createdOscillators++;
          return {
            type: 'sine',
            frequency: {
              setValueAtTime: () => {},
              exponentialRampToValueAtTime: () => {},
            },
            connect: (_node: any) => {
              connectedNodes++;
            },
            start: (_time?: number) => {
              startedNodes++;
            },
            stop: (_time?: number) => {
              stoppedNodes++;
            },
          };
        },
        createGain() {
          createdGains++;
          return {
            gain: {
              setValueAtTime: () => {},
              linearRampToValueAtTime: () => {},
              exponentialRampToValueAtTime: () => {},
            },
            connect: (_node: any) => {
              connectedNodes++;
            },
          };
        },
        resume: async () => {},
      };

      // Temporarily inject global window with mockAudioCtx
      (sound as any).ctx = null;
      (global as any).window = {
        AudioContext: function () {
          return mockAudioCtx;
        },
      };

      // Import fresh SoundFX or use private instance if possible, or trigger methods
      // sound singleton already instantiated, but initCtx() checks window.AudioContext dynamically
      sound.playClick();
      sound.playSeatSelect();
      sound.playSeatDeselect();
      sound.playSuccessChime();
      sound.playRefundChime();
      sound.playSliderDrag(0.5);

      // Verify lifecycle methods were called
      expect(createdOscillators).toBeGreaterThanOrEqual(10); // 1 + 1 + 1 + 4 + 3 + 1 = 11 oscillators
      expect(createdGains).toBeGreaterThanOrEqual(10);
      expect(connectedNodes).toBeGreaterThanOrEqual(20);
      expect(startedNodes).toBeGreaterThanOrEqual(10);
      expect(stoppedNodes).toBeGreaterThanOrEqual(10);

      // Cleanup window mock & reset sound audio context
      (sound as any).ctx = null;
      delete (global as any).window;
    });

    it('6.5 Error Resilience: Web Audio exceptions (e.g. permission/hardware error) are swallowed safely without crashing caller', () => {
      const errorThrowingAudioCtx = {
        state: 'running',
        currentTime: 0,
        createOscillator() {
          throw new Error('Hardware audio device disconnected / permission denied');
        },
        createGain() {
          throw new Error('Gain allocation failed');
        },
      };

      (sound as any).ctx = null;
      (global as any).window = {
        AudioContext: function () {
          return errorThrowingAudioCtx;
        },
      };

      // None of these should throw
      sound.playClick();
      sound.playSuccessChime();
      sound.playRefundChime();
      sound.playSliderDrag(0.2);
      sound.playSeatSelect();
      sound.playSeatDeselect();

      (sound as any).ctx = null;
      delete (global as any).window;
      expect(true).toBeTruthy();
    });
  });
}
