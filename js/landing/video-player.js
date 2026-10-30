/* ==========================================================================
   Reproductor de video de la Landing (controles propios, sin librerías)
   ==========================================================================

   Marcado:  landing.html, sección "Video de presentación".
   Estilos:  css/landing/video-player.css (clases .vp-*).
   Textos:   media/cobrar-cliente.subs.js (subtítulos WebVTT).
   Archivos: js/media-store.js (video sin audio, pistas y subtítulos, los sube admin.html).

   El componente crea un `VideoPlayer` y le pasa su propia instancia: el estado
   (`v*`) sigue viviendo en el componente para que la plantilla lo lea, y aquí
   solo se guarda lo que no se pinta (el <video>, la reanudación al cambiar de
   audio). `renderVals()` mezcla lo que devuelve `vals()`. */

(function () {
  const L = window.UnoLanding = window.UnoLanding || {};
  const I = L.icon;

  /* Íconos del reproductor de video. Se crean una sola vez para que el `ref`
     sea estable y solo cambie cuando cambia el estado (play/pausa, volumen). */
  const VP_ICON = {
    play: I('<polygon points="7 4 20 12 7 20 7 4" fill="currentColor"></polygon>'),
    pause: I('<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"></rect>'),
    volHigh: I('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>'),
    volLow: I('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>'),
    volMute: I('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'),
    gear: I('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'),
    fsEnter: I('<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>'),
    fsExit: I('<path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>')
  };

  /* Video y pistas de audio. Los navegadores no permiten elegir pistas de audio
     dentro de un MP4 (`audioTracks` solo existe en Safari), así que el video va
     sin audio (y siempre silenciado) y cada idioma es un archivo de audio que se
     reproduce en un <audio> aparte, siguiendo al video como reloj maestro.
     Los archivos los sube el admin (js/media-store.js); sin ellos se usan los de
     demostración de media/. */
  const MEDIA = window.UnoMedia;
  const VP_VIDEO_DEFAULT = MEDIA.DEFAULTS.video;
  const VP_TRACKS_DEFAULT = MEDIA.DEFAULTS.tracks;
  const VP_DRIFT = 0.25;    /* desfase máximo (s) entre audio y video antes de corregir */

  /* Subtítulos: los que sube el admin o, sin ellos, los de demostración
     (textos en media/cobrar-cliente.subs.js). */
  const VP_SUBS_OFF = { id: 'off', label: 'Desactivados' };
  const VP_SUBS_DEFAULT = MEDIA.DEFAULTS.subs
    .map(s => ({ ...s, vtt: (window.VP_SUBTITLES || {})[s.id] }))
    .filter(s => s.vtt);
  const VP_START = 0;       /* posición inicial de la línea de reproducción */
  const VP_PREVIEW_W = 160; /* ancho del preview al pasar sobre la línea */
  /* Previews de la línea de reproducción: 15 cuadros del video en una sola
     tira (media/cobrar-cliente-previews.jpg), cada uno tomado en el centro de
     su tramo; el puntero elige el cuadro según su posición. */
  const VP_PREVIEW_FRAMES = 15;

  class VideoPlayer {
    /* Estado inicial que el componente mezcla en su `state`. */
    static initialState = { vStarted: false, vPlaying: false, vVolume: 0.8, vMuted: false, vMenu: false, vMenuView: 'root', vVideo: VP_VIDEO_DEFAULT, vTracks: VP_TRACKS_DEFAULT.list, vAudio: VP_TRACKS_DEFAULT.defaultId, vSubList: VP_SUBS_DEFAULT, vSubs: 'off', vCue: '', vNumber: '', vProgress: VP_START, vDuration: 0, vFull: false, vHover: null };

    constructor(host) {
      this.host = host;
      this._urls = [];
      this._audio = new Audio();
      this._audio.preload = 'auto';
      /* Al cargar (o cambiar) la pista, se alinea con el video y retoma si estaba sonando. */
      this._audio.addEventListener('loadedmetadata', () => this.syncAudio(true));
      this._audio.addEventListener('error', () => {
        const prev = this._audioFrom;
        this._audioFrom = null;
        console.warn('[video] No se pudo cargar la pista de audio "' + this.state.vAudio + '": ' + this._audio.src);
        if (prev && prev !== this.state.vAudio && this.track(prev)) this.setAudio(prev);
      });
    }

    track(id) { return this.state.vTracks.find(t => t.id === id); }

    get state() { return this.host.state; }

    setState(update, cb) { this.host.setState(update, cb); }

    videoRef = el => {
      this._video = el;
      if (!el) return;
      el.muted = true;   /* el sonido sale siempre del <audio> */
      if (!el._vpTracks) this.buildTracks(el);
      if (!el._vpSync) this.bindSync(el);
    };

    /* El video manda: el audio lo sigue en play, pausa, búsqueda y buffering. */
    bindSync(v) {
      v._vpSync = true;
      const follow = () => this.syncAudio(!v.paused && !v.ended);
      v.addEventListener('play', follow);
      v.addEventListener('playing', follow);
      v.addEventListener('seeking', () => this.syncAudio(false, true));
      v.addEventListener('seeked', follow);
      v.addEventListener('pause', () => this._audio.pause());
      v.addEventListener('waiting', () => this._audio.pause());
      v.addEventListener('ended', () => this._audio.pause());
      v.addEventListener('ratechange', () => { this._audio.playbackRate = v.playbackRate; });
      v.addEventListener('timeupdate', () => {
        if (!v.paused && Math.abs(this._audio.currentTime - v.currentTime) > VP_DRIFT) this.syncAudio(true);
      });
    }

    /* Lleva el audio a la posición del video. `play` lo reanuda; `keep` conserva
       su estado actual (se usa al buscar, cuando el video sigue o no sonando). */
    syncAudio(play, keep) {
      const v = this._video, a = this._audio;
      if (!v || !a.src || a.readyState < 1) return;
      const t = a.duration ? Math.min(v.currentTime, a.duration) : v.currentTime;
      if (Math.abs(a.currentTime - t) > 0.05) a.currentTime = t;
      if (keep) return;
      if (play && !v.paused && !v.ended) a.play().catch(() => {});
      else a.pause();
    }

    /* Carga la pista elegida en el <audio> (sin pista, queda en silencio). */
    loadAudio(id) {
      const t = this.track(id), a = this._audio;
      const src = t ? t.src : '';
      if (a.getAttribute('src') === src) return;
      a.pause();
      if (src) { a.src = src; a.load(); }
      else { a.removeAttribute('src'); a.load(); }
    }

    /* Lee el video y las pistas del admin; sin archivos subidos usa los de demostración. */
    loadMedia() {
      Promise.all([MEDIA.getVideo(), MEDIA.getTracks(), MEDIA.getSubs()]).catch(e => {
        console.warn('[video] No se pudo leer el almacén de medios, se usan los archivos de demostración.', e);
        return [null, { defaultId: null, list: [] }, { list: [] }];
      }).then(([video, tracks, subs]) => {
        const old = this._urls;
        this._urls = [];
        const url = blob => { if (!blob) return ''; const u = URL.createObjectURL(blob); this._urls.push(u); return u; };
        const vVideo = video
          ? { src: url(video.blob), poster: url(video.poster), previews: url(video.previews) }
          : VP_VIDEO_DEFAULT;
        const list = tracks.list.length
          ? tracks.list.map(t => ({ id: t.id, label: t.label, src: url(t.blob) }))
          : VP_TRACKS_DEFAULT.list;
        const defaultId = tracks.list.length ? tracks.defaultId : VP_TRACKS_DEFAULT.defaultId;
        const keep = list.some(t => t.id === this.state.vAudio);
        const vAudio = keep ? this.state.vAudio : (list.some(t => t.id === defaultId) ? defaultId : (list[0] ? list[0].id : null));
        const vSubList = subs.list.length ? subs.list.map(s => ({ id: s.id, label: s.label, vtt: s.vtt })) : VP_SUBS_DEFAULT;
        const update = { vVideo, vTracks: list, vAudio, vSubList };
        /* Video nuevo: vuelve a la miniatura en el segundo 0. */
        if (vVideo.src !== this.state.vVideo.src) {
          if (this._video) this._video.pause();
          Object.assign(update, { vStarted: false, vPlaying: false, vMenu: false, vProgress: VP_START, vNumber: '', vDuration: 0 });
        }
        this.setState(update, () => {
          if (this._video) this.buildTracks(this._video, vSubList);
          this._audio.removeAttribute('src');   /* fuerza recargar aunque el id no cambie */
          this.loadAudio(vAudio);
          old.forEach(u => URL.revokeObjectURL(u));
        });
      });
    }

    /* Crea una pista de texto por idioma con `addTextTrack` (funciona también en
       file://). Quedan en modo `hidden`: el navegador sigue el tiempo y avisa con
       `cuechange`, pero el texto lo pintamos nosotros con el estilo de la landing.
       Las pistas de `addTextTrack` no se pueden quitar: al recargar los subtítulos
       las anteriores quedan desactivadas y se crean nuevas. */
    buildTracks(v, list = this.state.vSubList) {
      Object.values(v._vpTracks || {}).forEach(t => { t.mode = 'disabled'; });
      v._vpTracks = {};
      list.forEach(s => {
        const track = v.addTextTrack('subtitles', s.label, s.id);
        MEDIA.parseVtt(s.vtt).forEach(([a, b, text]) => track.addCue(new VTTCue(a, b, text)));
        track.mode = 'disabled';
        track.addEventListener('cuechange', () => {
          if (this.state.vSubs !== s.id || v._vpTracks[s.id] !== track) return;
          const cues = Array.from(track.activeCues || []);
          this.setState({ vCue: cues.map(c => c.text.replace(/<[^>]+>/g, '')).join('\n') });
        });
        v._vpTracks[s.id] = track;
      });
      this.applySubs(list.some(s => s.id === this.state.vSubs) ? this.state.vSubs : 'off');
    }

    applySubs(id) {
      const v = this._video;
      if (!v || !v._vpTracks) return;
      Object.keys(v._vpTracks).forEach(k => { v._vpTracks[k].mode = k === id ? 'hidden' : 'disabled'; });
      const track = v._vpTracks[id];
      const cues = track ? Array.from(track.activeCues || []) : [];
      this.setState({ vSubs: id, vCue: cues.map(c => c.text.replace(/<[^>]+>/g, '')).join('\n'), vMenu: false, vMenuView: 'root' });
    }

    /* Cambia el idioma: solo se intercambia el <audio>; el video sigue sin cortes.
       La posición se alinea en `loadedmetadata` de la nueva pista. */
    setAudio(id) {
      if (id !== this.state.vAudio) this._audioFrom = this.state.vAudio;
      this.setState({ vAudio: id, vMenu: false, vMenuView: 'root' });
      this.loadAudio(id);
    }

    setPlaying(play) {
      const v = this._video;
      if (v && v.currentSrc) {
        if (play) {
          v.play().catch(() => this.setState({ vPlaying: false }));
          /* Dentro del clic, para que el navegador permita el sonido. */
          if (this._audio.src) this._audio.play().catch(() => {});
        } else v.pause();
      }
      this.setState({ vStarted: true, vPlaying: play, vMenu: false });
    }

    /* Pantalla completa sobre el contenedor `.vp` (no el <video>) para conservar
       los controles propios. iPhone no la permite en elementos: ahí se usa la
       pantalla completa nativa del video. */
    toggleFullscreen() {
      const v = this._video, box = v && v.parentElement;
      if (!box) return;
      const current = document.fullscreenElement || document.webkitFullscreenElement;
      if (current) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (box.requestFullscreen || box.webkitRequestFullscreen) {
        const p = (box.requestFullscreen || box.webkitRequestFullscreen).call(box);
        if (p && p.catch) p.catch(() => {});
      } else if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();
      }
      this.setState({ vMenu: false });
    }

    setVolume(volume, muted) {
      this._audio.volume = volume;
      this._audio.muted = muted;
      this.setState({ vVolume: volume, vMuted: muted });
    }

    /* Posición (0..1) del puntero sobre la línea de reproducción. */
    seekRatio(e) {
      const r = e.currentTarget.getBoundingClientRect();
      return { ratio: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), x: e.clientX - r.left, width: r.width };
    }

    /* Segundo entero (0..duración) que corresponde a una posición 0..1. */
    secondsAt(ratio) {
      return String(Math.floor(ratio * this.state.vDuration));
    }

    /* Mueve la línea de reproducción y mantiene el input numérico (en segundos) al día.
       `text` permite conservar lo que el usuario está escribiendo en el input. */
    seek(ratio, text) {
      const v = this._video;
      if (v && v.duration) v.currentTime = ratio * v.duration;
      this.setState({ vProgress: ratio, vNumber: text ?? this.secondsAt(ratio) });
    }

    seekFromVideo(ratio) {
      this.setState({ vProgress: ratio, vNumber: this.secondsAt(ratio) });
    }

    /* ---- Ciclo de vida (lo llama el componente) ---- */

    mount() {
      this._audio.volume = this.state.vVolume;
      this._audio.muted = this.state.vMuted;
      this.loadMedia();
      /* Mantiene el ícono al día también al salir con Esc. */
      this._onFullscreen = () => {
        const el = document.fullscreenElement || document.webkitFullscreenElement;
        this.setState({ vFull: !!el && !!this._video && el === this._video.parentElement });
      };
      document.addEventListener('fullscreenchange', this._onFullscreen);
      document.addEventListener('webkitfullscreenchange', this._onFullscreen);
    }

    /* El admin corre en otra pestaña: recarga el video y las pistas al vuelo. */
    onStorage(e) {
      if (e.key === MEDIA.NOTIFY_KEY) this.loadMedia();
    }

    unmount() {
      this._audio.pause();
      this._urls.forEach(u => URL.revokeObjectURL(u));
      document.removeEventListener('fullscreenchange', this._onFullscreen);
      document.removeEventListener('webkitfullscreenchange', this._onFullscreen);
    }

    /* Valores `v*` que lee la plantilla. */
    vals() {
      const { vStarted, vPlaying, vVolume, vMuted, vMenu, vMenuView, vVideo, vTracks, vAudio, vSubs, vCue, vProgress, vHover } = this.state;
      const audio = this.track(vAudio);
      const subMenu = [VP_SUBS_OFF, ...this.state.vSubList];
      const progPct = (vProgress * 100).toFixed(2) + '%';
      const silent = vMuted || vVolume === 0;
      const pct = silent ? 0 : Math.round(vVolume * 100);
      return {
        videoRef: this.videoRef,
        vShowThumb: !vStarted,
        vStarted,
        vMenuOpen: vMenu,
        vMenuExpanded: vMenu ? 'true' : 'false',
        vPlayIcon: vPlaying ? VP_ICON.pause : VP_ICON.play,
        vPlayLabel: vPlaying ? 'Pausar' : 'Reproducir',
        vVolIcon: silent ? VP_ICON.volMute : vVolume < 0.5 ? VP_ICON.volLow : VP_ICON.volHigh,
        vMuteLabel: silent ? 'Activar sonido' : 'Silenciar',
        vGearIcon: VP_ICON.gear,
        vFullIcon: this.state.vFull ? VP_ICON.fsExit : VP_ICON.fsEnter,
        vFullLabel: this.state.vFull ? 'Salir de pantalla completa' : 'Pantalla completa',
        vToggleFull: () => this.toggleFullscreen(),
        vVolPct: pct,
        vVolFill: 'linear-gradient(to right,var(--c-cta) ' + pct + '%,rgba(255,255,255,.35) ' + pct + '%)',
        vMenuRoot: vMenuView === 'root',
        vMenuAudio: vMenuView === 'audio',
        vHasAudio: vTracks.length > 0,
        vAudioLabel: audio ? audio.label : 'Sin audio',
        vAudioOptions: vTracks.map(a => ({
          label: a.label,
          checked: a.id === vAudio ? 'true' : 'false',
          mark: a.id === vAudio ? '✓' : '',
          pick: () => this.setAudio(a.id)
        })),
        vSrc: vVideo.src,
        vPoster: vVideo.poster,
        vThumbBg: vVideo.poster ? 'url(' + vVideo.poster + ') center/cover no-repeat' : '#000',
        vPreviewBg: vVideo.previews ? '#000 url(' + vVideo.previews + ') no-repeat' : '#000',
        vOnMeta: e => {
          const v = e.currentTarget;
          /* Con la duración conocida, el input pasa a trabajar en segundos. */
          if (v.duration) this.setState({ vDuration: v.duration, vNumber: String(Math.floor(v.currentTime)) });
        },
        vOnError: () => console.warn('[video] No se pudo cargar el video: ' + vVideo.src),
        vOpenAudio: () => this.setState({ vMenuView: 'audio' }),
        vOpenSubs: () => this.setState({ vMenuView: 'subs' }),
        vMenuBack: () => this.setState({ vMenuView: 'root' }),
        vMenuSubs: vMenuView === 'subs',
        vSubsLabel: (subMenu.find(s => s.id === vSubs) || VP_SUBS_OFF).label,
        vSubsOptions: subMenu.map(s => ({
          label: s.label,
          checked: s.id === vSubs ? 'true' : 'false',
          mark: s.id === vSubs ? '✓' : '',
          pick: () => this.applySubs(s.id)
        })),
        vShowSubs: vStarted && vSubs !== 'off' && !!vCue,
        vSubtitle: vCue,
        vProgPct: progPct,
        vProgNow: Math.round(vProgress * 100),
        vHovering: !!vHover,
        vHoverPct: vHover ? (vHover.ratio * 100).toFixed(2) + '%' : '0%',
        vPreviewLeft: vHover ? vHover.left + 'px' : '0px',
        vPreviewPos: vHover
          ? (Math.min(VP_PREVIEW_FRAMES - 1, Math.floor(vHover.ratio * VP_PREVIEW_FRAMES)) / (VP_PREVIEW_FRAMES - 1) * 100).toFixed(4) + '% 0'
          : '0 0',
        vSeekMove: e => {
          const { ratio, x, width } = this.seekRatio(e);
          /* El preview se mantiene dentro de la línea, sin salirse por los bordes. */
          const left = Math.max(0, Math.min(width - VP_PREVIEW_W, x - VP_PREVIEW_W / 2));
          this.setState({ vHover: { ratio, left } });
          if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) this.seek(ratio);
        },
        vSeekLeave: () => this.setState({ vHover: null }),
        vSeekDown: e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          this.seek(this.seekRatio(e).ratio);
        },
        vSeekKey: e => {
          const step = { ArrowRight: 0.05, ArrowLeft: -0.05, Home: -1, End: 1 }[e.key];
          if (step === undefined) return;
          e.preventDefault();
          this.seek(Math.max(0, Math.min(1, this.state.vProgress + step)));
        },
        vOnTime: e => {
          const v = e.currentTarget;
          if (!v.duration) return;
          /* No pisamos el input mientras el usuario está escribiendo en él. */
          const typing = document.activeElement && document.activeElement.classList.contains('vp-num');
          if (typing) this.setState({ vProgress: v.currentTime / v.duration });
          else this.seekFromVideo(v.currentTime / v.duration);
        },
        vStart: () => this.setPlaying(true),
        vToggle: () => this.setPlaying(!this.state.vPlaying),
        vOnEnded: () => this.setState({ vPlaying: false }),
        vToggleMute: () => {
          const s = this.state;
          if (s.vMuted || s.vVolume === 0) this.setVolume(s.vVolume || 0.5, false);
          else this.setVolume(s.vVolume, true);
        },
        vOnVolume: e => {
          const volume = Math.max(0, Math.min(1, Number(e.target.value) / 100));
          this.setVolume(volume, volume === 0);
        },
        vToggleMenu: () => this.setState(s => ({ vMenu: !s.vMenu, vMenuView: 'root' })),
        /* Se guarda como texto para permitir el campo vacío mientras se escribe. */
        vNumber: this.state.vNumber,
        vNumMax: Math.floor(this.state.vDuration),
        vOnNumber: e => {
          const raw = e.target.value, dur = this.state.vDuration;
          if (raw === '' || isNaN(Number(raw)) || !dur) { this.setState({ vNumber: raw }); return; }
          const n = Math.max(0, Math.min(Math.floor(dur), Number(raw)));
          this.seek(n / dur, n === Number(raw) ? raw : String(n));
        }
      };
    }
  }

  L.VideoPlayer = VideoPlayer;
})();
