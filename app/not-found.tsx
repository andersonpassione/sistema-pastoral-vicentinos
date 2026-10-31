import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f9ff] text-[#111c2c]">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#dee8ff] text-center space-y-4">
        <span className="text-[12px] font-bold text-[#00603e] uppercase tracking-wider bg-[#9cf5c5] px-3 py-1 rounded-full">
          Página não encontrada
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#111c2c]">404</h1>
        <p className="text-[14px] text-[#3f4942]">
          A página ou recurso solicitado não foi encontrado no sistema.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white font-bold text-[14px] transition-colors"
          >
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
