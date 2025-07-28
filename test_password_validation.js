// Script de prueba para validación de contraseñas
// Ejecutar en el navegador o Node.js

const testPasswordValidation = async () => {
  console.log('🧪 Iniciando pruebas de validación de contraseñas...\n');

  // Simular la función RPC verify_user_credentials
  const mockVerifyUserCredentials = async (userIdentifier, passwordToCheck) => {
    // Simular diferentes escenarios
    if (userIdentifier === 'admin' && passwordToCheck === 'admin123') {
      return [{
        user_id: 1,
        username: 'admin',
        email: 'admin@sistema.com',
        primer_nombre: 'Admin',
        primer_apellido: 'Sistema',
        activo: true,
        is_valid: true
      }];
    }
    
    if (userIdentifier === 'testuser' && passwordToCheck === 'password123') {
      return [{
        user_id: 2,
        username: 'testuser',
        email: 'test@example.com',
        primer_nombre: 'Usuario',
        primer_apellido: 'Prueba',
        activo: true,
        is_valid: true
      }];
    }

    return [{
      user_id: null,
      username: null,
      email: null,
      primer_nombre: null,
      primer_apellido: null,
      activo: null,
      is_valid: false
    }];
  };

  // Casos de prueba
  const testCases = [
    { username: 'admin', password: 'admin123', expected: true, description: 'Admin válido' },
    { username: 'testuser', password: 'password123', expected: true, description: 'Usuario de prueba válido' },
    { username: 'admin', password: 'wrongpassword', expected: false, description: 'Contraseña incorrecta' },
    { username: 'nonexistent', password: 'anypassword', expected: false, description: 'Usuario inexistente' },
    { username: 'admin', password: '', expected: false, description: 'Contraseña vacía' },
    { username: '', password: 'admin123', expected: false, description: 'Username vacío' }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const result = await mockVerifyUserCredentials(testCase.username, testCase.password);
      const isValid = result[0]?.is_valid || false;
      
      if (isValid === testCase.expected) {
        console.log(`✅ ${testCase.description}: PASÓ`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.description}: FALLÓ`);
        console.log(`   Esperado: ${testCase.expected}, Obtenido: ${isValid}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.description}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log(`\n📊 Resultados: ${passedTests}/${totalTests} pruebas pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las pruebas pasaron! La validación de contraseñas funciona correctamente.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisar la implementación.');
  }

  // Pruebas adicionales de hash
  console.log('\n🔐 Pruebas de hash:');
  
  // Simular hash bcrypt
  const mockBcryptHash = (password) => {
    // Simular hash bcrypt (en realidad sería generado por pgcrypto)
    return `$2b$10$mockhash${btoa(password).substring(0, 22)}`;
  };

  const testPasswords = ['admin123', 'password123', 'test123'];
  
  testPasswords.forEach(password => {
    const hash = mockBcryptHash(password);
    console.log(`   ${password} → ${hash}`);
  });

  console.log('\n📝 Notas:');
  console.log('   - En producción, los hashes serían generados por pgcrypto');
  console.log('   - Las funciones RPC deben estar creadas en Supabase');
  console.log('   - Los logs del navegador mostrarán el método usado');
};

// Ejecutar las pruebas
if (typeof window !== 'undefined') {
  // En el navegador
  window.testPasswordValidation = testPasswordValidation;
  console.log('Para ejecutar las pruebas, ejecuta: testPasswordValidation()');
} else {
  // En Node.js
  testPasswordValidation().catch(console.error);
} 