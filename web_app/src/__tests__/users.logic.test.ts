/**
 * Testes unitários: Lógica de Gestão de Usuários
 */

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant: string;
  status: 'Ativo' | 'Inativo';
  access: string[];
};

function filterUsers(users: User[], search: string, tenant: string, role: string): User[] {
  return users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchTenant = !tenant || tenant === 'Todos os Clientes' || u.tenant === tenant;
    const matchRole = !role || role === 'Todos os Perfis' || u.role === role;
    return matchSearch && matchTenant && matchRole;
  });
}

function validateNewUser(name: string, email: string): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!name.trim()) errs.name = 'Nome é obrigatório.';
  if (!email.trim()) errs.email = 'E-mail é obrigatório.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
  return errs;
}

const sampleUsers: User[] = [
  { id: 1, name: 'Roberto Alves', role: 'Motorista', tenant: 'ViaCargas', email: 'roberto@viacargas.com', status: 'Ativo', access: ['App'] },
  { id: 2, name: 'João Gestor', role: 'Gestor de Frotas', tenant: 'ViaCargas', email: 'joao@viacargas.com', status: 'Ativo', access: ['Web', 'App'] },
  { id: 3, name: 'Ana Souza', role: 'Analista de Frotas', tenant: 'LogisticaPro', email: 'ana@logpro.com', status: 'Inativo', access: ['Web'] },
  { id: 4, name: 'Felipe Costa', role: 'Diretor Operacional', tenant: 'LogisticaPro', email: 'felipe@logpro.com', status: 'Ativo', access: ['Web', 'App'] },
];

describe('Usuários - Filtro', () => {
  it('deve retornar todos sem filtros', () => {
    expect(filterUsers(sampleUsers, '', '', '')).toHaveLength(4);
  });

  it('deve filtrar por nome', () => {
    const result = filterUsers(sampleUsers, 'ana', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Souza');
  });

  it('deve filtrar por email', () => {
    const result = filterUsers(sampleUsers, 'logpro', '', '');
    expect(result).toHaveLength(2);
  });

  it('deve filtrar por tenant', () => {
    const result = filterUsers(sampleUsers, '', 'ViaCargas', '');
    expect(result).toHaveLength(2);
    result.forEach((u) => expect(u.tenant).toBe('ViaCargas'));
  });

  it('deve filtrar por perfil', () => {
    const result = filterUsers(sampleUsers, '', '', 'Motorista');
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('Motorista');
  });

  it('deve combinar filtros', () => {
    const result = filterUsers(sampleUsers, '', 'LogisticaPro', 'Analista de Frotas');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Souza');
  });

  it('deve retornar vazio quando não há correspondência', () => {
    expect(filterUsers(sampleUsers, 'naoexiste', '', '')).toHaveLength(0);
  });
});

describe('Usuários - Validação de novo usuário', () => {
  it('deve validar usuário com dados corretos', () => {
    const errs = validateNewUser('João Silva', 'joao@empresa.com');
    expect(Object.keys(errs)).toHaveLength(0);
  });

  it('deve retornar erro para nome vazio', () => {
    const errs = validateNewUser('', 'joao@empresa.com');
    expect(errs.name).toBeDefined();
  });

  it('deve retornar erro para email vazio', () => {
    const errs = validateNewUser('João Silva', '');
    expect(errs.email).toBeDefined();
  });

  it('deve retornar erro para email inválido', () => {
    const errs = validateNewUser('João Silva', 'emailinvalido');
    expect(errs.email).toBe('E-mail inválido.');
  });
});
