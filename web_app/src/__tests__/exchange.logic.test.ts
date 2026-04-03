/**
 * Testes unitários: Lógica de Aprovações de Troca
 */

type Exchange = {
  id: number;
  motorista: string;
  status: 'Pendente' | 'Aprovada' | 'Recusada';
  placaEntrega: string;
  placaRecebimento: string;
};

function aprovarTroca(exchange: Exchange): Exchange | { error: string } {
  if (exchange.status !== 'Pendente') return { error: 'Apenas trocas pendentes podem ser aprovadas.' };
  return { ...exchange, status: 'Aprovada' };
}

function recusarTroca(exchange: Exchange): Exchange | { error: string } {
  if (exchange.status !== 'Pendente') return { error: 'Apenas trocas pendentes podem ser recusadas.' };
  return { ...exchange, status: 'Recusada' };
}

function podeAuditar(exchange: Exchange): boolean {
  return exchange.status === 'Pendente';
}

const sampleExchange: Exchange = {
  id: 1,
  motorista: 'Carlos Silva',
  status: 'Pendente',
  placaEntrega: 'ABC-1234',
  placaRecebimento: 'XYZ-9876',
};

describe('Trocas - Aprovação', () => {
  it('deve aprovar troca pendente', () => {
    const result = aprovarTroca(sampleExchange);
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.status).toBe('Aprovada');
  });

  it('não deve aprovar troca já aprovada', () => {
    const result = aprovarTroca({ ...sampleExchange, status: 'Aprovada' });
    expect('error' in result).toBe(true);
  });

  it('não deve aprovar troca recusada', () => {
    const result = aprovarTroca({ ...sampleExchange, status: 'Recusada' });
    expect('error' in result).toBe(true);
  });
});

describe('Trocas - Recusa', () => {
  it('deve recusar troca pendente', () => {
    const result = recusarTroca(sampleExchange);
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.status).toBe('Recusada');
  });

  it('não deve recusar troca já aprovada', () => {
    const result = recusarTroca({ ...sampleExchange, status: 'Aprovada' });
    expect('error' in result).toBe(true);
  });

  it('não deve recusar troca já recusada', () => {
    const result = recusarTroca({ ...sampleExchange, status: 'Recusada' });
    expect('error' in result).toBe(true);
  });
});

describe('Trocas - Permissão de auditoria', () => {
  it('deve permitir auditoria de troca pendente', () => {
    expect(podeAuditar(sampleExchange)).toBe(true);
  });

  it('não deve permitir auditoria de troca aprovada', () => {
    expect(podeAuditar({ ...sampleExchange, status: 'Aprovada' })).toBe(false);
  });

  it('não deve permitir auditoria de troca recusada', () => {
    expect(podeAuditar({ ...sampleExchange, status: 'Recusada' })).toBe(false);
  });
});
