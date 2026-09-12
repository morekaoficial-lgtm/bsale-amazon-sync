# Brief de Reapertura — Shopy Enterprise Landing Page

> Usa esto cuando quieras retomar el proyecto. Copia y pega el resumen en el chat.

---

## 1. QUÉ ES ESTO
Landing page estática (HTML + CSS) para **Shopy Enterprise**, distribuidor mayorista B2B de tecnología (Moreka, Nebro, G-Tide). Hosteado en **GitHub Pages**.

- **URL pública**: https://morekaoficial-lgtm.github.io/shopy-enterprise/
- **Repo**: https://github.com/morekaoficial-lgtm/shopy-enterprise
- **Rama**: `main`
- **Archivo raíz**: `index.html` (monolito, ~900 líneas)

---

## 2. ARQUITECTURA DE ARCHIVOS (Local)

```
/root/.openclaw/workspace/
├── index.html                          ← Archivo principal (SOLO ESTE SE PUBLICA)
├── logo-v2.png                         ← Logo transparente RGBA (header)
├── logo.png                            ← Logo viejo RGB (no usar)
│
├── shopy-enterprise-rebuild/           ← Backup/copia de trabajo
│   ├── index.html.bak                  ← Backup original (logos base64 intactos)
│   ├── logo-v2.png                     ← Copia del logo transparente
│   ├── shopy-enterprise-gh-pages/      ← Carpeta con versiones anteriores
│   └── ...
│
└── memory/2026-08-13.md               ← Historia completa del proyecto
```

**IMPORTANTE**: El repo Git está en `/root/.openclaw/workspace/.git/`, no en subcarpetas. Todos los commits/push deben hacerse desde `/root/.openclaw/workspace/`.

---

## 3. CÓMO RETOMAR (Checklist)

### Si solo quieres editar la página:
1. Editar `index.html` en `/root/.openclaw/workspace/`
2. `git add index.html`
3. `git commit -m "feat/fix: ..."`
4. `git push origin main`
5. Esperar 1-2 minutos a que GitHub Pages refresque
6. Verificar en https://morekaoficial-lgtm.github.io/shopy-enterprise/?nocache=1

### Si el logo vuelve a tener problemas de transparencia:
- El logo correcto es `logo-v2.png` (300×90, RGBA color type 6)
- **NO usar PIL/ImageMagick** para redimensionar — destruyen el alpha
- Si necesitas recrearlo, usar el script Python de escritura manual de chunks PNG
- Ver `memory/2026-08-13.md` para la solución técnica completa

---

## 4. DECISIONES TÉCNICAS CLAVE

| Aspecto | Decisión |
|---------|----------|
| Hosting | GitHub Pages (gratuito, automático desde `main`) |
| Logo header | `logo-v2.png` (RGBA transparente) |
| Logos marcas | Base64 embebido en HTML (Moreka, Nebro, G-Tide) |
| Marketplaces | Base64 embebido en HTML (Mercado Libre, Amazon, Walmart, etc.) |
| CSS | Todo en línea dentro de `index.html` (no hay archivos separados) |
| Footer logo | `logo-footer.png` (blanco transparente RGBA) |
| WhatsApp | `+52 56 2616 2867` (actualizado 2026-08-15) |

---

## 5. SECCIONES DE LA PÁGINA

1. **Header/Nav** — Logo transparente + links de navegación
2. **Hero** — Título principal + CTAs
3. **Quiénes Somos** — Historia y stats
4. **Marketplaces Activos** — Logos de plataformas (base64)
5. **Nuestras Marcas** — Tarjetas con logos (base64)
6. **Catálogos** — Links a tiendas (Moreka/Nebro externos; G-Tide en construcción)
7. **Garantías** — Política de garantía
8. **Contacto** — Formulario + WhatsApp
9. **Footer** — Links a tiendas

---

## 6. COSAS QUE SE HAN HECHO

- ✅ WhatsApp actualizado a `+52 56 2616 2867` (2026-08-15)
- ✅ Logo blanco transparente en footer (`logo-footer.png`)
- ✅ Catálogos Moreka y Nebro con enlaces directos a tiendas
- ✅ Catálogo G-Tide marcado como "En Construcción"
- ✅ Landing page responsive con 9 secciones
- ✅ Logo con transparencia real (RGBA manual)
- ✅ Logos de marcas restaurados a base64 originales
- ✅ Formulario de contacto con redirección a WhatsApp
- ✅ Links a catálogos PDF
- ✅ SEO básico (meta tags, alt texts)

---

## 7. IDEAS DE MEJORAS PENDIENTES

- [ ] **Catálogo G-Tide** — Crear página/link cuando esté listo
- [ ] Agregar analytics (Google Analytics o Plausible)
- [ ] Formulario real (no solo redirección a WhatsApp)
- [ ] Galería de productos o catálogo interactivo
- [ ] Blog o sección de noticias
- [ ] Multi-idioma (ES/EN)
- [ ] Dark mode toggle
- [ ] Mejorar performance (lazy loading de imágenes)
- [ ] PWA (Progressive Web App)

---

## 8. COMANDO RÁPIDO PARA VERIFICAR

```bash
cd /root/.openclaw/workspace && \
git log --oneline -5 && \
echo "---" && \
curl -sI https://morekaoficial-lgtm.github.io/shopy-enterprise/ | grep -i "last-modified\|etag"
```

---

## 9. CONTACTO / CUENTAS

- **GitHub**: `morekaoficial-lgtm`
- **Repo**: `shopy-enterprise`
- **Dominio personalizado**: No configurado aún (usa `github.io`)

---

*Actualizado: 2026-08-15*
