import React, { useEffect, useState } from 'react';
import { Service } from '../../types';
import { ClockIcon, DollarSignIcon, PencilIcon, PlusCircleIcon, TrashIcon } from '../icons';
import ServiceModal from './ServiceModal';

const thumbClass =
  'w-14 h-14 rounded-lg object-cover border border-gray-200 bg-gray-100 flex-shrink-0';

const ServiceThumb: React.FC<{ url?: string | null; label: string }> = ({ url, label }) => {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [url]);
  if (!url?.trim() || broken) {
    return <div className={thumbClass} aria-hidden title="Sem imagem" />;
  }
  return (
    <img
      src={url}
      alt=""
      className={thumbClass}
      title={label}
      onError={() => setBroken(true)}
    />
  );
};

function serviceUsesVariations(s: Service): boolean {
  return Array.isArray(s.price_variations) && s.price_variations.length > 0;
}

function isServiceTypeMode(s: Service): boolean {
  return s.variation_mode === 'service_type';
}

function professionalColumnLabel(s: Service): string {
  return (s.serviceProfessionals?.length ?? 0) > 1 ? 'Profissionais' : 'Profissional';
}

const ServicesView: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar serviços');
      setServices((data.services || []) as Service[]);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSaveService = async (service: Service) => {
    try {
      setLoading(true);
      setError(null);
      let serviceId: number;
      
      if (editingService) {
        const res = await fetch('/api/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingService.id,
            name: service.name,
            price: service.price,
            duration: service.duration,
            description: service.description,
            responsibleProfessionalId: service.responsibleProfessionalId ?? null,
            professional_ids: service.professionalIds ?? [],
            category: service.category ?? null,
            image_url: service.image_url ?? null,
            variation_mode: service.variation_mode ?? 'fixed',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar serviço');
        serviceId = editingService.id;
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: service.name,
            price: service.price,
            duration: service.duration,
            description: service.description,
            responsibleProfessionalId: service.responsibleProfessionalId ?? null,
            professional_ids: service.professionalIds ?? [],
            category: service.category ?? null,
            image_url: service.image_url ?? null,
            variation_mode: service.variation_mode ?? 'fixed',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erro ao criar serviço');
        serviceId = data?.id;
      }
      
      // Gerenciar variações de preço (API usa ?action=variation — precisa bater nas rotas certas)
      if (serviceId && service.price_variations) {
        const existingRes = await fetch(`/api/services?action=variation&service_id=${serviceId}`);
        const existingData = await existingRes.json().catch(() => ({}));
        if (!existingRes.ok) {
          throw new Error((existingData as { error?: string }).error || 'Erro ao carregar variações de preço');
        }
        const existingVariations = (existingData as { variations?: { id: number }[] }).variations || [];

        for (const existing of existingVariations) {
          const stillExists = service.price_variations!.some(v => v.id === existing.id);
          if (!stillExists) {
            const delRes = await fetch(`/api/services?action=variation&id=${existing.id}`, { method: 'DELETE' });
            const delData = await delRes.json().catch(() => ({}));
            if (!delRes.ok) {
              throw new Error((delData as { error?: string }).error || 'Erro ao remover variação de preço');
            }
          }
        }

        const vKind = service.variation_mode === 'service_type' ? 'service_type' : 'duration';

        for (let i = 0; i < service.price_variations.length; i++) {
          const variation = service.price_variations[i];
          const variationData = {
            ...variation,
            service_id: serviceId,
            display_order: i,
            variation_kind: vKind,
            label: vKind === 'service_type' ? (variation.label || '').trim() || null : null,
          };

          if (variation.id) {
            const vRes = await fetch('/api/services?action=variation', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: variation.id,
                duration_minutes: variation.duration_minutes,
                price: variation.price,
                display_order: i,
                variation_kind: vKind,
                label: vKind === 'service_type' ? (variation.label || '').trim() || null : null,
              }),
            });
            const vData = await vRes.json().catch(() => ({}));
            if (!vRes.ok) {
              throw new Error((vData as { error?: string }).error || 'Erro ao atualizar variação de preço');
            }
          } else {
            const vRes = await fetch('/api/services?action=variation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variationData),
            });
            const vData = await vRes.json().catch(() => ({}));
            if (!vRes.ok) {
              throw new Error((vData as { error?: string }).error || 'Erro ao criar variação de preço');
            }
          }
        }
      } else if (serviceId && (!service.price_variations || service.price_variations.length === 0)) {
        const existingRes = await fetch(`/api/services?action=variation&service_id=${serviceId}`);
        const existingData = await existingRes.json().catch(() => ({}));
        if (!existingRes.ok) {
          throw new Error((existingData as { error?: string }).error || 'Erro ao carregar variações de preço');
        }
        const existingVariations = (existingData as { variations?: { id: number }[] }).variations || [];
        for (const existing of existingVariations) {
          const delRes = await fetch(`/api/services?action=variation&id=${existing.id}`, { method: 'DELETE' });
          const delData = await delRes.json().catch(() => ({}));
          if (!delRes.ok) {
            throw new Error((delData as { error?: string }).error || 'Erro ao remover variação de preço');
          }
        }
      }
      
      await load();
      handleCloseModal();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/services?id=${serviceId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir serviço');
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir serviço');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Gerenciar Serviços</h2>
      <div className="flex justify-center items-center mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {/* Tabela desktop */}
      <div className="hidden md:block bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100/50">
            <tr>
              <th className="p-4 font-semibold w-[88px]">Imagem</th>
              <th className="p-4 font-semibold">Serviço</th>
              <th className="p-4 font-semibold">Profissionais</th>
              <th className="p-4 font-semibold text-center">Duração</th>
              <th className="p-4 font-semibold text-center">Preço</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {services.map(service => (
              <tr key={service.id} className="hover:bg-gray-100/40">
                <td className="p-4 align-top">
                  <ServiceThumb url={service.image_url} label={service.name} />
                </td>
                <td className="p-4">
                    <p className="font-bold">{service.name}</p>
                    <p className="text-sm text-gray-600 max-w-md">{service.description}</p>
                </td>
                <td className="p-4">
                  <span className="text-gray-200">{service.responsibleProfessionalName || '—'}</span>
                </td>
                <td className="p-4 text-center align-top">
                  {serviceUsesVariations(service) ? (
                    <ul className="text-sm space-y-2">
                      {service.price_variations!.map((v, i) => (
                        <li key={v.id ?? `v-${i}`} className="text-gray-800">
                          {isServiceTypeMode(service) ? (
                            <>
                              <span className="font-medium block">{v.label || '—'}</span>
                              <span className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                                <ClockIcon className="w-3.5 h-3.5 text-[#5b3310]" />
                                {v.duration_minutes} min
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5">
                              <ClockIcon className="w-4 h-4 text-[#5b3310] flex-shrink-0" />
                              {v.duration_minutes} min
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ClockIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> {service.duration} min
                    </span>
                  )}
                </td>
                <td className="p-4 text-center align-top">
                  {serviceUsesVariations(service) ? (
                    <ul className="text-sm space-y-1.5">
                      {service.price_variations!.map((v, i) => (
                        <li key={v.id ?? `p-${i}`} className="flex items-center justify-center gap-1.5 text-gray-800">
                          <DollarSignIcon className="w-4 h-4 text-[#5b3310] flex-shrink-0" />
                          R${v.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="flex items-center justify-center">
                      <DollarSignIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> R${service.price.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                    <div className="inline-flex space-x-3">
                        <button onClick={() => handleOpenModal(service)} className="text-gray-700 hover:text-blue-400"><PencilIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteService(service.id)} className="text-gray-700 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden grid gap-3">
        {services.map(service => (
          <div key={service.id} className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-start gap-3">
              <ServiceThumb url={service.image_url} label={service.name} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{service.name}</p>
                <p className="text-sm text-gray-600">{service.description}</p>
                <p className="text-gray-700 text-sm mt-1">
                  {service.responsibleProfessionalName
                    ? `${professionalColumnLabel(service)}: ${service.responsibleProfessionalName}`
                    : `${professionalColumnLabel(service)}: —`}
                </p>
              </div>
              <div className="inline-flex space-x-3">
                <button onClick={() => handleOpenModal(service)} className="text-gray-700 hover:text-blue-400"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteService(service.id)} className="text-gray-700 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-700 space-y-1.5">
              {serviceUsesVariations(service) ? (
                service.price_variations!.map((v, i) => (
                  <div key={v.id ?? `m-${i}`} className="flex justify-between gap-2 items-start">
                    <span>
                      {isServiceTypeMode(service) ? (
                        <>
                          <span className="font-medium block">{v.label || '—'}</span>
                          <span className="text-xs text-gray-500 flex items-center mt-0.5">
                            <ClockIcon className="w-3.5 h-3.5 mr-1 text-[#5b3310]" />
                            {v.duration_minutes} min
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" />
                          {v.duration_minutes} min
                        </span>
                      )}
                    </span>
                    <span className="flex items-center font-medium flex-shrink-0">
                      <DollarSignIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" />
                      R${v.price.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" />
                    {service.duration} min
                  </span>
                  <span className="flex items-center">
                    <DollarSignIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" />
                    R${service.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ServiceModal
          service={editingService}
          onClose={handleCloseModal}
          onSave={handleSaveService}
        />
      )}
    </div>
  );
};

export default ServicesView;
