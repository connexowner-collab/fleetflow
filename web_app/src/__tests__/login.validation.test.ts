/**
 * Testes unitários: Validação do formulário de login
 */

// Lógica de validação extraída da página de login para ser testável isoladamente
function validateLoginForm(tenant: string, email: string, password: string) {
  const errs: Record<string, string> = {};
  if (!tenant.trim()) errs.tenant = 'Informe o nome da empresa (tenant).';
  if (!email.trim()) errs.email = 'Informe o e-mail corporativo.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
  if (!password.trim()) errs.password = 'Informe a senha.';
  else if (password.length < 6) errs.password = 'A senha deve ter no mínimo 6 caracteres.';
  return errs;
}

describe('Login - Validação de formulário', () => {
  describe('Campo tenant', () => {
    it('deve retornar erro quando tenant está vazio', () => {
      const errs = validateLoginForm('', 'user@test.com', 'senha123');
      expect(errs.tenant).toBe('Informe o nome da empresa (tenant).');
    });

    it('deve retornar erro quando tenant é só espaços', () => {
      const errs = validateLoginForm('   ', 'user@test.com', 'senha123');
      expect(errs.tenant).toBe('Informe o nome da empresa (tenant).');
    });

    it('não deve retornar erro quando tenant está preenchido', () => {
      const errs = validateLoginForm('viacargas', 'user@test.com', 'senha123');
      expect(errs.tenant).toBeUndefined();
    });
  });

  describe('Campo email', () => {
    it('deve retornar erro quando email está vazio', () => {
      const errs = validateLoginForm('viacargas', '', 'senha123');
      expect(errs.email).toBe('Informe o e-mail corporativo.');
    });

    it('deve retornar erro para email sem @', () => {
      const errs = validateLoginForm('viacargas', 'emailsemarroba.com', 'senha123');
      expect(errs.email).toBe('E-mail inválido.');
    });

    it('deve retornar erro para email sem domínio', () => {
      const errs = validateLoginForm('viacargas', 'user@', 'senha123');
      expect(errs.email).toBe('E-mail inválido.');
    });

    it('deve aceitar email válido', () => {
      const errs = validateLoginForm('viacargas', 'gestor@empresa.com.br', 'senha123');
      expect(errs.email).toBeUndefined();
    });

    it('deve aceitar email com subdomínio', () => {
      const errs = validateLoginForm('viacargas', 'user@mail.empresa.com', 'senha123');
      expect(errs.email).toBeUndefined();
    });
  });

  describe('Campo senha', () => {
    it('deve retornar erro quando senha está vazia', () => {
      const errs = validateLoginForm('viacargas', 'user@test.com', '');
      expect(errs.password).toBe('Informe a senha.');
    });

    it('deve retornar erro para senha com menos de 6 caracteres', () => {
      const errs = validateLoginForm('viacargas', 'user@test.com', '12345');
      expect(errs.password).toBe('A senha deve ter no mínimo 6 caracteres.');
    });

    it('deve aceitar senha com exatamente 6 caracteres', () => {
      const errs = validateLoginForm('viacargas', 'user@test.com', '123456');
      expect(errs.password).toBeUndefined();
    });

    it('deve aceitar senha com mais de 6 caracteres', () => {
      const errs = validateLoginForm('viacargas', 'user@test.com', 'senhaSegura123!');
      expect(errs.password).toBeUndefined();
    });
  });

  describe('Formulário completo', () => {
    it('não deve retornar erros com dados válidos', () => {
      const errs = validateLoginForm('viacargas', 'gestor@viacargas.com', 'senha123');
      expect(Object.keys(errs)).toHaveLength(0);
    });

    it('deve retornar múltiplos erros quando todos os campos estão vazios', () => {
      const errs = validateLoginForm('', '', '');
      expect(errs.tenant).toBeDefined();
      expect(errs.email).toBeDefined();
      expect(errs.password).toBeDefined();
    });
  });
});
