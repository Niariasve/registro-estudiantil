# Registro de Actividades Estudiantiles

Sistema local para registrar estudiantes, clases, actividades/preguntas, puntajes y totales. Está pensado para ejecutarse sin internet desde una computadora local.

## Inicio rápido

1. Instalá Node.js si la computadora no lo tiene.
2. Abrí una terminal en la carpeta del proyecto.
3. Ejecutá:

   ```bash
   npm start
   ```

4. Abrí en el navegador:

   ```text
   http://localhost:3000
   ```

5. Usá la página principal para registrar estudiantes y clases.
6. Entrá a una clase para registrar actividades, puntajes y exportar CSV.

## Qué cubre el sistema

| Necesidad | Estado |
|---|---|
| Funcionar sin internet | Cubierto con servidor local Node.js. |
| Estudiantes compartidos para todas las clases | Cubierto. Los estudiantes se registran una sola vez. |
| Clases tipo `Clase 1`, `Clase 2` | Cubierto. Se pueden crear, modificar y eliminar. |
| Actividades/preguntas por clase | Cubierto. Cada clase tiene sus propias actividades. |
| Puntaje máximo por actividad | Cubierto. Se define al crear o modificar la actividad. |
| Puntaje por estudiante y actividad | Cubierto desde la tabla de cada clase. |
| Total por estudiante | Cubierto. Se calcula automáticamente. |
| Tabla visible aunque no haya actividades | Cubierto. La página de clase muestra estudiantes aunque no existan actividades. |
| Páginas HTML reales | Cubierto: `paginas/index.html` y `paginas/clase.html`. |
| Persistencia en archivo | Cubierto con `data/db.json`. |
| Exportar para Excel | Cubierto con CSV por clase. |

## Uso del sistema

### Página principal

Desde `http://localhost:3000` podés:

- crear, modificar y eliminar clases;
- registrar estudiantes;
- cargar estudiantes en bloque, uno por línea;
- modificar o eliminar estudiantes;
- exportar o importar un respaldo JSON.

### Página de clase

Al ingresar a una clase podés:

- ver todos los estudiantes registrados;
- agregar actividades o preguntas;
- modificar o eliminar actividades;
- ingresar puntajes por estudiante;
- ver el total calculado automáticamente;
- exportar la clase actual como CSV compatible con Excel.

Si modificás el puntaje máximo de una actividad y alguna nota queda por encima del nuevo máximo, el sistema la ajusta al nuevo máximo.

## Persistencia y respaldos

Los datos se guardan en:

```text
data/db.json
```

Ese archivo se crea automáticamente al iniciar el servidor y no se sube a Git.

Para respaldo manual:

- usá **Exportar respaldo** para descargar todos los datos como JSON;
- usá **Importar respaldo** para restaurar ese JSON;
- copiá `data/db.json` si querés respaldar directamente el archivo de datos.

## Estructura del proyecto

```text
index.html                 # redirige a la página principal
server.js                  # servidor local y API de persistencia
package.json               # scripts npm
data/
  db.example.json          # ejemplo de estructura de datos
  db.json                  # datos reales generados localmente
paginas/
  index.html               # página principal
  clase.html               # página de detalle de clase
src/
  css/
    styles.css
  js/
    app.js
    backup.js
    class-detail.js
    classes.js
    storage.js
    students.js
    utils.js
```

## Comandos útiles

```bash
npm start
```

Inicia el sistema en `http://localhost:3000`.

```bash
npm run check
```

Verifica la sintaxis de `server.js`.

## Nota sobre Live Server

VS Code Live Server sirve archivos estáticos, pero no guarda en `data/db.json` porque no ejecuta la API `/api/data`. Para usar persistencia en archivo, usá `npm start`.
