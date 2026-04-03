/**
 * Testes unitários: Lógica de Gestão de Frota
 */

type Vehicle = {
  id: number;
  placa: string;
  modelo: string;
  motorista: string;
  status: string;
  km: string;
  carga: string;
};

// Lógica de filtro da página de frota
function filterVehicles(vehicles: Vehicle[], search: string): Vehicle[] {
  const term = search.toLowerCase();
  return vehicles.filter(
    (v) =>
      v.placa.toLowerCase().includes(term) ||
      v.motorista.toLowerCase().includes(term) ||
      v.modelo.toLowerCase().includes(term)
  );
}

// Lógica de criação de veículo
function createVehicle(
  vehicles: Vehicle[],
  placa: string,
  modelo: string,
  motorista?: string,
  carga?: string
): { vehicle?: Vehicle; error?: string } {
  if (!placa.trim()) return { error: '⚠️ Placa e Modelo são obrigatórios.' };
  if (!modelo.trim()) return { error: '⚠️ Placa e Modelo são obrigatórios.' };
  const vehicle: Vehicle = {
    id: vehicles.length + 1,
    placa: placa.toUpperCase(),
    modelo,
    motorista: motorista || 'Nenhum',
    status: 'Disponível',
    km: '0',
    carga: carga || 'N/A',
  };
  return { vehicle };
}

// Lógica de contagem por status
function countByStatus(vehicles: Vehicle[], status: string): number {
  return vehicles.filter((v) => v.status === status).length;
}

const sampleVehicles: Vehicle[] = [
  { id: 1, placa: 'ABC-1234', modelo: 'Volvo FH 540', motorista: 'Roberto Alves', status: 'Em Rota', km: '124500', carga: '40t' },
  { id: 2, placa: 'XYZ-9876', modelo: 'Scania R450', motorista: 'Carlos Silva', status: 'Disponível', km: '88200', carga: '35t' },
  { id: 3, placa: 'DEF-5555', modelo: 'Mercedes Axor', motorista: 'Nenhum', status: 'Em Manutenção', km: '210150', carga: '30t' },
  { id: 4, placa: 'GHI-1111', modelo: 'DAF XF', motorista: 'Ana Souza', status: 'Em Rota', km: '45000', carga: '42t' },
  { id: 5, placa: 'JKL-4444', modelo: 'Iveco Stralis', motorista: 'Felipe Costa', status: 'Sinistrado', km: '112000', carga: '28t' },
];

describe('Frota - Filtro de veículos', () => {
  it('deve retornar todos os veículos com busca vazia', () => {
    expect(filterVehicles(sampleVehicles, '')).toHaveLength(5);
  });

  it('deve filtrar por placa (case insensitive)', () => {
    const result = filterVehicles(sampleVehicles, 'abc');
    expect(result).toHaveLength(1);
    expect(result[0].placa).toBe('ABC-1234');
  });

  it('deve filtrar por motorista', () => {
    const result = filterVehicles(sampleVehicles, 'roberto');
    expect(result).toHaveLength(1);
    expect(result[0].motorista).toBe('Roberto Alves');
  });

  it('deve filtrar por modelo', () => {
    const result = filterVehicles(sampleVehicles, 'volvo');
    expect(result).toHaveLength(1);
    expect(result[0].modelo).toBe('Volvo FH 540');
  });

  it('deve retornar lista vazia para busca sem resultados', () => {
    expect(filterVehicles(sampleVehicles, 'naoexiste')).toHaveLength(0);
  });

  it('deve filtrar por parte do modelo', () => {
    const result = filterVehicles(sampleVehicles, 'scania');
    expect(result).toHaveLength(1);
  });
});

describe('Frota - Criação de veículo', () => {
  it('deve criar veículo com dados completos', () => {
    const { vehicle, error } = createVehicle(sampleVehicles, 'MNO-3456', 'Volvo FH 460', 'João Silva', '38t');
    expect(error).toBeUndefined();
    expect(vehicle?.placa).toBe('MNO-3456');
    expect(vehicle?.modelo).toBe('Volvo FH 460');
    expect(vehicle?.status).toBe('Disponível');
    expect(vehicle?.km).toBe('0');
  });

  it('deve converter placa para maiúsculas', () => {
    const { vehicle } = createVehicle(sampleVehicles, 'mno-3456', 'Volvo FH 460');
    expect(vehicle?.placa).toBe('MNO-3456');
  });

  it('deve retornar erro quando placa está vazia', () => {
    const { vehicle, error } = createVehicle(sampleVehicles, '', 'Volvo FH 460');
    expect(vehicle).toBeUndefined();
    expect(error).toBeDefined();
  });

  it('deve retornar erro quando modelo está vazio', () => {
    const { vehicle, error } = createVehicle(sampleVehicles, 'MNO-3456', '');
    expect(vehicle).toBeUndefined();
    expect(error).toBeDefined();
  });

  it('deve usar "Nenhum" como motorista padrão', () => {
    const { vehicle } = createVehicle(sampleVehicles, 'MNO-3456', 'Volvo FH 460');
    expect(vehicle?.motorista).toBe('Nenhum');
  });

  it('deve usar "N/A" como carga padrão', () => {
    const { vehicle } = createVehicle(sampleVehicles, 'MNO-3456', 'Volvo FH 460');
    expect(vehicle?.carga).toBe('N/A');
  });

  it('deve incrementar o ID corretamente', () => {
    const { vehicle } = createVehicle(sampleVehicles, 'MNO-3456', 'Volvo FH 460');
    expect(vehicle?.id).toBe(sampleVehicles.length + 1);
  });
});

describe('Frota - Contagem por status', () => {
  it('deve contar veículos em rota corretamente', () => {
    expect(countByStatus(sampleVehicles, 'Em Rota')).toBe(2);
  });

  it('deve contar veículos disponíveis corretamente', () => {
    expect(countByStatus(sampleVehicles, 'Disponível')).toBe(1);
  });

  it('deve contar veículos em manutenção corretamente', () => {
    expect(countByStatus(sampleVehicles, 'Em Manutenção')).toBe(1);
  });

  it('deve retornar 0 para status inexistente', () => {
    expect(countByStatus(sampleVehicles, 'Inativo')).toBe(0);
  });
});
