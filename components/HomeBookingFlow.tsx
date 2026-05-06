import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Service, Booking, Client } from '../types';
import BannerSlider from './BannerSlider';
import StepIndicator from './StepIndicator';
import ServiceSelector from './ServiceSelector';
import DateTimePicker from './DateTimePicker';
import UserDetailsForm from './UserDetailsForm';
import ConfirmationPage from './ConfirmationPage';

type Step = 'services' | 'datetime' | 'details' | 'confirmation';

export interface HomeBookingFlowProps {
  /** Quando true, envia is_courtesy na API e exibe contexto de cortesia */
  courtesy: boolean;
}

const HomeBookingFlow: React.FC<HomeBookingFlowProps> = ({ courtesy }) => {
  const [step, setStep] = useState<Step>('services');
  const [booking, setBooking] = useState<Partial<Booking>>({
    services: [],
  });
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesLoading, setServicesLoading] = useState<boolean>(false);
  const prevStepRef = useRef<Step>('services');

  useEffect(() => {
    if (prevStepRef.current !== step) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevStepRef.current = step;
    }
  }, [step]);

  useEffect(() => {
    (async () => {
      setServicesLoading(true);
      setServicesError(null);
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao carregar serviços');
        setAvailableServices((data.services || []) as Service[]);
      } catch (e: unknown) {
        setServicesError(e instanceof Error ? e.message : 'Erro ao carregar serviços');
      } finally {
        setServicesLoading(false);
      }
    })();
  }, []);

  const totalDuration = useMemo(
    () =>
      booking.services?.reduce((total, s) => {
        if (s.selectedVariation) {
          return total + s.selectedVariation.duration_minutes;
        }
        return total + s.duration;
      }, 0) || 0,
    [booking.services]
  );

  const totalPrice = useMemo(
    () =>
      booking.services?.reduce((total, s) => {
        if (s.selectedVariation) {
          return total + s.selectedVariation.price;
        }
        return total + s.price;
      }, 0) || 0,
    [booking.services]
  );

  const handleSelectServices = (selectedServices: Service[]) => {
    setBooking((prev) => ({ ...prev, services: selectedServices }));
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setBooking((prev) => ({ ...prev, date, time }));
    setStep('details');
  };

  const handleUserDetailsSubmit = async (client: Client) => {
    const current = { ...booking, client };
    try {
      const dateObj = current.date as Date | undefined;
      const timeStr = (current.time as string | undefined) || '';
      const services = current.services || [];

      if (!dateObj || !timeStr || services.length === 0) {
        alert('Selecione serviços, data e hora antes de confirmar.');
        return;
      }

      const date = dateObj.toISOString().slice(0, 10);
      const time = timeStr.length === 5 ? timeStr : timeStr.slice(0, 5);

      const body = {
        date,
        time,
        professional_id: null as string | null,
        client,
        client_requests_group: Boolean(client.is_group),
        payment_method_id: client.payment_method_id ?? null,
        services: services.map((s) => ({ id: s.id, quantity: 1 })),
        is_courtesy: courtesy,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = 'Falha ao enviar solicitação';
        try {
          const text = await res.text();
          try {
            const j = JSON.parse(text);
            message = j?.error || message;
          } catch {
            if (text) message = text;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      setBooking((prev) => ({ ...prev, client, is_courtesy: courtesy }));
      setStep('confirmation');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao enviar solicitação.');
    }
  };

  const startNewBooking = () => {
    setBooking({ services: [] });
    setStep('services');
  };

  const renderStep = () => {
    switch (step) {
      case 'services':
        return (
          <ServiceSelector
            services={availableServices}
            selectedServices={booking.services || []}
            onSelectServices={handleSelectServices}
            onNext={() => setStep('datetime')}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            hidePrices={false}
          />
        );
      case 'datetime':
        return (
          <DateTimePicker
            onBack={() => setStep('services')}
            onDateTimeSelect={handleDateTimeSelect}
            serviceDuration={totalDuration}
            courtesyMode={courtesy}
            selectedServices={booking.services || []}
          />
        );
      case 'details':
        return <UserDetailsForm onBack={() => setStep('datetime')} onSubmit={handleUserDetailsSubmit} />;
      case 'confirmation':
        return <ConfirmationPage booking={booking as Booking} onNewBooking={startNewBooking} />;
      default:
        return null;
    }
  };

  return (
    <>
      {courtesy && step === 'services' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-amber-950">
          <p className="font-semibold">Área Cortesia</p>
          <p className="text-sm mt-1">Seu agendamento será registrado como cortesia.</p>
        </div>
      )}
      {servicesError && <div className="text-red-600 text-center mb-4">{servicesError}</div>}
      {servicesLoading && step === 'services' && <div className="text-gray-600 text-center mb-4">Carregando serviços...</div>}
      {step === 'services' && (
        <div className="w-full pt-4">
          <BannerSlider />
        </div>
      )}
      {step !== 'confirmation' && <StepIndicator currentStep={step} />}
      <div className="mt-8">{renderStep()}</div>
    </>
  );
};

export default HomeBookingFlow;
