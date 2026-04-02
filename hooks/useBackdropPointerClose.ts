import { useCallback, useRef } from 'react';

/**
 * Fecha só quando o pressionar e soltar o ponteiro ocorrem no próprio backdrop.
 * Evita fechar ao selecionar texto dentro do modal e soltar o mouse fora do painel.
 */
export function useBackdropPointerClose(onClose: () => void) {
  const pointerDownOnBackdrop = useRef(false);

  const onBackdropPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  }, []);

  const onBackdropPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerDownOnBackdrop.current && e.target === e.currentTarget) {
        onClose();
      }
      pointerDownOnBackdrop.current = false;
    },
    [onClose]
  );

  return {
    onBackdropPointerDown,
    onBackdropPointerUp,
  };
}
