// Importar dependências
const express = require('express');
// const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

// Criar aplicação Express
const app = express();
const PORT = 3000;

// Configurar middlewares
app.use(cors({
  origin: true, // Permite todas origens
  credentials: true
}));
app.use(express.json());

// Configuração da conexão com o MySQL
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',        // Altere para seu usuário MySQL
//   password: '',
//   database: 'prova'   // Nome do banco 
// });

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Conectado ao banco SQLite.');
});

// // Conectar ao banco de dados
// connection.connect(err => {
//   if (err) {
//     // console.error('Erro ao conectar ao MySQL:', err);
//     return;
//   }
//   console.log('Conectado ao banco de dados MySQL!');
// });

app.get('/teste', async (req, res) => {
  
})

// Endpoint para criar novo usuário
app.post('/usuarios', async (req, res) => {
  const { login, senha } = req.body;


  // Validação básica
  if (!login || !senha) {
    return res.status(400).json({ erro: 'Login e senha são obrigatórios' });
  }

  try {
    // Gerar hash da senha com bcrypt
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Inserir usuário no banco
    db.run(
      'INSERT INTO usuarios (login, senha) VALUES (?, ?)',
      [login, senhaHash],
      (err, results) => {
        if (err) {
          // Verificar se o erro é de login duplicado
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Este login já está em uso' });
          }
          console.error('Erro ao cadastrar usuário:', err);
          return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
        }

        res.status(201).json({
          mensagem: 'Usuário cadastrado com sucesso',
          id: results.insertId
        });
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Endpoint para autenticar usuário
app.post('/login', (req, res) => {
  const { login, senha } = req.body;

  // Validação básica
  if (!login || !senha) {
    return res.status(400).json({ erro: 'Login e senha são obrigatórios' });
  }

  // Buscar usuário pelo login
  connection.query(
    'SELECT * FROM usuarios WHERE login = ?',
    [login],
    async (err, results) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ erro: 'Erro ao autenticar' });
      }

      // Verificar se encontrou um usuário
      if (results.length === 0) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
      }

      const usuario = results[0];

      // Comparar a senha fornecida com o hash armazenado
      try {
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
          return res.status(401).json({ erro: 'Credenciais inválidas' });
        }

        // GERAR TOKEN JWT
        const token = jwt.sign(
          { id: usuario.id },
          'seuSegredoSuperSecreto', // Altere para uma chave segura
          { expiresIn: '1h' }
        );

        // Remover a senha antes de enviar a resposta
        const { senha: _, ...usuarioSemSenha } = usuario;
        res.json({
          mensagem: 'Login realizado com sucesso',
          usuario: usuarioSemSenha,
          token: token // Enviar o token JWT
        });
      } catch (error) {
        console.error('Erro ao verificar senha:', error);
        res.status(500).json({ erro: 'Erro ao autenticar' });
      }
    }
  );
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
