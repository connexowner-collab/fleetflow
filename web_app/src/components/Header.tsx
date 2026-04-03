import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96 focus-within:ring-2 focus-within:ring-brand-primary">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Buscar placas, motoristas, ocorrências..." 
          className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-500"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-gray-500 hover:text-brand-primary transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6 cursor-pointer">
          <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">João Gestor</p>
            <p className="text-xs text-brand-primary">ViaCargas Transportes</p>
          </div>
        </div>
      </div>
    </header>
  );
}
