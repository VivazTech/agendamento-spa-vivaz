import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-[50px] border-t border-gray-300 mt-auto">
      <div className="container mx-auto px-4 text-center space-y-2">
        <div className="text-xs text-gray-600">
          <p className="font-semibold">Vivaz Cataratas Resort</p>
          <p>2026 © Todos os Direitos Reservados</p>
        </div>
        <p className="text-xs text-gray-600">
          Desenvolvido por{' '}
          <a
            href="https://pedroriquelme.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5b3310] hover:text-[#3b200d] underline transition-colors"
          >
            Pedro Riquelme
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

