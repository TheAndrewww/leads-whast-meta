# Cómo Redesplegar en Railway

El código ya está actualizado en GitHub, pero Railway no lo ha desplegado automáticamente. Aquí hay 3 formas de solucionarlo:

---

## ✅ OPCIÓN 1: Forzar Redespliegue desde Railway Web (MÁS FÁCIL)

1. Ve a https://railway.app
2. Entra a tu proyecto
3. Ve a la sección "Deployments"
4. Busca el botón **"Deploy"** o **"Redeploy"**
5. Haz click y espera que termine

**Si no ves el botón de Deploy:**
- Ve a "Settings"
- Busca "Source" o "GitHub"
- Verifica que esté conectado al repo: `TheAndrewww/leads-whast-meta`
- **IMPORTANTE**: Verifica que "Root Directory" esté configurado como: `railway-webhook`

---

## ✅ OPCIÓN 2: Usar Railway CLI (RECOMENDADO)

### Paso 1: Login en Railway CLI
Abre tu terminal y ejecuta:
```bash
railway login
```
Esto abrirá tu navegador para autenticarte.

### Paso 2: Ir al directorio correcto
```bash
cd /Users/nicholasandrewguidoarroyo/Downloads/Proyecto\ Leads-automaticos/railway-webhook
```

### Paso 3: Vincular al proyecto
```bash
railway link
```
Selecciona tu proyecto de la lista.

### Paso 4: Desplegar
```bash
railway up
```

Esto subirá el código directamente desde tu máquina a Railway.

### Paso 5: Ver los logs
```bash
railway logs
```

---

## ✅ OPCIÓN 3: Trigger desde GitHub (SI AUTO-DEPLOY ESTÁ HABILITADO)

Si Railway está configurado para auto-deploy, puedes forzar un redespliegue haciendo un pequeño cambio:

```bash
cd /Users/nicholasandrewguidoarroyo/Downloads/Proyecto\ Leads-automaticos

# Hacer un cambio menor (agregar una línea vacía al README)
echo "" >> railway-webhook/README.md

# Commit y push
git add railway-webhook/README.md
git commit -m "Trigger Railway redeploy"
git push origin main
```

Railway debería detectar el push y redesplegar automáticamente en ~30 segundos.

---

## 🔍 Verificar que se desplegó correctamente

Después de redesplegar, verifica:

### 1. Health Check
```bash
curl https://leads-whast-meta-production.up.railway.app/health
```

Deberías ver:
```json
{"status":"ok","service":"railway-webhook","timestamp":"..."}
```

### 2. Ver los logs en Railway
Ve a Railway → Tu proyecto → Logs

Busca estas líneas al inicio (del nuevo deployment):
```
✅ Google Sheets configurado
✅ Tablas de base de datos creadas/verificadas
✅ Base de datos SQLite inicializada
✅ Servidor HTTP corriendo en puerto 8080
📡 Listo para recibir webhooks de Facebook
```

### 3. Probar con un lead de prueba
```bash
curl -X POST https://leads-whast-meta-production.up.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "leadgen_id": "TEST_NUEVO_DEPLOY_123"
        }
      }]
    }]
  }'
```

Ahora los logs serán **MUCHO MÁS DETALLADOS** y te dirán exactamente qué está pasando.

---

## ❓ ¿Qué opción usar?

- **¿Primera vez o urgente?** → Opción 1 (Web)
- **¿Tienes Railway CLI instalado?** → Opción 2 (CLI)
- **¿Railway ya está conectado a GitHub?** → Opción 3 (Git push)

---

## 🆘 Si nada funciona

Comparte:
1. Screenshot de Railway → Settings → Source
2. Screenshot de Railway → Deployments (el estado actual)
3. Cualquier error que veas en los logs de Railway

Y te ayudaré a diagnosticar el problema específico.
