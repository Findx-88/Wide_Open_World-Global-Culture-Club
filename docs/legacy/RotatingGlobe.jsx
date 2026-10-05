'use client';

import { useEffect, useRef, useState } from 'react';
import { COUNTRY_INFO } from '../data/country-info';
import { FEATURED_BOOKS } from '../data/books-data';

const ACTIVE_COUNTRY = { lat: 32.4279, lng: 53.6880, name: 'Iran', matchName: 'Iran', iso2: 'ir' };

const GOLD = '#C9A052';
const GOLD_BRIGHT = '#E4C07A';
const GOLD_DIM = 'rgba(201,160,82,0.16)';
const FILL_DIM = 'rgba(20,40,30,0.55)';
const FILL_ACTIVE = 'rgba(201,160,82,0.14)';
const FILL_HOVER = 'rgba(201,160,82,0.22)';

const ISO_A2_OVERRIDES = {
  'France': 'FR', 'Norway': 'NO', 'N. Cyprus': 'CY', 'Somaliland': 'SO'
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (typeof window.ThreeGlobe !== 'undefined' || typeof window.THREE !== 'undefined') {
          clearInterval(poll);
          resolve();
        }
        if (tries > 50) { clearInterval(poll); resolve(); }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function drawFlagCanvas(iso2) {
  const c = document.createElement('canvas');
  c.width = 300; c.height = 200;
  const ctx = c.getContext('2d');
  if (iso2 === 'ir') {
    const s = c.height / 3;
    ctx.fillStyle = '#239F40'; ctx.fillRect(0, 0, c.width, s);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, s, c.width, s);
    ctx.fillStyle = '#DA0001'; ctx.fillRect(0, 2 * s, c.width, s);
    const dash = c.width / 24;
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#239F40' : '#DA0001';
      ctx.fillRect(i * dash, s - 4, dash, 8);
      ctx.fillStyle = (i % 2 === 0) ? '#DA0001' : '#239F40';
      ctx.fillRect(i * dash, 2 * s - 4, dash, 8);
    }
    const cx = c.width / 2, cy = c.height / 2;
    ctx.save(); ctx.translate(cx, cy);
    ctx.strokeStyle = '#DA0001'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#DA0001';
    ctx.fillRect(-3, -22, 6, 44);
    ctx.fillRect(-14, -4, 28, 6);
    for (let a = 0; a < 4; a++) {
      ctx.save(); ctx.rotate(a * Math.PI / 2);
      ctx.fillStyle = '#DA0001';
      ctx.beginPath(); ctx.ellipse(0, -13, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#C9A052';
    ctx.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

function isoForFeature(feature) {
  const props = feature.properties;
  let iso = props.ISO_A2;
  if (!iso || iso === '-99' || iso === '-') {
    iso = ISO_A2_OVERRIDES[props.NAME] || null;
  }
  return iso ? iso.toLowerCase() : null;
}

function flagImageUrl(iso2, width) {
  if (!iso2) return null;
  return `https://flagcdn.com/w${width}/${iso2}.png`;
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function findFeatureAtLatLng(polygonFeatures, lat, lng) {
  for (const feature of polygonFeatures) {
    const geom = feature.geometry;
    if (!geom) continue;
    const polygons = geom.type === 'Polygon' ? [geom.coordinates]
      : geom.type === 'MultiPolygon' ? geom.coordinates
      : null;
    if (!polygons) continue;
    for (const poly of polygons) {
      if (poly.length && pointInRing(lng, lat, poly[0])) {
        return feature;
      }
    }
  }
  return null;
}

function findCountryHit(intersects, Globe) {
  for (const i of intersects) {
    let obj = i.object;
    while (obj && obj !== Globe) {
      if (obj.__data && obj.__data.properties && obj.__data.properties.NAME) {
        return obj.__data;
      }
      obj = obj.parent;
    }
  }
  return null;
}

function CountryTooltip({ hoveredCountry, tooltipRef }) {
  const [localTime, setLocalTime] = useState('');
  const [activeContent, setActiveContent] = useState(null);

  useEffect(() => {
    if (hoveredCountry) {
      setActiveContent(hoveredCountry);
    }
  }, [hoveredCountry]);

  useEffect(() => {
    if (!activeContent || typeof activeContent.utcOffset !== 'number') return;

    const updateTime = () => {
      const offset = activeContent.utcOffset;
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const localMs = utcMs + offset * 3600000;
      const local = new Date(localMs);
      let h = local.getHours();
      const m = local.getMinutes();
      const s = local.getSeconds();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      const mStr = String(m).padStart(2, '0');
      const sStr = String(s).padStart(2, '0');
      const offsetLabel = (offset >= 0 ? '+' : '') + offset;
      setLocalTime(`${h}:${mStr}:${sStr} ${ampm} (UTC${offsetLabel})`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeContent]);

  const isShown = !!hoveredCountry;
  const content = activeContent || hoveredCountry;

  if (!content) return (
    <div
      ref={tooltipRef}
      className="globe-tooltip"
      style={{
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );

  const { name, flagUrl, info, featuredBook } = content;

  return (
    <div
      ref={tooltipRef}
      className={`globe-tooltip ${isShown ? 'show' : ''}`}
      style={{
        opacity: isShown ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.15s ease',
      }}
    >
      <div className="globe-tooltip-header">
        {flagUrl && (
          <img
            className="globe-tooltip-flag"
            src={flagUrl}
            alt={`${name} flag`}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div>
          <div className="globe-tooltip-name">{name}</div>
          {info?.epithet && (
            <div className="globe-tooltip-epithet">{info.epithet}</div>
          )}
        </div>
      </div>

      <div className="globe-tooltip-rows">
        <div className="globe-tooltip-row">
          <span className="globe-tooltip-label">Capital</span>
          <span className="globe-tooltip-value">{info?.capital || '—'}</span>
        </div>
        <div className="globe-tooltip-row">
          <span className="globe-tooltip-label">Currency</span>
          <span className="globe-tooltip-value">{info?.currency || '—'}</span>
        </div>
        <div className="globe-tooltip-row">
          <span className="globe-tooltip-label">Language</span>
          <span className="globe-tooltip-value">{info?.language || '—'}</span>
        </div>
        <div className="globe-tooltip-row">
          <span className="globe-tooltip-label">Local Time</span>
          <span className="globe-tooltip-value globe-tooltip-time">{localTime || '—'}</span>
        </div>
      </div>

      {featuredBook && (
        <div className="globe-tooltip-expedition">
          <div className={`globe-tooltip-exp-badge ${featuredBook.status}`}>
            {featuredBook.status} Expedition
          </div>
          <div className="globe-tooltip-row">
            <span className="globe-tooltip-label">Book</span>
            <span className="globe-tooltip-value" style={{ fontStyle: 'italic' }}>
              {featuredBook.title}
            </span>
          </div>
          {featuredBook.movieTitle && (
            <div className="globe-tooltip-row">
              <span className="globe-tooltip-label">Film</span>
              <span className="globe-tooltip-value" style={{ fontStyle: 'italic' }}>
                {featuredBook.movieTitle}
              </span>
            </div>
          )}
          {featuredBook.speaker && (
            <div className="globe-tooltip-row">
              <span className="globe-tooltip-label">Friend</span>
              <span className="globe-tooltip-value">{featuredBook.speaker}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RotatingGlobe() {
  const containerRef = useRef(null);
  const mountedRef = useRef(false);
  const tooltipRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    let animId;
    let rendererRef = null;
    let resizeHandler;
    let onDown, onMove, onUp, onLeave;
    const container = containerRef.current;
    if (!container) return;

    async function init() {
      try {
        if (typeof window.THREE === 'undefined') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }
        if (typeof window.ThreeGlobe === 'undefined') {
          await loadScript('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/dist/three-globe.min.js');
        }
        if (!mountedRef.current) return;

        const THREE = window.THREE;
        const ThreeGlobe = window.ThreeGlobe;

        const resp = await fetch('/countries.geojson');
        const COUNTRIES_GEOJSON = await resp.json();
        if (!mountedRef.current) return;

        let hoveredFeature = null;

        const polygonFeatures = COUNTRIES_GEOJSON.features.filter(
          d => d.properties.ISO_A2 !== 'AQ'
        );

        function polyCap(d) {
          if (d === hoveredFeature) return FILL_HOVER;
          return d.properties.NAME === ACTIVE_COUNTRY.matchName ? FILL_ACTIVE : FILL_DIM;
        }
        function polyStroke(d) {
          if (d === hoveredFeature) return GOLD_BRIGHT;
          return d.properties.NAME === ACTIVE_COUNTRY.matchName ? GOLD_BRIGHT : GOLD_DIM;
        }
        function polyAlt(d) {
          return d === hoveredFeature ? 0.012 : 0.005;
        }

        // ── Globe object ──
        const Globe = new ThreeGlobe()
          .globeMaterial(new THREE.MeshPhongMaterial())
          .polygonsData(polygonFeatures)
          .polygonCapColor(polyCap)
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonStrokeColor(polyStroke)
          .polygonAltitude(polyAlt)
          .polygonsTransitionDuration(200)
          .showAtmosphere(true)
          .atmosphereColor(GOLD)
          .atmosphereAltitude(0.16);

        Globe.globeMaterial().color = new THREE.Color('#0A1410');
        Globe.globeMaterial().emissive = new THREE.Color('#0A1410');
        Globe.globeMaterial().emissiveIntensity = 0.12;
        Globe.globeMaterial().shininess = 0.5;

        // ── Ring pulse on Iran ──
        Globe
          .ringsData([{ lat: ACTIVE_COUNTRY.lat, lng: ACTIVE_COUNTRY.lng, size: 1 }])
          .ringColor(() => t => `rgba(228,192,122,${1 - t})`)
          .ringMaxRadius('size')
          .ringPropagationSpeed(2.2)
          .ringRepeatPeriod(1700)
          .ringResolution(64);

        // ── Flag marker ──
        function makeFlagMarker(iso2) {
          const group = new THREE.Object3D();
          const poleGeom = new THREE.CylinderGeometry(0.22, 0.22, 9, 8);
          const poleMat = new THREE.MeshBasicMaterial({ color: 0xC9A052 });
          const pole = new THREE.Mesh(poleGeom, poleMat);
          pole.position.y = 4.5;
          group.add(pole);
          const flagCanvas = drawFlagCanvas(iso2);
          const texture = new THREE.CanvasTexture(flagCanvas);
          const flagW = 7.2, flagH = 4.6;
          const flagGeom = new THREE.PlaneGeometry(flagW, flagH);
          const flagMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
          const flagMesh = new THREE.Mesh(flagGeom, flagMat);
          flagMesh.position.set(flagW / 2 + 0.3, 7.3, 0);
          group.add(flagMesh);
          const baseGeom = new THREE.CircleGeometry(1.6, 16);
          const baseMat = new THREE.MeshBasicMaterial({ color: 0xE4C07A, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
          const base = new THREE.Mesh(baseGeom, baseMat);
          base.rotation.x = -Math.PI / 2;
          group.add(base);
          return group;
        }

        Globe
          .objectsData([{ lat: ACTIVE_COUNTRY.lat, lng: ACTIVE_COUNTRY.lng, alt: 0.01 }])
          .objectLat('lat')
          .objectLng('lng')
          .objectAltitude('alt')
          .objectThreeObject(() => makeFlagMarker(ACTIVE_COUNTRY.iso2))
          .objectFacesSurface(false);

        // ── Renderer ──
        const w = container.clientWidth;
        const h = container.clientHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef = renderer;
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // ── Scene & camera ──
        const scene = new THREE.Scene();
        scene.add(Globe);

        const ambientLight = new THREE.AmbientLight(0x405040, 1.4);
        const dirLight = new THREE.DirectionalLight(GOLD, 0.55);
        dirLight.position.set(1, 1, 1);
        const dirLight2 = new THREE.DirectionalLight('#3A9B5E', 0.25);
        dirLight2.position.set(-1, -0.5, -1);
        scene.add(ambientLight, dirLight, dirLight2);

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        const updateCameraZ = (width, height, cam) => {
          const aspect = width / height;
          if (aspect < 0.6) {
            cam.position.z = 420; // Mobile
          } else if (aspect < 1.0) {
            cam.position.z = 340; // Tablet
          } else {
            cam.position.z = 270; // Desktop
          }
        };
        updateCameraZ(w, h, camera);

        // ── Controls & State ──
        let rotationY = 0;
        let rotationX = 0.18;
        const MIN_TILT = -0.5, MAX_TILT = 0.5;
        const baseSpeed = 0.0016;
        let isDragging = false;
        let isHovering = false;
        let dragStartX, dragStartY, dragStartRotY, dragStartRotX;

        const raycaster = new THREE.Raycaster();

        onDown = function(e) {
          isDragging = true;
          isHovering = false;
          if (hoveredFeature !== null) {
            hoveredFeature = null;
            Globe.polygonCapColor(polyCap).polygonStrokeColor(polyStroke).polygonAltitude(polyAlt);
            setHoveredCountry(null);
          }
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;
          dragStartX = cx; dragStartY = cy;
          dragStartRotY = rotationY; dragStartRotX = rotationX;
        };

        onMove = function(e) {
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;

          if (isDragging) {
            rotationY = dragStartRotY + (cx - dragStartX) * 0.005;
            rotationX = Math.max(MIN_TILT, Math.min(MAX_TILT, dragStartRotX + (cy - dragStartY) * 0.005));
            Globe.rotation.y = rotationY;
            Globe.rotation.x = rotationX;
            return;
          }

          const rect = container.getBoundingClientRect();
          const inside = (
            cx >= rect.left && cx <= rect.right &&
            cy >= rect.top && cy <= rect.bottom
          );

          if (!inside) {
            if (isHovering) {
              isHovering = false;
              if (hoveredFeature !== null) {
                hoveredFeature = null;
                Globe.polygonCapColor(polyCap).polygonStrokeColor(polyStroke).polygonAltitude(polyAlt);
                setHoveredCountry(null);
              }
            }
            return;
          }

          const x = cx - rect.left;
          const y = cy - rect.top;

          if (tooltipRef.current) {
            const clampedX = Math.max(120, Math.min(rect.width - 120, x));
            const clampedY = Math.max(140, y);
            tooltipRef.current.style.left = `${clampedX}px`;
            tooltipRef.current.style.top = `${clampedY}px`;
          }

          const mouse = new THREE.Vector2();
          mouse.x = (x / rect.width) * 2 - 1;
          mouse.y = -(y / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);

          const intersects = raycaster.intersectObject(Globe, true);
          let feature = findCountryHit(intersects, Globe);

          // Correct geometric fallback using dist < 105 to avoid transparent atmosphere shell
          if (!feature && intersects.length > 0) {
            const surfaceHit = intersects.find(i => {
              if (!i.point) return false;
              const dist = i.point.length();
              return dist < 105;
            });
            if (surfaceHit) {
              const lp = surfaceHit.point.clone();
              Globe.worldToLocal(lp);
              const r = 100;
              const lat = 90 - Math.acos(Math.max(-1, Math.min(1, lp.y / r))) * (180 / Math.PI);
              let lng = Math.atan2(lp.z, -lp.x) * (180 / Math.PI) - 180;
              if (lng < -180) lng += 360;
              feature = findFeatureAtLatLng(polygonFeatures, lat, lng);
            }
          }

          if (feature) {
            isHovering = true;
            if (feature !== hoveredFeature) {
              hoveredFeature = feature;
              Globe.polygonCapColor(polyCap).polygonStrokeColor(polyStroke).polygonAltitude(polyAlt);

              const name = feature.properties.NAME || feature.properties.ADMIN || '';
              const iso2 = isoForFeature(feature);
              const flagUrl = flagImageUrl(iso2, 80);
              const info = COUNTRY_INFO[name];
              const featuredBook = FEATURED_BOOKS.find(
                b => b.country.toLowerCase() === name.toLowerCase()
              );
              setHoveredCountry({
                name,
                flagUrl,
                info: info || { capital: '—', currency: '—', language: '—', utcOffset: 0, epithet: '' },
                utcOffset: info?.utcOffset ?? 0,
                featuredBook,
              });
            }
            container.style.cursor = 'pointer';
          } else {
            isHovering = false;
            if (hoveredFeature !== null) {
              hoveredFeature = null;
              Globe.polygonCapColor(polyCap).polygonStrokeColor(polyStroke).polygonAltitude(polyAlt);
              setHoveredCountry(null);
            }
            container.style.cursor = 'grab';
          }
        };

        onUp = function() {
          isDragging = false;
        };

        onLeave = function() {
          isHovering = false;
          if (hoveredFeature !== null) {
            hoveredFeature = null;
            Globe.polygonCapColor(polyCap).polygonStrokeColor(polyStroke).polygonAltitude(polyAlt);
            setHoveredCountry(null);
          }
        };

        renderer.domElement.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
        renderer.domElement.addEventListener('touchmove', onMove, { passive: true });
        renderer.domElement.addEventListener('touchend', onUp, { passive: true });
        renderer.domElement.addEventListener('mouseleave', onLeave);

        renderer.domElement.style.cursor = 'grab';

        // ── Resize ──
        resizeHandler = () => {
          if (!mountedRef.current) return;
          const nw = container.clientWidth;
          const nh = container.clientHeight;
          renderer.setSize(nw, nh);
          camera.aspect = nw / nh;
          updateCameraZ(nw, nh, camera);
          camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', resizeHandler);

        // ── Animation loop ──
        function animate() {
          if (!mountedRef.current) return;
          animId = requestAnimationFrame(animate);
          if (!isDragging) {
            const speed = isHovering ? baseSpeed * 0.12 : baseSpeed;
            rotationY += speed;
            Globe.rotation.y = rotationY;
          }
          renderer.render(scene, camera);
        }

        container.style.opacity = '0';
        container.style.transition = 'opacity 1.2s ease';
        requestAnimationFrame(() => { container.style.opacity = '1'; });

        animate();

      } catch (err) {
        console.error('[RotatingGlobe] init error:', err);
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (animId) cancelAnimationFrame(animId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);

      if (rendererRef && rendererRef.domElement) {
        if (onDown) rendererRef.domElement.removeEventListener('mousedown', onDown);
        if (onDown) rendererRef.domElement.removeEventListener('touchstart', onDown);
        if (onMove) rendererRef.domElement.removeEventListener('touchmove', onMove);
        if (onUp) rendererRef.domElement.removeEventListener('touchend', onUp);
        if (onLeave) rendererRef.domElement.removeEventListener('mouseleave', onLeave);
      }
      if (onMove) window.removeEventListener('mousemove', onMove);
      if (onUp) window.removeEventListener('mouseup', onUp);

      if (rendererRef) {
        rendererRef.dispose();
        if (rendererRef.domElement && rendererRef.domElement.parentNode) {
          rendererRef.domElement.parentNode.removeChild(rendererRef.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'transparent',
        overflow: 'hidden',
        minHeight: '400px',
      }}
    >
      <CountryTooltip hoveredCountry={hoveredCountry} tooltipRef={tooltipRef} />
    </div>
  );
}
