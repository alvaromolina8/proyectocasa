# Servidor de casa

Portátil antiguo (Ryzen 5, 8 GB RAM) con Home Assistant, cámaras propias y un
asistente de voz que funciona **sin nube**: todo el reconocimiento de voz
ocurre dentro de casa.

De momento solo accesible desde la red local. El acceso desde fuera se añade
al final, cuando el resto funcione (ver *Fase 6*).

---

## Qué hay montado

| Servicio | Para qué | Dirección |
|---|---|---|
| Home Assistant | El centro de todo: web, app móvil, automatizaciones | `:8123` |
| Mosquitto | Mensajería entre dispositivos (MQTT) | `:1883` |
| ESPHome | Programa los ESP32 por WiFi | `:6052` |
| Frigate | Graba por movimiento, detecta personas | `:8971` |
| Whisper | Voz → texto | `:10300` |
| Piper | Texto → voz | `:10200` |
| openWakeWord | Escucha la palabra de activación | `:10400` |

Con 8 GB no cabe todo cómodamente a la vez, por eso el `docker-compose.yml`
usa **perfiles**. Reparto aproximado: HA 1 GB, Frigate 2 GB, Whisper 1,5 GB,
ESPHome 2 GB *mientras compila*. Arranca solo lo que estés usando.

---

## Lista de la compra

Empiezas de cero, así que esto es lo mínimo para llegar al resultado que
pediste. Precios orientativos.

**Imprescindible**

- **Cámara con RTSP** — TP-Link Tapo C110 o C120, ~25 €. Es la que de verdad
  vigila: 1080p, visión nocturna infrarroja real, y da H.264 nativo, así que
  Frigate la graba **sin gastar CPU**. Hay que activar "Cuenta de cámara" en
  la app de Tapo para que el RTSP funcione.
- **Micrófono para la voz** — **M5Stack Atom Echo**, ~15 €. Es el satélite
  oficial de Home Assistant: se flashea desde el navegador en 5 minutos y ya
  responde a "oye casa". Sin esto no hay Alexa, solo el botón de la app.

**Para la parte de construir tú**

- **ESP32-CAM AI-Thinker + adaptador USB-TTL**, ~8 € las dos cosas. Compra
  dos o tres: se rompen, se cuelgan y una acaba de repuesto.
- Fuente de alimentación de **5 V y 2 A de verdad**. La mitad de los problemas
  de la ESP32-CAM ("se reinicia sola", "pierde el WiFi") son alimentación
  insuficiente por USB del PC.

**Si luego se queda corto**

- **Google Coral USB**, ~60 €. Descarga la detección de personas de la CPU.
  Con un Ryzen 5 de 4 núcleos no debería hacerte falta hasta las 3-4 cámaras;
  la decodificación por hardware en la Vega integrada (ya configurada) quita
  buena parte del trabajo.
- Un **disco duro aparte** para las grabaciones. Un SSD viejo se desgasta
  rápido escribiendo vídeo 24/7.

**Domótica** (lo que quieras controlar por voz): los enchufes y bombillas
**Shelly** son los que mejor funcionan con Home Assistant — son locales, no
dependen de la nube del fabricante. Evita Tuya barato si puedes.

---

## Montaje por fases

Cada fase deja algo funcionando. No pases a la siguiente hasta que la
anterior vaya.

### Fase 1 — El PC viejo

Instala **Debian 13** sin entorno gráfico (opción "servidor SSH" + "utilidades
estándar"). Ubuntu Server LTS también vale. No instales el escritorio: te come
1 GB de los 8 para nada.

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER    # cierra sesión y vuelve a entrar

# IP fija — hazlo en el router (reserva por MAC), es más fácil de mantener
# que configurarla en el PC.

# Que no se apague al cerrar la tapa, si es un portátil:
sudo sed -i 's/#HandleLidSwitch=suspend/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind
```

Copia esta carpeta al servidor y anota la IP: aparece en varios sitios de
configuración.

### Fase 2 — Home Assistant y MQTT

```bash
cp .env.example .env
nano .env                        # revisa TZ y FRIGATE_MEDIA

# Crea el usuario de MQTT (elige una contraseña y apúntala)
docker run -it --rm -v ./mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2 mosquitto_passwd -c /mosquitto/config/passwd casa

docker compose up -d
```

Abre `http://<ip-servidor>:8123`, crea tu cuenta, y en
**Ajustes → Dispositivos → Añadir integración** busca **MQTT**: host
`<ip-servidor>`, usuario `casa`, la contraseña que pusiste.

Instala la app **Home Assistant** en el móvil y conéctala. Ya tienes el
esqueleto: desde aquí todo lo demás son piezas que se enchufan.

### Fase 3 — Las cámaras

Primero la comercial, que es la que da resultado inmediato:

1. Móntala, actívale "Cuenta de cámara" en la app de Tapo, reserva su IP.
2. Descomenta el bloque `entrada` en `frigate/config/config.yml`, tanto en
   `go2rtc:` como en `cameras:`, y rellena IP y credenciales.
3. Pon también el host y la contraseña MQTT en ese archivo (ojo: ahí va la
   **IP del servidor**, no `mosquitto` — Frigate está en otra red de Docker).
4. `docker compose --profile camaras up -d`
5. La contraseña de admin de Frigate sale en los logs la primera vez:
   `docker compose logs frigate | grep -i password`
6. En HA añade la integración **Frigate**. Ya ves las cámaras y recibes
   notificaciones en el móvil cuando detecte una persona.

Luego la que construyes tú:

1. Prepara los secretos (WiFi, claves) una sola vez:
   ```bash
   cd esphome/config
   cp secrets.yaml.example secrets.yaml
   openssl rand -base64 32        # pega el resultado en api_key
   nano secrets.yaml
   ```
2. Flashea la ESP32-CAM: `docker compose --profile esphome up -d`, entra en
   `:6052`, y usa `esphome/config/camara-taller.yaml` (ajusta la IP fija).
   La primera vez por cable USB-TTL; después por WiFi.
3. Descomenta el bloque `taller` en la config de Frigate.
4. Para de compilar cuando acabes: `docker compose stop esphome`.

### Fase 4 — El asistente de voz

```bash
docker compose --profile voz up -d
```

La primera vez tarda: se descarga el modelo de Whisper (~150 MB) y la voz de
Piper. En HA, **Ajustes → Dispositivos → Añadir integración → Wyoming**, y
añade tres veces apuntando a `<ip-servidor>` puertos `10300`, `10200` y
`10400`.

Luego en **Ajustes → Voz** crea una canalización: Whisper para escuchar,
Piper para hablar. Pruébala con el botón de micrófono de la app móvil.

Para que responda a "oye casa" sin tocar nada, flashea el **Atom Echo** desde
[esphome.io/projects/voice-assistant](https://esphome.io/projects/voice-assistant)
— se hace desde el navegador con la placa enchufada por USB.

> Con la canalización básica el asistente entiende órdenes directas
> ("enciende la luz del salón") pero no conversación libre. Si quieres que
> responda a cualquier cosa, HA puede delegar en un modelo de lenguaje —
> dímelo y lo montamos, pero eso sí sale de casa.

### Fase 5 — Que se vea bonito

Home Assistant **ya es el frontend**: la misma interfaz se adapta sola al
móvil, a la tablet y al navegador del PC. No hay que programar nada.

#### Prototipo web local

También hay una primera versión de una interfaz web independiente en
`frontend/`. Sirve para probar el aspecto y la navegación antes de conectar
dispositivos. Puedes abrir `frontend/index.html` directamente en el navegador
o servirla en la red local para verla desde el móvil u otro ordenador.

En Windows, abre PowerShell en la carpeta `frontend` y ejecuta:

```powershell
py -m http.server 8080 --bind 0.0.0.0
```

Si `py` no está disponible, instala Python 3 o usa el comando equivalente en
Linux:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Deja esa ventana abierta. En el móvil o portátil, conectado a la misma Wi-Fi,
abre `http://<ip-de-este-ordenador>:8080`; la IP local se puede consultar con
`ipconfig` en Windows o `hostname -I` en Linux. Si Windows pregunta por el
cortafuegos, permite el acceso solo en redes privadas. Si no conecta, comprueba
que ambos equipos estén en la misma red y que el router no tenga activado el
aislamiento de clientes. Para parar el servidor, pulsa `Ctrl+C`.

Este servidor de prueba no tiene autenticación: úsalo solo en una red de
confianza y no abras el puerto en el router hacia Internet.

Este prototipo no controla dispositivos reales. Las luces, cámaras, sensores y
consumos muestran datos simulados; sus controles solo cambian la vista en el
navegador. El panel de Home Assistant descrito abajo sigue siendo la interfaz
real del sistema. Más adelante se puede conectar el prototipo a Home Assistant.

Te he dejado un panel preparado en
`homeassistant/config/dashboards/casa.yaml`, con tres pestañas —  Casa,
Cámaras y Servidor — y un tema propio con modo oscuro.

1. Los nombres de entidades del panel (`light.salon`, `camera.entrada`...)
   son inventados: ve sustituyéndolos por los reales según añadas
   dispositivos. Los reales los ves en **Herramientas para desarrolladores →
   Estados**. Hasta entonces salen tarjetas grises, es normal.
2. Activa el tema: tu avatar (abajo a la izquierda) → **Tema → Casa**.
3. En la app del móvil, el mismo panel ya está ahí. Puedes fijarlo como
   pantalla de inicio en **Ajustes → Compañero → Panel**.

Todo el panel usa tarjetas **nativas**, así que funciona nada más arrancar.
Si luego quieres que se vea aún mejor, instala **HACS** (tienda de
complementos de la comunidad) y de ahí:

- **Mushroom** — las tarjetas bonitas que ves en todas las capturas.
- **Bubble Card** — estilo más moderno, con paneles emergentes.
- **Frigate Card** — reproductor de cámaras en condiciones: línea de tiempo,
  cambio entre cámaras, movimiento del ratón. Merece mucho la pena.

> Si lo que quieres es una **pantalla física colgada en la pared**, se hace
> con una tablet vieja (o una de 60 €) en modo quiosco apuntando a este mismo
> panel. Dímelo y te lo configuro: hay un par de trucos para que no se apague
> y para que se despierte al acercarte.

### Fase 6 — Acceso desde fuera

Cuando lo anterior funcione, **Tailscale** es la respuesta: instalas un
paquete en el servidor y la app en el móvil, y accedes desde cualquier sitio
sin abrir un solo puerto del router.

No abras el 8123 al exterior. Cámaras de casa expuestas a internet acaban
indexadas en buscadores de dispositivos.

---

## Comandos del día a día

```bash
docker compose ps                     # qué está corriendo
docker compose logs -f homeassistant  # ver qué pasa
docker compose pull && docker compose up -d   # actualizar
docker stats                          # cuánta RAM está comiendo cada cosa
```

## Cuando algo falle

**La ESP32-CAM se reinicia sola o pierde el WiFi.** Casi siempre es la fuente
de alimentación (necesita 5 V / 2 A reales) o que está lejos del router. Baja
la resolución y los fps antes de darla por muerta.

**Frigate va al 100% de CPU.** Baja `fps` a 5 en `detect`, y asegúrate de que
la cámara RTSP usa `preset-rtsp-restream` (copia el vídeo sin recodificar).
Si es la ESP32-CAM, es lo esperado: transcodificar MJPEG cuesta eso.

**HA no encuentra los dispositivos de la red.** Tiene que estar en
`network_mode: host` — ya lo está en el compose — y el servidor en la misma
red/VLAN que los dispositivos.

**Whisper tarda muchísimo.** Baja a `tiny-int8` en `.env` y reinicia.
