// src\services\authService.mock.js
async function mockLogin(email, password) {
    // simula delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    if (email === "teste@email.com" && password === "Teste@123") {
      return {
        status: 200,
        data: {
          name: "Usuário Mockado",
          email: email,
          token: "mocked-token-123",
        },
      };
    }
  
    return {
      status: 401,
      error: "Credenciais inválidas",
    };
  }
  
  async function mockGetUserPoints() {
    return {
      status: 200,
      data: {
        points: 200,
        history: [
          { id: 1, title: "QR code lido no balcão", date: "2025-04-01", value: 200 },
        ],
      },
    };
  }
  
module.exports = { mockLogin, mockGetUserPoints };
  