import React from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  RefreshCw,
  MapPin,
  Navigation,
  Loader2,
} from 'lucide-react';
import { SENSOR_TYPES, SensorTypeId, Station } from '../types/sab';
import { SABStats, formatTime24, isCurrentlyRaining } from '../utils/sabLogic';
import { rainStatusText } from '../utils/rainStatus';
import { LightShow } from './LightShow';

export interface ClosestStationInfo {
  station: Station;
  distanceMeters: number;
  distanceFormatted: string;
  readingFormatted: string;
}

interface HeaderProps {
  currentSensorType: SensorTypeId;
  onSelectSensorType: (id: SensorTypeId) => void;
  stats: SABStats;
  lastUpdated: Date | null;
  dataSource: 'live' | 'cache';
  isLoading: boolean;
  onRefresh: () => void;
  viewMode?: 'map' | 'table';
  onChangeViewMode?: (mode: 'map' | 'table') => void;
  closestStationInfo: ClosestStationInfo | null;
  isLocatingGps: boolean;
  onTriggerGps: () => void;
  onSelectStation: (station: Station) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSensorType,
  onSelectSensorType,
  stats,
  lastUpdated,
  isLoading,
  onRefresh,
  viewMode,
  onChangeViewMode,
  closestStationInfo,
  isLocatingGps,
  onTriggerGps,
  onSelectStation,
}) => {
  const getSensorIcon = (iconName: string, active: boolean) => {
    const iconClass = `w-4 h-4 ${active ? 'text-white' : 'text-[#8fa0b3]'}`;
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className={iconClass} />;
      case 'Thermometer':
        return <Thermometer className={iconClass} />;
      case 'Droplets':
        return <Droplets className={iconClass} />;
      default:
        return <CloudRain className={iconClass} />;
    }
  };

  return (
    <header className="bg-[rgba(5,7,11,0.82)] text-white border-b border-[rgba(170,220,255,0.1)] relative z-30 select-none">
      <LightShow />
      <div className="relative z-10 w-full px-2.5 sm:px-4 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* LINE 1: VARIABLE SELECTOR TABS (Lluvias, Temperatura, Humedad - Squircles) */}
          <nav
            aria-label="Variables meteorológicas"
            className="flex items-center justify-between sm:justify-start gap-1 glass p-1 rounded-full w-full md:w-auto shrink-0"
          >
            {SENSOR_TYPES.map((type) => {
              const active = currentSensorType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSelectSensorType(type.id)}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer border ${
                    active
                      ? 'lit text-white'
                      : 'bg-transparent border-transparent text-[#8fa0b3] hover:text-white hover:bg-[rgba(236,246,255,0.06)]'
                  }`}
                >
                  {getSensorIcon(type.icon, active)}
                  <span>{type.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* LINE 2: COMPACT STATS & CONTROLS */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
            {/* LLUVIAS (Sensor 5): 2 icon badges */}
            {currentSensorType === 5 && (
              <div className="flex items-center gap-1.5">
                {/* Badge 1: Stations reporting rain count (icon + count, minimal text) */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition shadow-xs ${
                    stats.activeRainingCount > 0
                      ? 'bg-[#111a27] border-amber-500/50 text-amber-400'
                      : 'glass border-[#1d2938] text-[#6f8091]'
                  }`}
                  title={`${stats.activeRainingCount} de ${stats.totalStations} estaciones reportando lluvia`}
                >
                  <CloudRain className={`w-3.5 h-3.5 ${stats.activeRainingCount > 0 ? 'text-[#eb9438] animate-pulse' : 'text-[#6f8091]'}`} />
                  <span className="font-mono text-xs">{stats.activeRainingCount}</span>
                </div>

                {/* Badge 2: Nearest station rain status (icon-driven, minimal text) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
                      isCurrentlyRaining(closestStationInfo.station)
                        ? 'lit text-white border-amber-400/40 shadow-sm'
                        : 'glass text-slate-200 hover:text-white border-[#1d2938] hover:bg-[#152031]'
                    }`}
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted}) • ${Number(closestStationInfo.station.ACUMULADODIA ?? 0)} mm hoy`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{rainStatusText(closestStationInfo.station)}</span>
                  </button>
                ) : isLocatingGps ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass text-[#6f8091] text-xs border border-[#1d2938]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#eb9438]" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onTriggerGps}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass hover:bg-[rgba(236,246,255,0.08)] text-[#6f8091] hover:text-white text-xs border border-[#1d2938] transition cursor-pointer"
                    title="Detectar estación más cercana vía GPS"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#eb9438]" />
                  </button>
                )}
              </div>
            )}

            {/* TEMPERATURA (Sensor 1): Nearest as main, Min & Prom as side info */}
            {currentSensorType === 1 && (
              <div className="flex items-center gap-1.5">
                {/* Nearest (MAIN) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full lit text-white font-bold text-xs border border-amber-400/40 shadow-sm transition hover:brightness-110 cursor-pointer"
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted})`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="font-mono">
                      {Number(closestStationInfo.station.VALORLECTURA ?? 0).toFixed(1)}°C
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full glass border border-[#1d2938] text-xs font-bold text-amber-400">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono">{stats.averageTemp}°C</span>
                  </div>
                )}

                {/* Min & Prom (SIDE INFO) */}
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full glass border border-[#1d2938] text-slate-300">
                  <span className="text-[#8fa0b3]">Mín: <strong className="text-blue-300 font-mono">{stats.minTemp}°</strong></span>
                  <span className="text-[#2a3646]">•</span>
                  <span className="text-[#8fa0b3]">Prom: <strong className="text-white font-mono">{stats.averageTemp}°</strong></span>
                </div>
              </div>
            )}

            {/* HUMEDAD (Sensor 2): Nearest as main, Min & Prom as side info */}
            {currentSensorType === 2 && (
              <div className="flex items-center gap-1.5">
                {/* Nearest (MAIN) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full lit text-white font-bold text-xs border border-amber-400/40 shadow-sm transition hover:brightness-110 cursor-pointer"
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted})`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="font-mono">
                      {Math.round(Number(closestStationInfo.station.VALORLECTURA ?? closestStationInfo.station.HUMEDAD ?? 0))}%
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full glass border border-[#1d2938] text-xs font-bold text-amber-400">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono">{stats.averageHumidity}%</span>
                  </div>
                )}

                {/* Min & Prom (SIDE INFO) */}
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full glass border border-[#1d2938] text-slate-300">
                  <span className="text-[#8fa0b3]">Mín: <strong className="text-amber-300 font-mono">{stats.minHumidity}%</strong></span>
                  <span className="text-[#2a3646]">•</span>
                  <span className="text-[#8fa0b3]">Prom: <strong className="text-white font-mono">{stats.averageHumidity}%</strong></span>
                </div>
              </div>
            )}

            {/* Controls: Refresh */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass hover:bg-[rgba(236,246,255,0.08)] disabled:opacity-50 text-slate-200 hover:text-white text-xs font-medium border border-[#1d2938] transition cursor-pointer shrink-0"
                title="Refrescar datos meteorológicos IDIGER"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#8fa0b3] ${isLoading ? 'animate-spin text-[#eb9438]' : ''}`} />
                <span className="hidden sm:inline">
                  {lastUpdated ? formatTime24(lastUpdated) : 'Actualizar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
