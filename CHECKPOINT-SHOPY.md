# CHECKPOINT — Shopy Enterprise Landing Page

> **Para retomar:** Leer esto → editar → commit → push → listo.

---

## ESTADO ACTUAL ✅

Landing estática hosteada en GitHub Pages. Último commit: `a11edd2` en `main`.
- **URL:** https://morekaoficial-lgtm.github.io/shopy-enterprise/
- **Repo:** `morekaoficial-lgtm/shopy-enterprise`
- **Archivo único:** `/root/.openclaw/workspace/index.html` (~900 líneas, CSS inline)

---

## ARCHIVOS CLAVE

| Archivo | Qué es |
|---------|--------|
| `index.html` | **TODO el sitio.** Monolito HTML+CSS. Editar aquí. |
| `logo-v2.png` | Logo header **transparente RGBA**. Usar este. |
| `logo.png` | ⚠️ Logo viejo RGB (sin transparencia). **NO usar en header.** |
| `shopy-enterprise-rebuild/index.html.bak` | Backup original con logos base64. |

---

## REGLAS DE ORO

1. **Logo del header = `logo-v2.png`** — Es RGBA real (escrito a mano con Python). Si lo redimensionas con PIL/ImageMagick, pierde transparencia.
2. **Logos de marcas = base64 embebido** en `index.html` (Moreka, Nebro, G-Tide). No cambiar a `logo.png`.
3. **Marketplaces = base64 embebido** también.
4. **Repo está en** `/root/.openclaw/workspace/.git/` — hacer commits desde ahí, no desde subcarpetas.

---

## FLUJO DE TRABAJO

```bash
cd /root/.openclaw/workspace
# editar index.html
git add index.html
git commit -m "feat: ..."
git push origin main
# esperar 1-2 min, verificar: https://morekaoficial-lgtm.github.io/shopy-enterprise/?nocache=1
```

---

## SECCIONES DE LA PÁGINA

Header → Hero → Quiénes Somos → Stats → Marketplaces → Marcas → Catálogos → Garantías → Contacto → Footer

---

## ÚLTIMO PROBLEMA RESUELTO

Logo mostraba fondo blanco cuadriculado. Causa: PIL/ImageMagick destruyen alpha PNG al redimensionar. Solución: escribir PNG RGBA manual con Python (`struct` + `zlib`). Ver `memory/2026-08-13.md` para detalles técnicos.

---

## IDEAS PENDIENTES

- Analytics, formulario real, galería de productos, multi-idioma, dark mode, PWA.

---

## ESTADO AL CIERRE ✅

**Fecha de cierre:** 2026-08-13 01:35 CST  
**Último commit:** `a11edd2` — fix: restaurar imágenes base64 originales en tarjetas de marca  
**Estado en GitHub:** Publicado y sincronizado con `origin/main`  
**URL activa:** https://morekaoficial-lgtm.github.io/shopy-enterprise/  

**Verificación:** No hay archivos modificados sin commitear. Todo el trabajo está guardado en el repo.

---

*Checkpoint creado: 2026-08-13. Si haces un cambio significativo, actualizar este archivo.*
