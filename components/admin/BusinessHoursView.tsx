import React, { useEffect, useState } from 'react';

type BusinessHour = {
  id: string;
  day_of_week: number;
  period: 'morning' | 'afternoon' | 'evening';
  is_active: boolean;
  start_time: string;
  end_time: string;
};

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const PERIODS = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
};

const BusinessHoursView: React.FC = () => {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/business-hours');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar horários');
      setHours(data.hours || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateHour = async (hour: BusinessHour) => {
    setSaving(hour.id);
    setError(null);
    try {
      const res = await fetch('/api/business-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hour),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar horário');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (hour: BusinessHour) => {
    await updateHour({ ...hour, is_active: !hour.is_active });
  };

  const updateTime = async (hour: BusinessHour, field: 'start_time' | 'end_time', value: string) => {
    await updateHour({ ...hour, [field]: value });
  };

  // Agrupar por dia da semana
  const groupedByDay = hours.reduce((acc, hour) => {
    if (!acc[hour.day_of_week]) {
      acc[hour.day_of_week] = [];
    }
    acc[hour.day_of_week].push(hour);
    return acc;
  }, {} as Record<number, BusinessHour[]>);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Horários de Funcionamento</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Importante:</strong> Configure os horários de funcionamento por dia da semana e período. 
          Os horários desativados não aparecerão para os clientes no momento do agendamento.
        </p>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {loading && hours.length === 0 && (
        <div className="text-center text-gray-600 py-8">Carregando...</div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedByDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([dayOfWeek, dayHours]) => (
            <div key={dayOfWeek} className="bg-white rounded-lg border border-gray-300 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {DAYS_OF_WEEK[Number(dayOfWeek)]}
              </h3>
              
              <div className="space-y-3">
                {dayHours
                  .sort((a, b) => {
                    const order = { morning: 0, afternoon: 1, evening: 2 };
                    return order[a.period] - order[b.period];
                  })
                  .map(hour => (
                    <div 
                      key={hour.id} 
                      className={`grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-3 rounded-lg border ${
                        hour.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Período */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(hour)}
                          disabled={saving === hour.id}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            hour.is_active
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-gray-300'
                          } disabled:opacity-50`}
                        >
                          {hour.is_active && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <span className={`font-semibold ${hour.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {PERIODS[hour.period]}
                        </span>
                      </div>

                      {/* Horário de Início */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Início</label>
                        <input
                          type="time"
                          value={hour.start_time}
                          onChange={(e) => updateTime(hour, 'start_time', e.target.value)}
                          disabled={saving === hour.id || !hour.is_active}
                          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </div>

                      {/* Horário Final */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fim</label>
                        <input
                          type="time"
                          value={hour.end_time}
                          onChange={(e) => updateTime(hour, 'end_time', e.target.value)}
                          disabled={saving === hour.id || !hour.is_active}
                          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          hour.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {hour.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Salvando */}
                      <div className="text-center">
                        {saving === hour.id && (
                          <span className="text-sm text-blue-600">Salvando...</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BusinessHoursView;

