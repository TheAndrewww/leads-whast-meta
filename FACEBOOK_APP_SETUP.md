# 📱 Configuración de Facebook App para Leads Reales

## ⚠️ Problema Actual

Tu app de Facebook está en **Modo Desarrollo**, por lo que:
- ❌ NO recibe leads de usuarios regulares
- ✅ SÍ recibe webhooks de prueba desde el panel
- ✅ SÍ recibe leads de administradores/desarrolladores de la app

## 🎯 Soluciones

### Opción 1: Enviar Webhooks de Prueba (Inmediato)

1. Ve a: https://developers.facebook.com
2. Selecciona tu App
3. Ve a **Webhooks** en el menú lateral
4. Encuentra el campo `leadgen`
5. Click en **"Test"** o **"Enviar webhook de prueba"**
6. Selecciona `leadgen`
7. Click **"Send to My Server"**

✅ Esto enviará un lead de prueba a Railway inmediatamente

---

### Opción 2: Agregar Testers (Para Pruebas Realistas)

**Paso 1: Agregar usuarios de prueba**
1. Ve a **Roles** en el menú lateral
2. Click en **"Testers"**
3. Agrega usuarios (pueden ser cuentas de Facebook reales)
4. Esos usuarios aceptan la invitación

**Paso 2: Usar la app con esos usuarios**
- Los usuarios testers SÍ generarán leads reales
- Estos leads SÍ llegarán a tu webhook
- Perfecto para probar antes de publicar

---

### Opción 3: Publicar la App (Producción)

Para recibir leads de CUALQUIER usuario:

#### Requisitos para Publicar:

1. **Configuración Básica Completa:**
   - ✅ Nombre de la app
   - ✅ Categoría
   - ✅ Política de privacidad
   - ✅ Términos de servicio
   - ✅ Icono de la app

2. **Permisos Necesarios:**
   - `leads_retrieval` (para obtener datos de leads)
   - `pages_read_engagement` (para leer engagement)

3. **App Review:**
   - Explicar cómo usarás los datos
   - Demostrar el flujo de la app
   - Video/screenshots del funcionamiento

#### Pasos para Publicar:

**1. Completar Información Básica:**
```
Settings → Basic:
- Display Name: Tu nombre de app
- App Domains: leads-whast-meta-production.up.railway.app
- Privacy Policy URL: URL de tu política
- Category: Business Tools o similar
```

**2. Solicitar Permisos:**
```
App Review → Permissions and Features:
- Request "leads_retrieval"
- Proporcionar:
  * Descripción de uso
  * Screenshots
  * Video demostrativo (opcional)
```

**3. Modo de Desarrollo → Producción:**
```
Settings → Basic:
- App Mode: Development → Live
```

---

## 🚀 Recomendación

**Para desarrollo y pruebas:**
- Usa **Opción 1** (webhooks de prueba desde el panel)
- O **Opción 2** (agrega testers)

**Para producción:**
- Usa **Opción 3** (publica la app)
- Esto permitirá recibir leads de cualquier usuario

---

## ✅ Sistema Ya Está Listo

El webhook y Railway ya están configurados correctamente. Solo necesitas que Facebook envíe los leads:

**URLs Configuradas:**
- Callback URL: `https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads`
- Verify Token: `mitoken123`
- Campo: `leadgen` ✅

**El sistema procesará automáticamente:**
1. Lead llega de Facebook
2. Railway lo procesa
3. Se guarda en Google Sheets
4. Se envía a WhatsApp
5. Se distribuye entre VRJ/DLAB

---

## 🧪 Prueba Manual (Mientras Facebook se configura)

Puedes enviar leads de prueba manualmente con:

```bash
curl -X POST https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "leadgen",
        "value": {
          "leadgen_id": "TEST_LEAD_123"
        }
      }]
    }]
  }'
```

Esto simula un lead de Facebook y verás todo el flujo funcionando.

---

## 📞 Soporte Facebook Developer

Si tienes dudas sobre publicar tu app:
- Documentación: https://developers.facebook.com/docs/app-review
- Soporte: https://developers.facebook.com/support/

---

**El sistema está 100% listo. Solo falta que Facebook envíe los leads reales.**
