
import React, { useEffect, useState } from 'react';
import { Client } from '../types';

interface UserDetailsFormProps {
  onBack: () => void;
  onSubmit: (client: Client) => void | Promise<void>;
}

// Função para aplicar máscara de telefone (XX) XXXXX-XXXX
const applyPhoneMask = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara conforme o tamanho
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : numbers;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else {
    // Limita a 11 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

// Função para remover máscara e obter apenas números
const removePhoneMask = (value: string): string => {
  return value.replace(/\D/g, '');
};

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onBack, onSubmit }) => {
  const [formData, setFormData] = useState<Client>({
    name: '',
    phone: '',
    email: '', // Mantido para compatibilidade, mas não será usado
    notes: '',
    room_number: '',
    client_type: undefined,
    already_hosted: undefined,
    reservation_number: '',
    is_group: false,
    payment_method_id: null,
  });
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: number; name: string }>>([]);
  
  const [errors, setErrors] = useState<Partial<Client>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payment-methods?active_only=1');
        const data = await res.json();
        if (res.ok) {
          setPaymentMethods((data.payment_methods || []) as Array<{ id: number; name: string }>);
        }
      } catch {}
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Aplicar máscara apenas no campo de telefone
    if (name === 'phone') {
      // Remove caracteres não numéricos e aplica máscara
      const masked = applyPhoneMask(value);
      setFormData(prev => ({ ...prev, [name]: masked }));
    } else if (name === 'room_number') {
      // Aceitar apenas números e limitar a 4 dígitos
      const numbers = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: numbers }));
    } else if (name === 'reservation_number') {
      setFormData(prev => ({ ...prev, reservation_number: value }));
    } else if (name === 'payment_method_id') {
      setFormData(prev => ({ ...prev, payment_method_id: value ? Number(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name as keyof Client]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof Client];
        return newErrors;
      });
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir backspace, delete, tab, escape, enter e setas
    if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    // Garantir que é um número e não uma tecla especial
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const validate = (): { isValid: boolean; errors: Partial<Client> } => {
    const newErrors: Partial<Client> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    
    const phoneNumbers = removePhoneMask(formData.phone);
    if (!phoneNumbers || phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      newErrors.phone = "Telefone inválido. Use o formato (XX) XXXXX-XXXX";
    }
    
    if (!formData.client_type) {
      (newErrors as Record<string, string>).client_type = "Selecione hóspede ou passante";
    }

    if (formData.client_type === 'hospede') {
      if (formData.already_hosted === undefined) {
        (newErrors as Record<string, string>).already_hosted = "Informe se já está hospedado";
      } else if (formData.already_hosted) {
        if (!formData.room_number || formData.room_number.trim().length === 0) {
          newErrors.room_number = "Número do quarto é obrigatório para hóspede já hospedado";
        } else if (formData.room_number.length < 4) {
          newErrors.room_number = "Número do quarto deve ter 4 números";
        }
      } else {
        if (!formData.reservation_number || !formData.reservation_number.trim()) {
          (newErrors as Record<string, string>).reservation_number = "Número da reserva é obrigatório";
        }
      }
    }
    if (paymentMethods.length > 0 && !formData.payment_method_id) {
      (newErrors as Record<string, string>).payment_method_id = 'Selecione a forma de pagamento';
    }
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) {
      return; // Prevenir múltiplos cliques
    }
    
    console.log('Formulário submetido', formData);
    
    const validation = validate();
    
    if (validation.isValid) {
      console.log('Validação passou, chamando onSubmit');
      setIsSubmitting(true);
      try {
        // Remover máscara do telefone antes de enviar
        const phoneWithoutMask = removePhoneMask(formData.phone);
        const dataToSubmit = {
          ...formData,
          phone: phoneWithoutMask,
          email: '', // Email não é mais usado, mas mantido para compatibilidade com API
          payment_method_name:
            paymentMethods.find((p) => p.id === formData.payment_method_id)?.name ?? null,
        };
        const result = onSubmit(dataToSubmit);
        // Se for uma Promise, aguardar
        if (result && typeof result === 'object' && 'then' in result) {
          await result;
        }
        // Se chegou aqui sem erro, o submit foi bem-sucedido
        // O estado será resetado quando o componente for desmontado ou quando houver erro
      } catch (error) {
        console.error('Erro ao submeter:', error);
        setIsSubmitting(false);
        // Re-throw para que o App.tsx possa tratar o erro também
        throw error;
      }
    } else {
      console.log('Validação falhou', validation.errors);
      // Scroll para o primeiro erro após um pequeno delay para garantir que os erros foram renderizados
      setTimeout(() => {
        const firstErrorField = Object.keys(validation.errors)[0];
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }
      }, 100);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl border border-gray-300 shadow-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Seus Dados</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]" />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange}
            onKeyDown={handlePhoneKeyDown}
            maxLength={15}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]" 
          />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cliente <span className="text-red-600">*</span></label>
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                name="client_type"
                checked={formData.client_type === 'hospede'}
                onChange={() =>
                  setFormData(prev => ({
                    ...prev,
                    client_type: 'hospede',
                  }))
                }
              />
              Hóspede
            </label>
            <label className="inline-flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                name="client_type"
                checked={formData.client_type === 'passante'}
                onChange={() =>
                  setFormData(prev => ({
                    ...prev,
                    client_type: 'passante',
                    already_hosted: undefined,
                    room_number: '',
                    reservation_number: '',
                  }))
                }
              />
              Passante
            </label>
          </div>
          {(errors as Record<string, string>).client_type && (
            <p className="text-red-600 text-sm mt-1">{(errors as Record<string, string>).client_type}</p>
          )}
        </div>
        {formData.client_type === 'hospede' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Já está hospedado? <span className="text-red-600">*</span></label>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="already_hosted"
                  checked={formData.already_hosted === true}
                  onChange={() =>
                    setFormData(prev => ({
                      ...prev,
                      already_hosted: true,
                      reservation_number: '',
                    }))
                  }
                />
                Sim
              </label>
              <label className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="already_hosted"
                  checked={formData.already_hosted === false}
                  onChange={() =>
                    setFormData(prev => ({
                      ...prev,
                      already_hosted: false,
                      room_number: '',
                    }))
                  }
                />
                Não
              </label>
            </div>
            {(errors as Record<string, string>).already_hosted && (
              <p className="text-red-600 text-sm mt-1">{(errors as Record<string, string>).already_hosted}</p>
            )}
          </div>
        )}
        {formData.client_type === 'hospede' && formData.already_hosted === true && (
          <div>
            <label htmlFor="room_number" className="block text-sm font-medium text-gray-700 mb-1">Número do quarto <span className="text-red-600">*</span></label>
            <input 
              type="text" 
              id="room_number" 
              name="room_number" 
              value={formData.room_number || ''} 
              onChange={handleChange}
              onKeyDown={(e) => {
                // Permitir backspace, delete, tab, escape, enter e setas
                if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                  // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.keyCode === 65 && e.ctrlKey === true) ||
                  (e.keyCode === 67 && e.ctrlKey === true) ||
                  (e.keyCode === 86 && e.ctrlKey === true) ||
                  (e.keyCode === 88 && e.ctrlKey === true)) {
                  return;
                }
                // Garantir que é um número e não uma tecla especial
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault();
                }
              }}
              maxLength={4}
              placeholder="1234"
              className={`w-full bg-gray-50 border rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310] ${
                errors.room_number ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.room_number && <p className="text-red-600 text-sm mt-1">{errors.room_number}</p>}
          </div>
        )}
        {formData.client_type === 'hospede' && formData.already_hosted === false && (
          <div>
            <label htmlFor="reservation_number" className="block text-sm font-medium text-gray-700 mb-1">Número da reserva <span className="text-red-600">*</span></label>
            <input
              type="text"
              id="reservation_number"
              name="reservation_number"
              value={formData.reservation_number || ''}
              onChange={handleChange}
              placeholder="Informe o número da reserva"
              className={`w-full bg-gray-50 border rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310] ${
                (errors as Record<string, string>).reservation_number ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {(errors as Record<string, string>).reservation_number && (
              <p className="text-red-600 text-sm mt-1">{(errors as Record<string, string>).reservation_number}</p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="payment_method_id" className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
          <select
            id="payment_method_id"
            name="payment_method_id"
            value={formData.payment_method_id ?? ''}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
          >
            <option value="">Selecione...</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {(errors as Record<string, string>).payment_method_id && (
            <p className="text-red-600 text-sm mt-1">{(errors as Record<string, string>).payment_method_id}</p>
          )}
        </div>
        <div>
          <label className="inline-flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              name="is_group"
              checked={Boolean(formData.is_group)}
              onChange={(e) => setFormData(prev => ({ ...prev, is_group: e.target.checked }))}
            />
            Grupo
          </label>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"></textarea>
        </div>
        <div className="flex flex-col gap-3 mt-8 border-t border-gray-300 pt-6">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando solicitação...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </button>
          <button 
            type="button" 
            onClick={onBack} 
            disabled={isSubmitting}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserDetailsForm;
