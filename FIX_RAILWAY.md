# 🔧 Fix Railway - Errores Identificados

## ❌ Problemas Encontrados

### 1. SQLite no persiste (Base de datos se pierde)
**Error:** `Error agregando mensaje pendiente`
**Causa:** Railway no persiste archivos por defecto
**Solución:** Configurar volumen persistente

### 2. Google Sheets falla
**Error:** `Error adding to Google Sheets`
**Causa:** Posible problema con formato de `GOOGLE_PRIVATE_KEY`
**Solución:** Verificar formato de la clave privada

---

## ✅ Solución 1: Volumen Persistente para SQLite

### En Railway:

1. **Ve a tu proyecto en Railway**
2. **Click en tu servicio** (leads-whast-meta)
3. **Settings → Volumes**
4. **Click "New Volume"**

**Configuración:**
```
Mount Path: /app/data
Size: 1 GB
```

5. **Save/Create**

Railway hará re-deploy automáticamente (~2 minutos).

### ¿Por qué esto es necesario?

- Railway usa contenedores efímeros
- Cada re-deploy crea un contenedor nuevo
- Los archivos (como `data/leads.db`) se pierden
- Un volumen persiste los datos entre deploys

---

## ✅ Solución 2: Fix Google Sheets

### Problema Común: Formato de GOOGLE_PRIVATE_KEY

Railway puede tener problemas con saltos de línea en variables de entorno.

### Opción A: Usar formato con \n (Recomendado)

En Railway, edita la variable `GOOGLE_PRIVATE_KEY` y usa este formato:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDenoPvGF6mlUCX\nBl5YAmKm2Dyu2NGxFH0o+xhOl1b2+WCdzAsSS2ZJ1R1fLvnH41z1ER09Vzx9gx4m\nttdGT3GmwqjgX4GWhDjLPV+8/Pch7NwRdYUY317HY1Cb1yIMIb3k7ipDCbq8lphX\ncYcc718oSLgT4aYzfF73V5OqLdXbD1nPatAJ46m3d8R7wGf9q2sxi4gJ4lTe82gr\n7pFdzR+xas+zOlWFnUdKomy5aNoddRx4WSQ2BDGHZkq63G7WwcyM5z9b3agA/8sV\nM9M/+ur+zSOBi5DedOAVAzJA0U7sCAriN8+UqiKueXu/eyfuXSRULmyj5mgFOBJv\n07w5+TS3AgMBAAECggEALe/w0qApO9+1jdSDGE8Zs0sQrpXQI2XSc+foeqMxD1Kj\nVLx7lmFXsKmY34DOiyhIEMvgyD0dntq1GJEHOBuBnMMzXOVoVLphC9NU06cxid8a\nBEJHXjwNj0BXrGjGvlEiIcDhmKbD0VGUCwtCsb5VWPc0gOnBxYMHB6wbLPU7WXHd\nc/bFNS2X1WDhJ+0iBE2xFpzrRjWQAhuV4cK4gl5NrvOc+PfFctphX4T2z/zkXUZB\nsrryUfegT3lGKZIK8+GaW02kEhl6ADnC1uX2GYTHLIbX4GQ+eecAFCGL4IS2W/Q1\nNUA3vjDC1iVpdVRsu3hoHk/vYdFbRlXRwYiPB4uTzQKBgQDwzm/XgmWPto6ap3QT\nFhaxVtF5cW0ryNkzgdy372XmPN5ArJQa9d3+/uVqtdJ9XFcYfWbIuxXY3yoHUzPp\nLX2+aGrMQMWI8wrsyHUsILZEAuD7LFcVC5kF2nN9GlTLtCExJuGNd9pTb4Mnv/WI\nYu+ectYm+ZoZ0zwjzdP0/8sDxQKBgQDsqlCFkXtgHIQkisJS0GWv3PEDUf5ojjFM\n735cSvD+/pwGpKdMxROGsOmvlY2D7UdXHJUlH9Jo6olCL9baVil7gy79i8FajDb4\ngV+6czcy6LB0QbRvI0YgOr0jtbf27zMlFV6Wa0k549GooS+8kPssr/cBjN3p0LN0\n9oQDO8JSSwKBgC+56oa/DFwAZaEXQTUrMpIxT9EO/wEnjIzd1x4Jb5vDQpV03uG9\nCyOn51ZP9QjtjUGIUR/FnJ3gFRdgkTBM2NgtH8WdrMjoyqiFTlvRm+4819RQRG4i\nX1C+rBcGafn5mH6CYz/DmlzhBBCTxhki6rTvs6wD2lv19rxt5e1v6Q+1AoGBALlO\nphvfjN31lhZSu9NCL8ziz6gM5IoThFC8WZGEcG0JCTw+Ymy/Bwn4rhF4pUT+XlS8\nIZ/e6c6SjgTQFogA3RxD3GBUtIHktgogqsb//eGTxs5QwCohUYBc3cn/OFtWchKA\nR/65ZK26T2idRRZ94t3bril9lijE7C8R8s3hVcc/AoGAamFhdfd3oNDCqJZibmUD\nTmWIMajhc3GhpapXtcgpFtAbzS8BykpB7S5E7GR6ez4UlUfNTWfJj12xe6OGLcZN\noAEaqJN8uMEJ85MQgvM4EjfsrMEtDfEuAYcl75I5rCOzheEjpRI2wp34F+lclKkg\n2qy0/urrSBqyt06Ng8b78W4=\n-----END PRIVATE KEY-----
```

**IMPORTANTE:**
- Todo en UNA SOLA LÍNEA
- Cada salto de línea reemplazado por `\n`
- Sin espacios extra

### Opción B: Verificar permisos del Sheet

1. Ve a Google Sheets: https://docs.google.com/spreadsheets/d/1AA4KXK8wQK6QI-3feptFPopN_mlztMlfio069IMqzdU
2. Click en **"Compartir"**
3. Verifica que esté compartido con: `leads-distributor@leads-automatizacion-478718.iam.gserviceaccount.com`
4. Permisos: **Editor**

---

## 🚀 Pasos a Seguir (En orden)

### 1. Configurar Volumen (CRÍTICO)
- [ ] Railway → Settings → Volumes
- [ ] New Volume: `/app/data`, 1GB
- [ ] Esperar re-deploy (~2 min)

### 2. Fix Google Sheets (OPCIONAL pero recomendado)
- [ ] Railway → Variables
- [ ] Editar `GOOGLE_PRIVATE_KEY`
- [ ] Usar formato con `\n` (todo en una línea)
- [ ] Esperar re-deploy (~1 min)

### 3. Probar
```bash
curl -X POST https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"field":"leadgen","value":{"leadgen_id":"TEST_FINAL"}}]}]}'
```

### 4. Verificar logs
- Railway → Deployments → Ver logs
- Buscar: "✅ Mensaje pendiente agregado"
- NO debe aparecer: "Error agregando mensaje pendiente"

---

## ✅ Checklist Final

Después de configurar volumen:

- [ ] Railway re-deploy completo
- [ ] No hay errores en logs
- [ ] Base de datos persiste: `curl API/api/stats` muestra mensajes
- [ ] Cliente local recibe mensajes
- [ ] WhatsApp recibe mensajes

---

## 🎯 Resultado Esperado

**Logs de Railway (después del fix):**
```
✅ Lead procesado exitosamente
✅ Mensaje pendiente agregado para VRJ
✅ Base de datos SQLite inicializada
```

**Cliente Local:**
```
📬 1 mensaje(s) pendiente(s) encontrado(s)
📤 Enviando mensaje para lead...
✅ Mensaje enviado y marcado como procesado
```

**WhatsApp:**
```
🆕 NUEVO LEAD - VRJ
👤 Nombre: ...
📱 Teléfono: ...
```

---

## 📞 Si Sigue Fallando

Si después de configurar el volumen aún hay errores:

1. **Ver logs detallados:**
   - Railway → Deployments → Click en deployment
   - Buscar el error exacto

2. **Verificar variables:**
   - Todas las 11 variables configuradas
   - Sin espacios extra
   - `GOOGLE_PRIVATE_KEY` con formato correcto

3. **Re-deploy manual:**
   ```bash
   cd railway-webhook
   git commit --allow-empty -m "Force redeploy"
   git push origin main
   ```

---

**Configura el volumen ahora y avísame cuando termine el re-deploy.**
