# Despliegue por FTP desde GitHub a tu hosting

Este proyecto ya tiene configuracion para CloudLinux Passenger en `.htaccess`:

- `PassengerAppRoot "/home/bcdroovr/public_html/delicias.saborcentral.com"`
- `PassengerStartupFile server.js`

Eso significa que no debes subir el proyecto sin compilar. Debes subir el build de Next.js listo para produccion.

## 1. Sube este proyecto a GitHub

Si todavia no tienes el repositorio:

```bash
git init
git add .
git commit -m "Initial deploy setup"
git branch -M main
git remote add origin TU_REPO_GITHUB
git push -u origin main
```

## 2. Configura los Secrets y Variables en GitHub

En tu repo ve a `Settings > Secrets and variables > Actions`.

### Secrets

- `FTP_HOST`: `216.246.112.85`
- `FTP_USER`: `deploypanaderia@saborcentral.com`
- `FTP_PASS`: tu clave FTP
- `NEXT_PUBLIC_API_BASE_URL`: `https://api.saborcentral.com`

## 3. Workflow listo

Ya quedo creado el archivo:

- `.github/workflows/deploy-ftp.yml`

Ese workflow hace esto:

1. Instala dependencias.
2. Compila el proyecto con `npm run build`.
3. Prepara un paquete de despliegue con:
   - `server.js`
   - `.htaccess`
   - `.next/standalone`
   - `.next/static`
   - `public`
   - `tmp/restart.txt`
4. Lo sube por FTP al hosting.

La carpeta remota ya esta configurada en el workflow:

- `/delicias.saborcentral.com/`

## 4. Como desplegar

Cada push a `main` disparara el deploy automatico.

Tambien puedes lanzarlo manualmente desde:

- `GitHub > Actions > Deploy Next.js to FTP Hosting > Run workflow`

## 5. Verificaciones importantes

- En cPanel, la app Node debe seguir apuntando a:
  - app root: `/home/bcdroovr/public_html/delicias.saborcentral.com`
  - startup file: `server.js`
- La version de Node del hosting debe ser compatible con Next 15. En este workflow se compila con Node 20.
- Si tu dominio aun muestra una version vieja, revisa que Passenger tenga permisos y que el archivo `tmp/restart.txt` se haya subido.

## 6. Que no debes hacer

- No subas `node_modules` local por FTP manualmente.
- No subas `.next` generado en tu PC si no coincide con el entorno del build.
- No despliegues solo el codigo fuente; este hosting necesita el build listo.
