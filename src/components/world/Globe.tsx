'use client';

import { useEffect, useRef, useState } from 'react';
import { containsLonLat, isoOf, parseGeo, rgba, shade, type GeoFeature } from '@/lib/geo';
import { continentVar, type WorldCountry, type WorldData } from '@/lib/world';
import { flagUrl } from '@/lib/format';
import { CountryCard } from './CountryCard';

type Palette = { dark: boolean; sea: string; line: string; hover: string; hoverLine: string; atmosphere: string; gold: string; continents: Record<string, string> };

function readPalette(): Palette {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  const dark = root.dataset.theme !== 'light';
  const continents: Record<string, string> = {};
  for (const c of ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Caribbean', 'Oceania', 'Antarctica']) continents[c] = v(continentVar(c), '#888888');
  return {
    dark,
    sea: v('--map-sea', dark ? '#0c2140' : '#cfe8f7'),
    line: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,35,27,0.4)',
    hover: dark ? '#ffffff' : '#14231b',
    hoverLine: dark ? '#ffffff' : '#14231b',
    atmosphere: dark ? '#6aa7ff' : '#7fc8ff',
    gold: v('--gold', '#d4ae62'),
    continents,
  };
}

/**
 * Interactive 3D globe. Countries are coloured by continent, expedition countries glow gold, a golden
 * spike marks where explorers live. Hover (desktop) or tap (phones) lifts the country, outlines its border
 * and opens a card. Colours follow the light/dark theme live.
 */
export default function Globe({ data }: { data: WorldData }) {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const countries = data.countries;

  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const activeRef = useRef<string | null>(null);
  const pinnedRef = useRef(false);
  const cardHover = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useRef<() => void>(() => {});

  // Stable callbacks used by the WebGL event handlers.
  const api = useRef({
    hover: (iso: string | null) => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      if (pinnedRef.current) return;
      if (iso) setActive(iso);
      else leaveTimer.current = setTimeout(() => !cardHover.current && !pinnedRef.current && setActive(null), 450);
    },
    click: (iso: string | null) => {
      if (iso) {
        pinnedRef.current = true;
        setPinned(true);
        setActive(iso);
      } else if (pinnedRef.current) {
        pinnedRef.current = false;
        setPinned(false);
        setActive(null);
      }
    },
  });

  useEffect(() => {
    activeRef.current = active;
    refresh.current();
  }, [active]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [THREE, { default: ThreeGlobe }, geo] = await Promise.all([
        import('three'),
        import('three-globe'),
        fetch('/countries.geojson').then(async (r) => parseGeo(await r.text())),
      ]);
      if (disposed) return;

      let pal = readPalette();
      const features = geo.features.filter((f) => f.properties.ISO_A2 !== 'AQ');
      const continentOf = (iso: string) => countries[iso]?.continent ?? 'Antarctica';
      const status = (iso: string) => countries[iso]?.expedition?.status;

      const landColor = (iso: string) => {
        const st = status(iso);
        if (st === 'current') return pal.gold;
        const base = pal.continents[continentOf(iso)] ?? '#888';
        return st === 'completed' ? shade(base, pal.dark ? 0.12 : -0.08) : base;
      };
      const isActive = (f: object) => isoOf(f as GeoFeature) === activeRef.current;

      const cap = (f: object) => {
        const iso = isoOf(f as GeoFeature);
        const c = landColor(iso);
        return isActive(f) ? shade(c, pal.dark ? 0.45 : 0.25) : rgba(c, pal.dark ? 0.92 : 0.95);
      };
      const side = (f: object) => (isActive(f) ? pal.gold : 'rgba(0,0,0,0)');
      const stroke = (f: object) => (isActive(f) ? pal.hoverLine : status(isoOf(f as GeoFeature)) ? pal.gold : pal.line);
      const alt = (f: object) => (isActive(f) ? 0.055 : status(isoOf(f as GeoFeature)) === 'current' ? 0.014 : 0.006);

      const globe = new ThreeGlobe()
        .polygonsData(features)
        .polygonCapColor(cap)
        .polygonSideColor(side)
        .polygonStrokeColor(stroke)
        .polygonAltitude(alt)
        .polygonsTransitionDuration(260)
        .showAtmosphere(true)
        .atmosphereColor(pal.atmosphere)
        .atmosphereAltitude(0.16);

      const sea = globe.globeMaterial() as InstanceType<typeof THREE.MeshPhongMaterial>;
      sea.shininess = 4;
      const applySea = () => {
        sea.color = new THREE.Color(pal.sea);
        sea.emissive = new THREE.Color(pal.sea);
        sea.emissiveIntensity = pal.dark ? 0.28 : 0.12;
        sea.specular = new THREE.Color(pal.dark ? '#335577' : '#ffffff');
      };
      applySea();

      // Current expedition: a large flag on a pole — the only marker on the globe.
      const current = Object.values(countries).filter((c) => c.expedition?.status === 'current' && c.lat != null);
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      globe
        .objectsData(current)
        .objectLat((d: object) => (d as WorldCountry).lat as number)
        .objectLng((d: object) => (d as WorldCountry).lng as number)
        .objectAltitude(0.02)
        .objectFacesSurface(false)
        .objectThreeObject((d: object) => {
          const g = new THREE.Group();
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 20, 10), new THREE.MeshBasicMaterial({ color: 0xd4ae62 }));
          pole.position.y = 10;
          const W = 16, H = 10.7;
          const border = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.9, H + 0.9), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
          border.position.set(W / 2 + 0.4, 14.6, -0.05);
          const tex = loader.load(flagUrl((d as WorldCountry).iso2, 320));
          tex.colorSpace = THREE.SRGBColorSpace;
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
          flag.position.set(W / 2 + 0.4, 14.6, 0);
          g.add(pole, border, flag);
          return g;
        });

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.prepend(renderer.domElement);
      renderer.domElement.className = 'block h-full w-full touch-pan-y';
      renderer.domElement.style.cursor = 'grab';

      const scene = new THREE.Scene();
      const ambient = new THREE.AmbientLight(0xffffff, 1);
      const sun = new THREE.DirectionalLight(0xffffff, 1);
      sun.position.set(2, 1.2, 2);
      const fill = new THREE.DirectionalLight(0x9db8ff, 0.5);
      fill.position.set(-2, -1, -1.5);
      scene.add(globe, ambient, sun, fill);
      const applyLights = () => {
        ambient.intensity = pal.dark ? 2.1 : 1.55;
        sun.intensity = pal.dark ? 1.4 : 1.1;
        fill.intensity = pal.dark ? 0.7 : 0.3;
      };
      applyLights();

      const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 1000);
      const fit = () => {
        const aspect = el.clientWidth / el.clientHeight;
        camera.aspect = aspect;
        camera.position.z = aspect < 0.75 ? 440 : aspect < 1.1 ? 365 : 330;
        camera.updateProjectionMatrix();
      };
      fit();

      // An invisible sphere is what we raycast: far more reliable than hitting thousands of polygon meshes.
      const pickSphere = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 48), new THREE.MeshBasicMaterial({ visible: false }));
      globe.add(pickSphere);
      const ray = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pickIso = (clientX: number, clientY: number): string | null => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(pointer, camera);
        let hit;
        try {
          hit = ray.intersectObject(pickSphere, false)[0];
        } catch (err) {
          console.error('[Globe] pick failed', err);
        }
        if (!hit) return null;
        const local = globe.worldToLocal(hit.point.clone());
        const { lat, lng } = (globe as unknown as { toGeoCoords: (c: { x: number; y: number; z: number }) => { lat: number; lng: number } }).toGeoCoords(local);
        for (const f of features) if (containsLonLat(f, lng, lat)) return isoOf(f) || null;
        return null;
      };

      // Start with the current expedition facing the viewer.
      const focus = current[0];
      let rotY = focus ? (-(focus.lng as number) * Math.PI) / 180 + 0.4 : 0;
      let rotX = focus ? Math.max(-0.5, Math.min(0.5, ((focus.lat as number) * Math.PI) / 180 * 0.7)) : 0.2;
      globe.rotation.set(rotX, rotY, 0);

      let dragging = false;
      let moved = false;
      let start = { x: 0, y: 0, ry: 0, rx: 0 };
      let lastIso: string | null = null;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        moved = false;
        start = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX };
        renderer.domElement.style.cursor = 'grabbing';
      };
      const onMove = (e: PointerEvent) => {
        if (dragging) {
          if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 5) moved = true;
          rotY = start.ry + (e.clientX - start.x) * 0.0055;
          rotX = Math.max(-0.7, Math.min(0.7, start.rx + (e.clientY - start.y) * 0.0055));
          return;
        }
        if (e.pointerType !== 'mouse') return;
        const rect = renderer.domElement.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
        const iso = pickIso(e.clientX, e.clientY);
        if ((window as unknown as { __dbg?: boolean }).__dbg) console.log('pick', iso, Math.round(e.clientX), Math.round(e.clientY), typeof (globe as unknown as { toGeoCoords?: unknown }).toGeoCoords);
        if (iso !== lastIso) {
          lastIso = iso;
          api.current.hover(iso && countries[iso] ? iso : null);
        }
        renderer.domElement.style.cursor = iso ? 'pointer' : 'grab';
      };
      const onUp = (e: PointerEvent) => {
        if (dragging && !moved) {
          const iso = pickIso(e.clientX, e.clientY);
          api.current.click(iso && countries[iso] ? iso : null);
        }
        dragging = false;
        renderer.domElement.style.cursor = lastIso ? 'pointer' : 'grab';
      };
      const onLeave = () => {
        if (lastIso) {
          lastIso = null;
          api.current.hover(null);
        }
      };
      const onResize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight);
        fit();
      };
      renderer.domElement.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      renderer.domElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('resize', onResize);

      refresh.current = () => {
        globe.polygonCapColor(cap).polygonSideColor(side).polygonStrokeColor(stroke).polygonAltitude(alt);
      };

      // Re-colour live when the visitor switches light/dark.
      const themeWatcher = new MutationObserver(() => {
        pal = readPalette();
        applySea();
        applyLights();
        globe.atmosphereColor(pal.atmosphere);
        refresh.current();
      });
      themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      let frame = 0;
      let paused = false;
      const io = new IntersectionObserver(([entry]) => (paused = !entry.isIntersecting), { threshold: 0.05 });
      io.observe(el);
      const tick = () => {
        frame = requestAnimationFrame(tick);
        if (paused) return;
        if (!dragging) rotY += activeRef.current ? 0.00025 : 0.0017;
        globe.rotation.y = rotY;
        globe.rotation.x = rotX;
        renderer.render(scene, camera);
      };
      if (stage.current) stage.current.dataset.ready = 'true';
      tick();

      cleanup = () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        themeWatcher.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onDown);
        renderer.domElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('resize', onResize);
        refresh.current = () => {};
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch((e) => console.error('[Globe]', e));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [countries]);

  const country = active ? countries[active] ?? null : null;
  const currentCountry = Object.values(countries).find((c) => c.expedition?.status === 'current') ?? null;

  return (
    <div ref={stage} className="relative h-full w-full" data-testid="globe">
      {/* the canvas is larger than its column so the planet's glow is never clipped */}
      <div ref={host} className="absolute -inset-10" />
      <CountryCard
        country={country}
        pinned={pinned}
        onClose={() => api.current.click(null)}
        onEnter={() => {
          cardHover.current = true;
          if (leaveTimer.current) clearTimeout(leaveTimer.current);
        }}
        onLeave={() => {
          cardHover.current = false;
          if (!pinnedRef.current) api.current.hover(null);
        }}
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5"
      />
      {!country && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-1.5 text-center">
          {currentCountry && (
            <div className="flex items-center gap-2.5 rounded-full border border-line-strong bg-bg/80 px-4 py-2 backdrop-blur">
              <img src={flagUrl(currentCountry.iso2, 80)} alt="" className="h-4 w-6 rounded-[2px] object-cover shadow-sm" />
              <span className="text-[0.8rem] font-medium tracking-wide text-ink">
                Currently on our <span className="text-accent">{currentCountry.name}</span> expedition
              </span>
            </div>
          )}
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">Drag to spin · hover or tap a country</div>
        </div>
      )}
    </div>
  );
}
