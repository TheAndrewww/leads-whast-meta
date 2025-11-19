// import-leads.js - Script para importar leads históricos de Facebook
require('dotenv').config();
const axios = require('axios');
const whatsappSender = require('./src/services/whatsapp-sender');
const sheetsService = require('./src/services/sheets');
const distributorService = require('./src/services/distributor');
const whatsappClient = require('./src/whatsapp-client');

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_API_VERSION = 'v18.0';

async function getLeadForms(pageId) {
  try {
    console.log(`\n📋 Obteniendo formularios de la página ${pageId}...\n`);

    const response = await axios.get(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}/leadgen_forms`,
      {
        params: {
          access_token: FACEBOOK_ACCESS_TOKEN,
          fields: 'id,name,status,leads_count,created_time'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo formularios:', error.response?.data || error.message);
    throw error;
  }
}

async function getLeadsFromForm(formId, limit = 100) {
  try {
    console.log(`\n📥 Obteniendo leads del formulario ${formId}...\n`);

    const response = await axios.get(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${formId}/leads`,
      {
        params: {
          access_token: FACEBOOK_ACCESS_TOKEN,
          limit: limit
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo leads:', error.response?.data || error.message);
    throw error;
  }
}

async function getLeadData(leadId) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${leadId}`,
      {
        params: {
          access_token: FACEBOOK_ACCESS_TOKEN,
          fields: 'id,created_time,field_data'
        }
      }
    );

    const fieldData = response.data.field_data;

    // Extraer campos
    const getData = (fieldName) => {
      const field = fieldData.find(f =>
        f.name === fieldName ||
        f.name.toLowerCase().includes(fieldName.toLowerCase())
      );
      return field ? field.values[0] : null;
    };

    return {
      id: leadId,
      nombre: getData('full_name') || getData('full name') || getData('name') || 'Sin nombre',
      telefono: getData('número_de_teléfono') || getData('phone_number') || getData('phone') || getData('telefono') || getData('tel') || '',
      ciudad: getData('city') || getData('ciudad') || getData('localidad') || 'No especificada',
      producto: getData('product') || getData('producto') || getData('servicio') || 'CONSULTA',
      created_time: response.data.created_time
    };
  } catch (error) {
    console.error(`Error obteniendo datos del lead ${leadId}:`, error.response?.data || error.message);
    return null;
  }
}

async function processLead(leadData) {
  try {
    // Asignar asesor
    const assignment = await distributorService.assignAsesor();

    // Formatear datos
    const formattedLead = {
      contacto: leadData.nombre,
      telefono: leadData.telefono,
      ciudad: leadData.ciudad,
      producto: leadData.producto,
      fuente: 'FACEBOOK',
      asesor: assignment.asesor,
      status: 'NUEVO',
      fecha_hora: new Date(leadData.created_time).toLocaleString('es-MX')
    };

    console.log(`   📞 ${formattedLead.contacto} - ${formattedLead.telefono} → Asesor: ${formattedLead.asesor}`);

    // Enviar notificaciones a grupos
    const notificationResults = await whatsappSender.sendNotifications(
      formattedLead,
      assignment.grupoAsesor
    );

    // Guardar en Google Sheets
    await sheetsService.appendLead(formattedLead);

    return {
      success: true,
      leadId: leadData.id,
      asesor: assignment.asesor,
      notificationResults
    };

  } catch (error) {
    console.error(`   ❌ Error procesando lead:`, error.message);
    return {
      success: false,
      leadId: leadData.id,
      error: error.message
    };
  }
}

async function main() {
  try {
    console.log('🚀 Importador de Leads Históricos de Facebook\n');
    console.log('='.repeat(60));

    // Verificar que tengamos el Page ID
    const PAGE_ID = process.argv[2];
    const FORM_ID = process.argv[3];
    const LIMIT = process.argv[4] ? parseInt(process.argv[4]) : 100;

    if (!PAGE_ID) {
      console.log('\n❌ Error: Debes proporcionar el Page ID');
      console.log('\nUso:');
      console.log('  node import-leads.js <PAGE_ID>                         # Listar formularios');
      console.log('  node import-leads.js <PAGE_ID> <FORM_ID>               # Importar todos los leads');
      console.log('  node import-leads.js <PAGE_ID> <FORM_ID> <LIMIT>       # Importar N leads');
      console.log('\nEjemplo:');
      console.log('  node import-leads.js 123456789');
      console.log('  node import-leads.js 123456789 987654321');
      console.log('  node import-leads.js 123456789 987654321 5              # Solo últimos 5 leads\n');
      process.exit(1);
    }

    // Si solo se proporciona PAGE_ID, listar formularios
    if (!FORM_ID) {
      const forms = await getLeadForms(PAGE_ID);

      if (forms.length === 0) {
        console.log('\n⚠️  No se encontraron formularios en esta página.\n');
        process.exit(0);
      }

      console.log(`✅ Se encontraron ${forms.length} formularios:\n`);
      forms.forEach((form, index) => {
        console.log(`${index + 1}. ${form.name}`);
        console.log(`   ID: ${form.id}`);
        console.log(`   Estado: ${form.status}`);
        console.log(`   Leads: ${form.leads_count || 0}`);
        console.log(`   Creado: ${new Date(form.created_time).toLocaleString('es-MX')}`);
        console.log('');
      });

      console.log('Para importar leads de un formulario, ejecuta:');
      console.log(`node import-leads.js ${PAGE_ID} <FORM_ID>\n`);
      process.exit(0);
    }

    // Inicializar WhatsApp
    console.log('\n📱 Inicializando WhatsApp...');
    await whatsappClient.initialize();

    // Esperar a que WhatsApp esté listo
    await new Promise(resolve => {
      const checkReady = setInterval(() => {
        if (whatsappClient.isReady) {
          clearInterval(checkReady);
          resolve();
        }
      }, 1000);
    });

    console.log('✅ WhatsApp listo\n');

    // Obtener leads del formulario
    console.log(`📊 Límite de leads a importar: ${LIMIT}\n`);
    const leads = await getLeadsFromForm(FORM_ID, LIMIT);

    if (leads.length === 0) {
      console.log('\n⚠️  No se encontraron leads en este formulario.\n');
      process.exit(0);
    }

    console.log(`✅ Se encontraron ${leads.length} leads para procesar\n`);
    console.log('='.repeat(60));
    console.log('\n🔄 Procesando leads...\n');

    const results = {
      success: 0,
      failed: 0,
      total: leads.length
    };

    // Procesar cada lead
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      console.log(`\n[${i + 1}/${leads.length}] Procesando lead ${lead.id}...`);

      // Obtener datos completos del lead
      const leadData = await getLeadData(lead.id);

      if (!leadData) {
        console.log('   ❌ No se pudo obtener los datos del lead');
        results.failed++;
        continue;
      }

      // Procesar el lead
      const result = await processLead(leadData);

      if (result.success) {
        results.success++;
        console.log(`   ✅ Lead procesado correctamente`);
      } else {
        results.failed++;
      }

      // Esperar 2 segundos entre cada lead para no saturar
      if (i < leads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMEN DE IMPORTACIÓN:\n');
    console.log(`Total de leads:     ${results.total}`);
    console.log(`✅ Exitosos:        ${results.success}`);
    console.log(`❌ Fallidos:        ${results.failed}`);
    console.log('');

    // Mostrar estadísticas de distribución
    const stats = await distributorService.getStats();
    console.log('📈 DISTRIBUCIÓN DE ASESORES:\n');
    console.log(`VRJ:   ${stats.contador.VRJ} leads`);
    console.log(`DLAB:  ${stats.contador.DLAB} leads`);
    console.log(`Total: ${stats.total} leads\n`);

    console.log('='.repeat(60));
    console.log('\n✅ Importación completada!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en la importación:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
