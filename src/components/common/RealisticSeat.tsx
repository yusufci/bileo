import React from 'react';
import { SeatItem } from '../../types';
import { BileoCheckIcon } from '../icons/BileoTransportIcons';

interface RealisticSeatProps {
  seat: SeatItem;
  isSelected: boolean;
  isMale: boolean;
  isFemale: boolean;
  isBooked: boolean;
  isSingleVIP?: boolean;
  selectedGender?: 'male' | 'female';
  onClick: (seat: SeatItem) => void;
}

export const RealisticSeat: React.FC<RealisticSeatProps> = ({
  seat,
  isSelected,
  isMale,
  isFemale,
  isBooked,
  isSingleVIP,
  selectedGender,
  onClick,
}) => {
  const isDisabled = isMale || isFemale || isBooked || seat.status === 'disabled';

  // Accessible name carries the state that the colours convey visually.
  const genderWord = (g: 'male' | 'female' | undefined): string => (g === 'male' ? ', bay' : g === 'female' ? ', bayan' : '');
  const stateLabel = isSelected
    ? `seçili${genderWord(selectedGender)}`
    : isMale
      ? 'dolu, bay'
      : isFemale
        ? 'dolu, bayan'
        : isBooked || seat.status === 'disabled'
          ? 'dolu'
          : 'boş';
  const accessibleName = `Koltuk ${seat.number}${isSingleVIP ? ', tekli VIP' : ''}, ${stateLabel}`;

  // Base state styles for physical armchair rendering
  let containerStyles = 'bg-white border-[1.5px] border-[#D8D0C5] text-[#1E1B18] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:border-bordeaux-700 hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer';
  let headrestStyles = 'bg-[#F2ECE1] border-b border-[#E2D8C9] text-[#7A7062]';
  let bolsterStyles = 'bg-[#EAE2D5]';
  let bottomCushionStyles = 'bg-[#F5EFE6] border-t border-[#E2D8C9]';
  let numberColor = 'text-[#1E1B18] font-black';

  if (isSelected) {
    if (selectedGender === 'male') {
      // Midnight Blue Male Selection
      containerStyles = 'bg-[#1E3A8A] border-[1.5px] border-[#172554] text-white shadow-[0_4px_12px_rgba(30,58,138,0.35)] scale-[1.03] cursor-pointer';
      headrestStyles = 'bg-[#172554] border-b border-[#0F172A] text-white/90';
      bolsterStyles = 'bg-[#1E40AF]/60';
      bottomCushionStyles = 'bg-[#172554]/80 border-t border-[#0F172A]';
      numberColor = 'text-white font-black';
    } else if (selectedGender === 'female') {
      // Signature Bordeaux Female Selection
      containerStyles = 'bg-bordeaux-700 border-[1.5px] border-bordeaux-800 text-white shadow-[0_4px_12px_rgba(138,34,43,0.35)] scale-[1.03] cursor-pointer';
      headrestStyles = 'bg-bordeaux-800 border-b border-bordeaux-900 text-white/90';
      bolsterStyles = 'bg-bordeaux-600/60';
      bottomCushionStyles = 'bg-bordeaux-800/80 border-t border-bordeaux-900';
      numberColor = 'text-white font-black';
    } else {
      // General Selection
      containerStyles = 'bg-bordeaux-700 border-[1.5px] border-bordeaux-800 text-white shadow-[0_4px_12px_rgba(138,34,43,0.35)] scale-[1.03] cursor-pointer';
      headrestStyles = 'bg-bordeaux-800 border-b border-bordeaux-900 text-white/90';
      bolsterStyles = 'bg-bordeaux-600/60';
      bottomCushionStyles = 'bg-bordeaux-800/80 border-t border-bordeaux-900';
      numberColor = 'text-white font-black';
    }
  } else if (isMale) {
    containerStyles = 'bg-[#EEF4FA] border-[1.5px] border-[#CBDCEB] text-[#1E3A8A] cursor-not-allowed opacity-90';
    headrestStyles = 'bg-[#DDE9F5] border-b border-[#CBDCEB] text-[#1E3A8A]/70';
    bolsterStyles = 'bg-[#D0E2F2]';
    bottomCushionStyles = 'bg-[#E3EFF9] border-t border-[#CBDCEB]';
    numberColor = 'text-[#1E3A8A] font-bold';
  } else if (isFemale) {
    containerStyles = 'bg-[#FDF1F3] border-[1.5px] border-[#F9CCD4] text-[#9E1C38] cursor-not-allowed opacity-90';
    headrestStyles = 'bg-[#F9DEE3] border-b border-[#F9CCD4] text-[#9E1C38]/70';
    bolsterStyles = 'bg-[#F5CDD5]';
    bottomCushionStyles = 'bg-[#FBE8EC] border-t border-[#F9CCD4]';
    numberColor = 'text-[#9E1C38] font-bold';
  } else if (isBooked) {
    containerStyles = 'bg-[#EDE7DE] border-[1.5px] border-[#DBD4C8] text-[#9E9689] cursor-not-allowed opacity-50';
    headrestStyles = 'bg-[#E2DBD1] border-b border-[#DBD4C8] text-[#9E9689]';
    bolsterStyles = 'bg-[#D8D0C4]';
    bottomCushionStyles = 'bg-[#E2DBD1] border-t border-[#DBD4C8]';
    numberColor = 'text-[#9E9689] font-medium';
  }

  return (
    <button
      type="button"
      onClick={() => onClick(seat)}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={accessibleName}
      className="group relative select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-bordeaux-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] border-none p-0 transition-transform motion-reduce:transition-none"
      title={seat.label || `Koltuk ${seat.number}${isSingleVIP ? ' (Tekli VIP)' : ''}`}
    >
      {/* 3D Contoured Ergonomic Passenger Armchair Chassis */}
      <div
        className={`w-12 h-14 sm:w-13 sm:h-15 rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-200 relative ${containerStyles}`}
      >
        {/* Left & Right Ergonomic Armrest Bolsters */}
        <div className={`absolute left-0 top-3.5 bottom-2.5 w-1 rounded-r-sm ${bolsterStyles}`} />
        <div className={`absolute right-0 top-3.5 bottom-2.5 w-1 rounded-l-sm ${bolsterStyles}`} />

        {/* Integrated Ergonomic Top Headrest with Stitching Groove */}
        <div
          className={`h-4 w-full flex items-center justify-center transition-colors duration-150 relative ${headrestStyles}`}
        >
          <div className="w-5 h-[2px] rounded-full bg-black/15" />
          {isSingleVIP && !isSelected && !isDisabled && (
            <span className="absolute right-1 top-0.5 text-[7px] font-black text-amber-600 uppercase tracking-tighter">
              VIP
            </span>
          )}
        </div>

        {/* Center Orthopedic Backrest with Crisp Number Typography */}
        <div className="flex-1 flex flex-col items-center justify-center px-1">
          <span className={`text-xs sm:text-sm tracking-tight ${numberColor}`}>
            {seat.number}
          </span>
        </div>

        {/* Plump Ergonomic Bottom Base Cushion */}
        <div className={`h-2.5 w-full flex items-center justify-center transition-colors ${bottomCushionStyles}`}>
          <div className="w-4 h-[1px] rounded-full bg-black/10" />
        </div>
      </div>

      {/* Modern Checkmark Badge when Selected */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 z-20 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white animate-scaleUp">
          <BileoCheckIcon className="w-2.5 h-2.5 text-white stroke-[3]" />
        </div>
      )}
    </button>
  );
};