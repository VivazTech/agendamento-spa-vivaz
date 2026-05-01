import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Service } from '../types';

interface DateTimePickerProps {
  onBack: () => void;
  onDateTimeSelect: (date: Date, time: string) => void;
  serviceDuration: number;
  courtesyMode?: boolean;
  selectedServices?: Service[];
}

type BusinessHour = {
  id: string;
  day_of_week: number;
  period: 'morning' | 'afternoon' | 'evening';
  is_active: boolean;
  start_time: string;
  end_time: string;
};

type ProfessionalBreak = {
  id: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
};

const Calendar: React.FC<{ selectedDate: Date; onDateSelect: (date: Date) => void }> = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days = [];
  let day = new Date(startDate);
  while (day <= endOfMonth || days.length % 7 !== 0) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();
  const isSelected = (date: Date) => selectedDate.toDateString() === date.toDateString();
  const isPast = (date: Date) => date < new Date() && !isToday(date);

  const changeMonth = (amount: number) => {
    setCurrentMonth(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + amount);
        return newDate;
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-700"><ChevronLeftIcon className="w-5 h-5" /></button>
        <h3 className="font-bold text-lg text-gray-900">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-700"><ChevronRightIcon className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-600 mb-2 font-semibold">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => !isPast(d) && onDateSelect(d)}
            disabled={isPast(d)}
            className={`w-10 h-10 rounded-full transition-colors duration-200
              ${isPast(d) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#3b200d] hover:text-white'}
              ${d.getMonth() !== currentMonth.getMonth() ? 'text-gray-400' : 'text-gray-900'}
              ${isToday(d) && !isSelected(d) ? 'border-2 border-[#5b3310]' : ''}
              ${isSelected(d) ? 'bg-[#3b200d] text-white font-bold' : ''}
            `}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

const generateTimeSlotsForPeriod = (
  startTime: string, 
  endTime: string, 
  serviceDuration: number
): string[] => {
    const slots: string[] = [];
    
    // Converter horários para minutos
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;
    
    // Intervalo entre horários: duração do serviço + margem de 15 minutos
    const interval = serviceDuration + 15;
    
    let currentTime = startTimeInMinutes;
    
    // Gerar horários considerando a duração do serviço
    while (currentTime + serviceDuration <= endTimeInMinutes) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeString);
        
        // Avançar para o próximo horário disponível
        currentTime += interval;
    }
    
    return slots;
};

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  onBack,
  onDateTimeSelect,
  serviceDuration,
  courtesyMode = false,
  selectedServices = [],
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyCourtesyLimit, setDailyCourtesyLimit] = useState<number>(0);
  const [courtesyCountForDay, setCourtesyCountForDay] = useState<number>(0);
  const [courtesyLoading, setCourtesyLoading] = useState(false);
  const [professionalsBreaks, setProfessionalsBreaks] = useState<ProfessionalBreak[]>([]);

  // Buscar horários de funcionamento
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        const res = await fetch('/api/business-hours');
        const data = await res.json();
        if (res.ok && data.hours) {
          setBusinessHours(data.hours);
        }
      } catch (error) {
        console.error('Erro ao buscar horários de funcionamento:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessHours();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/professionals');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao buscar profissionais');
        setProfessionalsBreaks((data.professionals || []) as ProfessionalBreak[]);
      } catch (error) {
        console.error('Erro ao buscar intervalos dos profissionais:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!courtesyMode) return;
    (async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao carregar limite de cortesia');
        setDailyCourtesyLimit(Number(data?.daily_courtesy_limit || 0));
      } catch (error) {
        console.error('Erro ao buscar limite diário de cortesia:', error);
        setDailyCourtesyLimit(0);
      }
    })();
  }, [courtesyMode]);

  useEffect(() => {
    if (!courtesyMode) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    setCourtesyLoading(true);
    (async () => {
      try {
        const qs = new URLSearchParams({
          from: dateStr,
          to: dateStr,
          courtesy_only: '1',
        });
        const res = await fetch(`/api/bookings?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao carregar cortesias do dia');
        const count = Array.isArray(data?.bookings)
          ? data.bookings.filter(
              (b: any) => !['cancelled', 'rejected'].includes(String(b?.status || '').toLowerCase())
            ).length
          : 0;
        setCourtesyCountForDay(count);
      } catch (error) {
        console.error('Erro ao buscar quantidade de cortesias do dia:', error);
        setCourtesyCountForDay(0);
      } finally {
        setCourtesyLoading(false);
      }
    })();
  }, [courtesyMode, selectedDate]);

  // Gerar slots baseados nos horários configurados e no dia da semana selecionado
  const availableSlots = useMemo(() => {
    const dayOfWeek = selectedDate.getDay(); // 0=Domingo, 1=Segunda, etc.
    const dayHours = businessHours.filter(h => h.day_of_week === dayOfWeek && h.is_active);
    
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    
    dayHours.forEach(hour => {
      const slots = generateTimeSlotsForPeriod(hour.start_time, hour.end_time, serviceDuration);
      
      if (hour.period === 'morning') {
        morning.push(...slots);
      } else if (hour.period === 'afternoon') {
        afternoon.push(...slots);
      } else if (hour.period === 'evening') {
        evening.push(...slots);
      }
    });
    
    return { morning, afternoon, evening };
  }, [selectedDate, serviceDuration, businessHours]);

  const breakBlockedSlots = useMemo(() => {
    const blocked = new Set<string>();
    const servicesWithSingleProfessional = selectedServices.filter((service) => {
      if (service.serviceProfessionals && service.serviceProfessionals.length > 0) {
        return service.serviceProfessionals.length === 1;
      }
      return Boolean(service.responsibleProfessionalId);
    });

    if (servicesWithSingleProfessional.length === 0) return blocked;

    const professionalIds = new Set<string>();
    servicesWithSingleProfessional.forEach((service) => {
      if (service.serviceProfessionals && service.serviceProfessionals.length === 1) {
        professionalIds.add(String(service.serviceProfessionals[0].id));
      } else if (service.responsibleProfessionalId) {
        professionalIds.add(String(service.responsibleProfessionalId));
      }
    });

    const professionalsOnBreak = professionalsBreaks.filter((p) => {
      if (!professionalIds.has(String(p.id))) return false;
      return Boolean(p.break_start_time && p.break_end_time);
    });

    if (professionalsOnBreak.length === 0) return blocked;

    const toMinutes = (value: string) => {
      const [h, m] = value.slice(0, 5).split(':').map(Number);
      return h * 60 + m;
    };

    const allSlots = [...availableSlots.morning, ...availableSlots.afternoon, ...availableSlots.evening];
    for (const slot of allSlots) {
      const slotMinutes = toMinutes(slot);
      const isBlocked = professionalsOnBreak.some((professional) => {
        const start = toMinutes(String(professional.break_start_time).slice(0, 5));
        const end = toMinutes(String(professional.break_end_time).slice(0, 5));
        return slotMinutes >= start && slotMinutes < end;
      });
      if (isBlocked) blocked.add(slot);
    }

    return blocked;
  }, [availableSlots, professionalsBreaks, selectedServices]);

  const visibleSlots = useMemo(
    () => ({
      morning: availableSlots.morning.filter((slot) => !breakBlockedSlots.has(slot)),
      afternoon: availableSlots.afternoon.filter((slot) => !breakBlockedSlots.has(slot)),
      evening: availableSlots.evening.filter((slot) => !breakBlockedSlots.has(slot)),
    }),
    [availableSlots, breakBlockedSlots]
  );
  
  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onDateTimeSelect(selectedDate, selectedTime);
    }
  };

  // Verificar se o dia selecionado está fechado
  const isDayClosed = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dayHours = businessHours.filter(h => h.day_of_week === dayOfWeek && h.is_active);
    return dayHours.length === 0;
  }, [selectedDate, businessHours]);

  const courtesyLimitReached =
    courtesyMode &&
    dailyCourtesyLimit > 0 &&
    courtesyCountForDay >= dailyCourtesyLimit;
  const allSlotsBlockedByBreak =
    !isDayClosed &&
    !courtesyLimitReached &&
    visibleSlots.morning.length === 0 &&
    visibleSlots.afternoon.length === 0 &&
    visibleSlots.evening.length === 0;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl border border-gray-300 shadow-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Escolha a Data e Hora</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {loading || courtesyLoading ? (
            <div className="text-center py-8 text-gray-600">
              Carregando horários...
            </div>
          ) : courtesyLimitReached ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠️ Limite diário de cortesias atingido para este dia
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Já existem {courtesyCountForDay} de {dailyCourtesyLimit} cortesias. Selecione outro dia.
              </p>
            </div>
          ) : allSlotsBlockedByBreak ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠️ Horários indisponíveis por intervalo dos profissionais
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Para os serviços selecionados, os profissionais exclusivos estão em intervalo neste dia/horário.
                Selecione outro dia.
              </p>
            </div>
          ) : isDayClosed ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠️ Não há horários disponíveis neste dia
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Por favor, selecione outro dia
              </p>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-4 text-gray-900">Horários disponíveis para {selectedDate.toLocaleDateString('pt-BR')}</h3>
              {Object.entries(visibleSlots).map(([period, slots]) => (
                  <div key={period} className="mb-4">
                      <h4 className="font-semibold text-[#5b3310] mb-2 capitalize">{period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'}</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {/* Fix: Use Array.isArray as a type guard to ensure 'slots' is treated as an array, resolving the 'unknown' type issue. */}
                          {Array.isArray(slots) && slots.map(time => (
                              <button 
                                  key={time} 
                                  onClick={() => setSelectedTime(time)}
                                  className={`p-2 rounded-lg transition-colors duration-200 border-2 text-gray-900
                                      ${selectedTime === time ? 'bg-[#3b200d] text-white border-[#3b200d] font-bold' : 'bg-gray-50 border-gray-300 hover:border-[#5b3310]'}
                                  `}
                              >
                                  {time}
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-8 border-t border-gray-300 pt-6">
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">Voltar</button>
        <button 
            onClick={handleNext}
            disabled={!selectedTime || isDayClosed || courtesyLimitReached || allSlotsBlockedByBreak}
            className="bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 shadow-md"
        >
            Próximo
        </button>
      </div>
    </div>
  );
};

export default DateTimePicker;