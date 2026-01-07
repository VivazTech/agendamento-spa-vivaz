// Script para gerar hash SHA-256 de uma senha
// Uso: node gerar-hash-senha.js "sua_senha_aqui"

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Pegar senha do argumento da linha de comando
const password = process.argv[2];

if (!password) {
  console.log('Uso: node gerar-hash-senha.js "sua_senha"');
  console.log('\nExemplo:');
  console.log('  node gerar-hash-senha.js "minhaSenha123"');
  process.exit(1);
}

const hash = hashPassword(password);

console.log('\n========================================');
console.log('Senha:', password);
console.log('Hash SHA-256:', hash);
console.log('========================================\n');

console.log('SQL para criar usuário:');
console.log('INSERT INTO public.admins (username, password_hash, name, email, role, is_active)');
console.log('VALUES (');
console.log("    'seu_username',");
console.log(`    '${hash}',`);
console.log("    'Nome do Usuário',");
console.log("    'email@exemplo.com',");
console.log("    'colaborador', -- ou 'admin' ou 'gerente'");
console.log('    true');
console.log(');\n');

