"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { STATUS_OPTIONS, STATUS_COLORS, type Busca, type Lead } from "@/lib/types";
import { InboxIcon } from "../icons";

const CENTRO_BRASIL: [number, number] = [-14.235, -51.9253];

const CORES_COBERTURA = ["#2563EB", "#A78BFA", "#F59E0B", "#10B981", "#EF4444", "#22D3EE", "#EC4899", "#84CC16"];

function corDoNicho(nicho: string): string {
  let h = 0;
  for (let i = 0; i < nicho.length; i++) h = nicho.charCodeAt(i) + ((h << 5) - h);
  return CORES_COBERTURA[Math.abs(h) % CORES_COBERTURA.length]!;
}

function useTema(): "dark" | "light" {
  const [tema, setTema] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark"
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTema(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return tema;
}

function zoomParaRaio(raioMetros: number): number {
  const raioKm = Math.max(1, raioMetros / 1000);
  return Math.round(Math.max(5, Math.min(15, 14 - Math.log2(raioKm))));
}

function iconeLead(cor: string, selecionado: boolean): L.DivIcon {
  const tamanho = selecionado ? 22 : 15;
  return L.divIcon({
    className: "",
    html: `<div style="width:${tamanho}px;height:${tamanho}px;border-radius:50%;background:${cor};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);"></div>`,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2],
  });
}

function iconeCluster(count: number): L.DivIcon {
  const tamanho = count < 10 ? 32 : count < 50 ? 38 : 44;
  return L.divIcon({
    className: "",
    html: `<div style="width:${tamanho}px;height:${tamanho}px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#EA580C;color:#fff;font:600 12px var(--font-sans, sans-serif);border:2px solid #fff;box-shadow:0 2px 10px rgba(234,88,12,.5);">${count}</div>`,
    iconSize: [tamanho, tamanho],
  });
}

function ControleCentro({ centro, raioMetros }: { centro: { lat: number; lng: number } | null; raioMetros: number }) {
  const map = useMap();
  useEffect(() => {
    if (!centro) return;
    map.flyTo([centro.lat, centro.lng], zoomParaRaio(raioMetros), { duration: 0.6 });
  }, [centro, raioMetros, map]);
  return null;
}

export default function MapaView({
  leads,
  centro,
  raioMetros,
  leadSelecionadoId,
  onSelecionarLead,
  buscas,
}: {
  leads: Lead[];
  centro: { lat: number; lng: number } | null;
  raioMetros: number;
  leadSelecionadoId: string | null;
  onSelecionarLead: (lead: Lead) => void;
  buscas: Busca[];
}) {
  const tema = useTema();
  const comLocalizacao = leads.filter((l) => l.lat != null && l.lng != null);

  // CartoDB's anonymous basemap endpoint agora exige chave (mostra watermark
  // "API KEY REQUIRED"). Usamos os canvas cinza claro/escuro da Esri, que são
  // gratuitos e não exigem chave — visual equivalente ao dark_matter/Positron.
  const camada = tema === "light" ? "Light_Gray" : "Dark_Gray";
  const baseUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${camada}_Base/MapServer/tile/{z}/{y}/{x}`;
  const referenciaUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${camada}_Reference/MapServer/tile/{z}/{y}/{x}`;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={centro ? [centro.lat, centro.lng] : CENTRO_BRASIL}
        zoom={centro ? zoomParaRaio(raioMetros) : 4}
        className="h-full w-full"
        style={{ background: "var(--color-bg)" }}
      >
        <TileLayer
          url={baseUrl}
          attribution="Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community"
        />
        <TileLayer url={referenciaUrl} />
        <ControleCentro centro={centro} raioMetros={raioMetros} />

        {buscas.map((b) => {
          const cor = corDoNicho(b.nicho);
          return (
            <Circle
              key={b.id}
              center={[b.lat, b.lng]}
              radius={b.raio_m}
              pathOptions={{ color: cor, weight: 1.5, fillColor: cor, fillOpacity: 0.06 }}
            >
              <Tooltip sticky>
                {b.nicho} · {b.localizacao_texto || "—"} · {(b.raio_m / 1000).toFixed(0)}km
              </Tooltip>
            </Circle>
          );
        })}

        {centro && (
          <Circle
            center={[centro.lat, centro.lng]}
            radius={raioMetros}
            pathOptions={{ color: "#EA580C", weight: 2, dashArray: "6 6", fillColor: "#EA580C", fillOpacity: 0.08 }}
          />
        )}

        <MarkerClusterGroup
          iconCreateFunction={(cluster: { getChildCount: () => number }) => iconeCluster(cluster.getChildCount())}
        >
          {comLocalizacao.map((lead) => (
            <Marker
              key={lead.id}
              position={[lead.lat!, lead.lng!]}
              icon={iconeLead(STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] ?? "#64748B", lead.id === leadSelecionadoId)}
              eventHandlers={{ click: () => onSelecionarLead(lead) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-control border border-line bg-surface/90 p-3 text-[11px] text-ink shadow-lg backdrop-blur">
        <div className="mb-1.5 font-semibold uppercase tracking-wide text-ink-muted">Status</div>
        <div className="grid grid-cols-1 gap-1">
          {STATUS_OPTIONS.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {comLocalizacao.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface/95 px-6 py-8 text-center shadow-lg">
            <InboxIcon className="h-7 w-7 text-ink-muted/60" />
            <p className="text-sm font-semibold text-ink">Nenhum lead com localização</p>
            <p className="max-w-[220px] text-xs text-ink-muted">
              Busque por nicho e localização na sidebar pra ver pins aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
