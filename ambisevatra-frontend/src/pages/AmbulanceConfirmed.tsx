import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingApi, type TrackingData, type BookingData, type SosData, type AssignedAmbulance } from '../services/api';

/* ═══════════════════════════════════════════════════════════════════
   Custom Map Icons
   ═══════════════════════════════════════════════════════════════════ */

const ambulanceIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,#007BFF,#8B5CF6);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 20px rgba(0,123,255,0.5);
        border:3px solid white;
        animation:pulse-ring 2s ease-in-out infinite;
    "><span style="font-family:'Material Symbols Outlined';font-size:22px;color:white;">ambulance</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

const dispatchIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:#8B5CF6;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(139,92,246,0.4);border:3px solid white;
    "><span style="font-family:'Material Symbols Outlined';font-size:18px;color:white;">home_health</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:#2ECC71;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(46,204,113,0.4);border:3px solid white;
    "><span style="font-family:'Material Symbols Outlined';font-size:18px;color:white;">my_location</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

const destinationIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:#E63946;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(230,57,70,0.4);border:3px solid white;
    "><span style="font-family:'Material Symbols Outlined';font-size:18px;color:white;">local_hospital</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

/* ═══════════════════════════════════════════════════════════════════
   Map Auto-Pan Component
   ═══════════════════════════════════════════════════════════════════ */

function MapUpdater({ center, shouldFollow }: { center: [number, number]; shouldFollow: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (shouldFollow && center[0] !== 0) {
            map.panTo(center, { animate: true, duration: 0.8 });
        }
    }, [center, shouldFollow, map]);
    return null;
}

/* ═══════════════════════════════════════════════════════════════════
   Status Config
   ═══════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, {
    label: string; icon: string; color: string; bg: string; border: string; pulse: boolean; description: string;
}> = {
    dispatched: {
        label: 'Dispatched', icon: 'departure_board', color: 'text-blue-400', bg: 'bg-blue-500/10',
        border: 'border-blue-500/20', pulse: true, description: 'Ambulance is being dispatched to your location',
    },
    en_route: {
        label: 'En Route', icon: 'navigation', color: 'text-primary-blue', bg: 'bg-primary-blue/10',
        border: 'border-primary-blue/20', pulse: true, description: 'Ambulance is on its way to you',
    },
    nearby: {
        label: 'Almost There', icon: 'near_me', color: 'text-amber-400', bg: 'bg-amber-500/10',
        border: 'border-amber-500/20', pulse: true, description: 'Ambulance is very close to your location',
    },
    arrived: {
        label: 'Arrived', icon: 'where_to_vote', color: 'text-success-green', bg: 'bg-success-green/10',
        border: 'border-success-green/20', pulse: false, description: 'Ambulance has arrived at your location',
    },
};

const TIMELINE_STEPS = ['dispatched', 'en_route', 'nearby', 'arrived'] as const;

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */

const AmbulanceConfirmed = () => {
    const location = useLocation();
    const stateData = location.state as {
        booking?: BookingData;
        sosId?: string;
        sosData?: SosData;
    } | null;
    const booking = stateData?.booking ?? null;
    const sosId = stateData?.sosId ?? null;
    const bookingId = booking?.id ?? sosId ?? 'demo-booking';

    // Resolve assigned ambulance from whichever source we have
    const assignedAmbulance: AssignedAmbulance | null =
        booking?.assigned_ambulance
        ?? stateData?.sosData?.assigned_ambulance
        ?? null;

    // Tracking state
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [connected, setConnected] = useState(false);
    const [followAmbulance, setFollowAmbulance] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [etaCountdown, setEtaCountdown] = useState(480); // 8min in seconds
    const wsRef = useRef<WebSocket | null>(null);
    const etaBaseRef = useRef<number>(480);

    // Current time state to check scheduled time logic
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const isScheduledBooking = !!(booking?.scheduled_date && booking?.scheduled_time);

    let timeUntilScheduledMs = 0;
    if (isScheduledBooking) {
        const scheduledStr = `${booking.scheduled_date}T${booking.scheduled_time}:00`;
        timeUntilScheduledMs = new Date(scheduledStr).getTime() - currentTime.getTime();
    }
    const isWithin30Mins = timeUntilScheduledMs <= 30 * 60 * 1000;

    // Tracking becomes visible if within 30 mins, or if it's dispatched already (handled by status check later)
    const [isDispatched, setIsDispatched] = useState(false);
    const isTrackingVisible = !isScheduledBooking || isWithin30Mins || isDispatched;

    // Demo coordinates (Kolkata) - 3 points: dispatch → pickup → drop
    const dispatchPos: [number, number] = [22.5847, 88.3426];  // Ambulance base
    const pickupPos: [number, number] = [22.5726, 88.3639];    // Patient location
    const destPos: [number, number] = [22.5448, 88.3426];      // Hospital

    // Road-following route state
    const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    // Fetch road route from OSRM on mount
    useEffect(() => {
        const fetchRoadRoute = async () => {
            setIsLoadingRoute(true);
            try {
                // Fetch 3-point route: dispatch → pickup → drop
                const url = `https://router.project-osrm.org/route/v1/driving/${dispatchPos[1]},${dispatchPos[0]};${pickupPos[1]},${pickupPos[0]};${destPos[1]},${destPos[0]}`;
                const resp = await fetch(url + '?overview=full&geometries=geojson');
                const data = await resp.json();

                if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
                    // Convert from [lng, lat] to [lat, lng]
                    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => [lat, lng]
                    );
                    setRoadRoute(coords);
                } else {
                    // Fallback to straight lines
                    setRoadRoute([dispatchPos, pickupPos, destPos]);
                }
            } catch (err) {
                console.warn('OSRM fetch failed, using straight line:', err);
                setRoadRoute([dispatchPos, pickupPos, destPos]);
            } finally {
                setIsLoadingRoute(false);
            }
        };
        fetchRoadRoute();
    }, []);

    // Connect WebSocket
    useEffect(() => {
        if (!isTrackingVisible && isScheduledBooking) return; // Don't track if not visible yet

        const ws = trackingApi.connectWs(
            bookingId,
            (data) => {
                setTracking(data);
                setConnected(true);
                setIsDispatched(true); // Once we get tracking data, assume dispatched
                etaBaseRef.current = data.eta_minutes * 60;
                setEtaCountdown(Math.ceil(data.eta_minutes * 60));
            },
            () => setConnected(false),
        );
        wsRef.current = ws;

        // Start simulation for demo
        trackingApi.simulate(bookingId).catch(() => { });

        // Ping to keep alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            ws.close();
        };
    }, [bookingId, isTrackingVisible, isScheduledBooking]);

    // ETA countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setEtaCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatEta = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return { minutes: m, seconds: s, display: `${m}:${String(s).padStart(2, '0')}` };
    }, []);

    const eta = formatEta(etaCountdown);
    const currentStatus = tracking?.status ?? 'dispatched';
    const statusConf = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.dispatched;
    const ambPos: [number, number] = tracking ? [tracking.latitude, tracking.longitude] : dispatchPos;

    // Route polyline path following roads (from OSRM)
    const routePath: [number, number][] = roadRoute.length > 0 ? roadRoute : [dispatchPos, pickupPos, destPos];

    // Calculate covered path (from start to current ambulance position)
    const coveredPath: [number, number][] = (() => {
        if (!tracking || roadRoute.length === 0) return [];

        // Find closest point on route to ambulance position
        let closestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < roadRoute.length; i++) {
            const [routeLat, routeLng] = roadRoute[i];
            const dist = Math.sqrt(
                Math.pow(routeLat - ambPos[0], 2) + Math.pow(routeLng - ambPos[1], 2)
            );
            if (dist < minDist) {
                minDist = dist;
                closestIdx = i;
            }
        }

        // Return route from start to ambulance current position
        return roadRoute.slice(0, closestIdx + 1).concat([ambPos]);
    })();

    const currentStep = TIMELINE_STEPS.indexOf(currentStatus as typeof TIMELINE_STEPS[number]);

    const driverName = tracking?.driver_name || assignedAmbulance?.driver_name || 'Assigning driver...';
    const driverPhone = tracking?.driver_phone || assignedAmbulance?.driver_phone || '';
    const vehicleNo = tracking?.vehicle_number || assignedAmbulance?.vehicle_number || 'Assigning...';
    const vehicleType = tracking?.vehicle_type || (() => {
        const t = assignedAmbulance?.ambulance_type ?? 'basic';
        const labels: Record<string, string> = { basic: 'BLS', advanced: 'ALS', patient_transport: 'PTS', neonatal: 'NICU', air: 'Air' };
        return labels[t] ?? t.toUpperCase();
    })();
    const speed = tracking?.speed ?? 0;

    const typeLabels: Record<string, string> = {
        BLS: 'Basic Life Support', ALS: 'Advanced Life Support',
        PTS: 'Patient Transport', NICU: 'Neonatal ICU', Air: 'Air Ambulance',
    };
    const vehicleTypeLabel = typeLabels[vehicleType] ?? vehicleType;

    return (
        <div className="flex-1 w-full min-h-screen bg-white dark:bg-background-dark pt-16 md:pt-20">
            {/* ── CSS for pulse animation ── */}
            <style>{`
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(0,123,255,0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(0,123,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,123,255,0); }
                }
                .leaflet-container { background: #0f172a !important; }
                .dark .leaflet-container { background: #0f172a !important; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ═══ TOP BAR: Status + ETA (Or Scheduled Message) ═══ */}
                {!isTrackingVisible && booking ? (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[40vh] shadow-xl">
                        <div className="w-20 h-20 rounded-full bg-primary-blue/10 flex items-center justify-center mb-6 border border-primary-blue/20">
                            <span className="material-symbols-outlined text-4xl text-primary-blue">calendar_month</span>
                        </div>
                        <h2 className="text-3xl font-black text-text-dark dark:text-white mb-3">Transport Scheduled</h2>
                        <p className="text-text-gray dark:text-gray-400 text-lg max-w-xl font-medium">
                            Your ambulance is confidently booked for <strong className="text-primary-blue">{booking.scheduled_date}</strong> at <strong className="text-primary-blue">{booking.scheduled_time}</strong>.
                        </p>
                        <p className="text-text-gray dark:text-gray-500 mt-4 text-sm max-w-lg mx-auto">
                            Live tracking and driver details will automatically appear here <span className="font-bold text-text-dark dark:text-gray-300">30 minutes</span> prior to pickup, or as soon as the ambulance is officially dispatched to your location—whichever is earlier.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                    >
                        {/* Status Badge */}
                        <div className={`rounded-2xl border ${statusConf.border} ${statusConf.bg} p-5 flex items-center gap-4`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statusConf.bg} border ${statusConf.border}`}>
                                <span className={`material-symbols-outlined text-3xl ${statusConf.color} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
                                    {statusConf.icon}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Status</p>
                                <p className={`text-xl font-black ${statusConf.color}`}>{statusConf.label}</p>
                                <p className="text-xs text-text-gray dark:text-gray-400 mt-0.5">{statusConf.description}</p>
                            </div>
                        </div>

                        {/* ETA Countdown */}
                        <div className="rounded-2xl border border-primary-blue/20 bg-primary-blue/5 p-5 flex items-center gap-4">
                            <div className="relative">
                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                                    <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="4"
                                        className="text-gray-200 dark:text-gray-800" />
                                    <circle cx="30" cy="30" r="26" fill="none" strokeWidth="4" strokeLinecap="round"
                                        className="text-primary-blue"
                                        strokeDasharray={`${2 * Math.PI * 26}`}
                                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - etaCountdown / (etaBaseRef.current || 480))}`}
                                        style={{ transition: 'stroke-dashoffset 1s linear' }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary-blue text-xl">timer</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">
                                    Estimated Arrival
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-text-dark dark:text-white font-mono">
                                        {eta.minutes}
                                    </span>
                                    <span className="text-sm font-bold text-text-gray">min</span>
                                    <span className="text-3xl font-black text-text-dark dark:text-white font-mono ml-1">
                                        {String(eta.seconds).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-bold text-text-gray">sec</span>
                                </div>
                                {speed > 0 && (
                                    <p className="text-xs text-text-gray dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">speed</span>
                                        {speed.toFixed(0)} km/h
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connection & Quick Actions */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-success-green animate-pulse' : 'bg-gray-400'}`} />
                                    <span className="text-xs font-bold text-text-gray dark:text-gray-500">
                                        {connected ? 'LIVE TRACKING' : 'CONNECTING...'}
                                    </span>
                                </div>
                                {booking?.id && (
                                    <span className="text-xs font-mono text-text-gray dark:text-gray-600">ID: {booking.id.slice(0, 8)}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <a href={`tel:${driverPhone.replace(/\s/g, '')}`}
                                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-success-green/10 text-success-green font-bold text-sm hover:bg-success-green/20 transition-all border border-success-green/20">
                                    <span className="material-symbols-outlined text-lg">call</span>
                                    Call Driver
                                </a>
                                <button onClick={() => setShowDetails(!showDetails)}
                                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary-blue/10 text-primary-blue font-bold text-sm hover:bg-primary-blue/20 transition-all border border-primary-blue/20">
                                    <span className="material-symbols-outlined text-lg">{showDetails ? 'expand_less' : 'info'}</span>
                                    {showDetails ? 'Hide' : 'Details'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ EXPANDABLE DETAILS PANEL ═══ */}
                <AnimatePresence>
                    {isTrackingVisible && showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Driver */}
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-accent-purple">person</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Driver</p>
                                            <p className="font-bold text-text-dark dark:text-white">{driverName}</p>
                                        </div>
                                    </div>
                                    <a href={`tel:${driverPhone.replace(/\s/g, '')}`}
                                        className="text-sm text-primary-blue font-medium flex items-center gap-1 hover:underline">
                                        <span className="material-symbols-outlined text-sm">call</span>{driverPhone}
                                    </a>
                                </div>
                                {/* Vehicle */}
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-primary-blue/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary-blue">ambulance</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Vehicle</p>
                                            <p className="font-bold font-mono text-text-dark dark:text-white">{vehicleNo}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-blue/10 text-primary-blue border border-primary-blue/20">
                                        <span className="material-symbols-outlined text-xs">medical_services</span>
                                        {vehicleType} — {vehicleTypeLabel}
                                    </span>
                                </div>
                                {/* Pickup */}
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-success-green/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-success-green">my_location</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Pickup</p>
                                            <p className="font-medium text-sm text-text-dark dark:text-white leading-snug">
                                                {booking?.pickup_address || 'Your current location'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Destination */}
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-emergency-red/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emergency-red">local_hospital</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Destination</p>
                                            <p className="font-medium text-sm text-text-dark dark:text-white leading-snug">
                                                {booking?.destination || 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ LIVE MAP & TIMELINE (Only if Tracking is Visible) ═══ */}
                {isTrackingVisible && (
                    <>
                        {/* ═══ LIVE MAP ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative rounded-3xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 shadow-2xl"
                            style={{ height: 'clamp(320px, 50vh, 550px)' }}
                        >
                            <MapContainer
                                center={[22.5648, 88.3533]}  // Center between all 3 points
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                />
                                <MapUpdater center={ambPos} shouldFollow={followAmbulance} />

                                {/* Route lines */}
                                {coveredPath.length > 0 && (
                                    <Polyline positions={coveredPath} pathOptions={{ color: '#10B981', weight: 5, opacity: 0.7 }} />
                                )}
                                <Polyline positions={routePath} pathOptions={{ color: '#007BFF', weight: 4, opacity: 0.6, dashArray: '8 8' }} />

                                {/* Markers */}
                                <Marker position={dispatchPos} icon={dispatchIcon}>
                                    <Popup><strong>Ambulance Base</strong><br />Dispatch location</Popup>
                                </Marker>
                                <Marker position={pickupPos} icon={pickupIcon}>
                                    <Popup><strong>Pickup Location</strong><br />{booking?.pickup_address || 'Your location'}</Popup>
                                </Marker>
                                <Marker position={destPos} icon={destinationIcon}>
                                    <Popup><strong>Destination</strong><br />{booking?.destination || 'TBD'}</Popup>
                                </Marker>
                                {tracking && tracking.latitude !== 0 && (
                                    <Marker position={ambPos} icon={ambulanceIcon}>
                                        <Popup>
                                            <strong>🚑 Ambulance</strong><br />
                                            {driverName} • {vehicleNo}<br />
                                            ETA: {eta.minutes}m {eta.seconds}s
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>

                            {/* Map Overlay Controls */}
                            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                                <button onClick={() => setFollowAmbulance(!followAmbulance)}
                                    className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-all ${followAmbulance
                                        ? 'bg-primary-blue text-white'
                                        : 'bg-white dark:bg-gray-900 text-text-gray border border-gray-200 dark:border-gray-700'
                                        }`}
                                    title={followAmbulance ? 'Stop following' : 'Follow ambulance'}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {followAmbulance ? 'gps_fixed' : 'gps_not_fixed'}
                                    </span>
                                </button>
                            </div>

                            {/* Speed overlay */}
                            {speed > 0 && (
                                <div className="absolute bottom-4 left-4 z-[1000] bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-blue text-lg">speed</span>
                                    <span className="text-white font-bold font-mono text-sm">{speed.toFixed(0)} km/h</span>
                                </div>
                            )}

                            {/* Live indicator */}
                            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                                <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                                    <span className="text-white text-xs font-bold tracking-wider">{connected ? 'LIVE' : '...'}</span>
                                </div>
                                {isLoadingRoute && (
                                    <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-white text-xs font-bold tracking-wider">ROUTING...</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* ═══ TIMELINE PROGRESS ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
                        >
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-5">Journey Progress</h3>
                            <div className="flex items-center justify-between relative">
                                {/* Progress bar background */}
                                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                <div
                                    className="absolute top-5 left-8 h-1 bg-gradient-to-r from-primary-blue to-accent-purple rounded-full transition-all duration-1000"
                                    style={{ width: `calc(${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}% - 64px)` }}
                                />
                                {TIMELINE_STEPS.map((step, i) => {
                                    const conf = STATUS_CONFIG[step];
                                    const isPast = i < currentStep;
                                    const isCurrent = i === currentStep;
                                    return (
                                        <div key={step} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                                            <motion.div
                                                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCurrent
                                                    ? `bg-gradient-to-br from-primary-blue to-accent-purple border-primary-blue text-white shadow-lg shadow-primary-blue/30`
                                                    : isPast
                                                        ? 'bg-primary-blue border-primary-blue text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {isPast ? 'check' : conf.icon}
                                                </span>
                                            </motion.div>
                                            <span className={`text-xs font-bold mt-2 text-center ${isCurrent ? 'text-primary-blue' : isPast ? 'text-text-dark dark:text-white' : 'text-gray-400'
                                                }`}>
                                                {conf.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* ═══ BOTTOM ACTIONS ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-3 pb-8"
                >
                    <Link to="/booking-history"
                        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
                        <span className="material-symbols-outlined">history</span>
                        View Bookings
                    </Link>
                    <a href={`tel:102`}
                        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-emergency-red/10 text-emergency-red font-bold text-sm hover:bg-emergency-red/20 transition-all border border-emergency-red/20">
                        <span className="material-symbols-outlined">emergency</span>
                        Emergency: 102
                    </a>
                    <Link to="/"
                        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-r from-primary-blue to-accent-purple text-white font-black text-sm hover:shadow-lg hover:shadow-primary-blue/30 hover:scale-[1.02] transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Return Home
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default AmbulanceConfirmed;
