const request = require('supertest');
const app = require('../server'); // Supondo que o server exporta o app

describe('Usuarios API', () => {
  it('deve falhar ao cadastrar com domínio inválido', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        nome: 'Teste',
        email: 'teste@gmail.com',
        matricula: '123456',
        senha: 'password123',
        perfil_tipo: 'estudante'
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DOMINIO_INVALIDO');
  });

  it('deve falhar ao verificar com token inválido', async () => {
    const res = await request(app)
      .post('/api/usuarios/verificar-email')
      .send({
        email: 'teste@unibrasil.com.br',
        token: '000000'
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOKEN_INVALIDO');
  });
});
