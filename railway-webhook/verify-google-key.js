#!/usr/bin/env node
/**
 * Script para verificar que la GOOGLE_PRIVATE_KEY está correctamente formateada
 * Uso: cd railway-webhook && node verify-google-key.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verificador de GOOGLE_PRIVATE_KEY\n');
console.log('='.repeat(50));

// Leer desde RAILWAY_ENV_VARIABLES.txt (en el directorio padre)
const filePath = path.join(__dirname, '..', 'RAILWAY_ENV_VARIABLES.txt');

if (!fs.existsSync(filePath)) {
  console.error('❌ No se encontró RAILWAY_ENV_VARIABLES.txt');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');

// Extraer la private key
const keyMatch = content.match(/GOOGLE_PRIVATE_KEY=(-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----)/);

if (!keyMatch) {
  console.error('❌ No se encontró GOOGLE_PRIVATE_KEY en el archivo');
  process.exit(1);
}

const privateKey = keyMatch[1];

console.log('✅ Private key encontrada\n');

// Verificaciones
const checks = [];

// 1. Comienza correctamente
if (privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
  checks.push({ name: 'Comienza con BEGIN', status: true });
} else {
  checks.push({ name: 'Comienza con BEGIN', status: false });
}

// 2. Termina correctamente
if (privateKey.endsWith('-----END PRIVATE KEY-----')) {
  checks.push({ name: 'Termina con END', status: true });
} else {
  checks.push({ name: 'Termina con END', status: false });
}

// 3. Tiene saltos de línea reales
const hasRealNewlines = privateKey.includes('\n');
checks.push({ name: 'Tiene saltos de línea reales', status: hasRealNewlines });

// 4. NO tiene \n como texto
const hasEscapedNewlines = privateKey.includes('\\n');
checks.push({ name: 'NO tiene \\n escapados', status: !hasEscapedNewlines });

// 5. Longitud aproximada correcta
const keyLength = privateKey.length;
const isValidLength = keyLength > 1600 && keyLength < 1800;
checks.push({ name: `Longitud válida (${keyLength} caracteres)`, status: isValidLength });

// Mostrar resultados
console.log('Verificaciones:');
checks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
});

console.log('\n' + '='.repeat(50));

const allPassed = checks.every(c => c.status);

if (allPassed) {
  console.log('\n✅ ¡TODO CORRECTO! La key está bien formateada');
  console.log('\nPara Railway, copia TODO el bloque (incluyendo BEGIN y END):');
  console.log('\n' + privateKey.split('\n').slice(0, 3).join('\n'));
  console.log('...');
  console.log(privateKey.split('\n').slice(-2).join('\n') + '\n');
} else {
  console.log('\n❌ HAY PROBLEMAS con la key');
  console.log('\nSoluciones:');

  if (!checks[0].status) {
    console.log('- La key debe empezar con "-----BEGIN PRIVATE KEY-----"');
  }
  if (!checks[1].status) {
    console.log('- La key debe terminar con "-----END PRIVATE KEY-----"');
  }
  if (!checks[2].status) {
    console.log('- La key debe tener saltos de línea reales (no \\n como texto)');
  }
  if (checks[3].status === false) {
    console.log('- La key NO debe tener \\n como texto, deben ser saltos de línea reales');
    console.log('- En Railway, pega el bloque completo sin modificar');
  }
  if (!checks[4].status) {
    console.log('- La longitud parece incorrecta, verifica que esté completa');
  }
}

// Intentar parsear la key
console.log('\n' + '='.repeat(50));
console.log('\n🧪 Intentando crear JWT con la key...\n');

try {
  const { JWT } = require('google-auth-library');

  const auth = new JWT({
    email: 'leads-distributor@leads-automatizacion-478718.iam.gserviceaccount.com',
    key: privateKey.replace(/\\n/g, '\n'), // Asegurar saltos de línea
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  console.log('✅ JWT creado exitosamente');
  console.log('✅ La key es válida para Google API\n');

} catch (error) {
  console.error('❌ Error creando JWT:', error.message);
  console.log('\n⚠️  La key puede no ser válida para Google API');
  console.log('Verifica que:');
  console.log('1. La key está completa');
  console.log('2. No hay caracteres extra o faltantes');
  console.log('3. Los saltos de línea son correctos\n');
}

console.log('='.repeat(50) + '\n');
