
import { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';

interface CheckpointData {
    name: string;
    overallRank: number | null;
    genderRank: number | null;
    time: string | null;
    segment: string | null;
}

interface Waypoint {
    name: string;
    distance: number;
    elevation: number;
}

interface Props {
    checkpoints: CheckpointData[];
    waypoints: Waypoint[];
}

export function SegmentPaceChart({ checkpoints, waypoints }: Props) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const { options, series } = useMemo(() => {
        const barColor = isDark ? '#60a5fa' : '#100d67'; // Blue
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const labelColor = isDark ? '#cbd5e1' : '#64748b';

        // 1. Parse Segment Durations & Match Distances
        const segments: { name: string; pace: number; segment: string }[] = [];

        checkpoints.forEach((cp, index) => {
            if (!cp.segment) return;

            // --- 1. ROBUST TIME PARSING ---
            let minutes = 0;
            const cleanSegment = cp.segment.replace('+', '').trim(); // Remove leading '+' if present

            // Pattern: "1h 20m 30s"
            if (cleanSegment.includes('h') || cleanSegment.includes('m') || cleanSegment.includes('s')) {
                const hMatch = cleanSegment.match(/(\d+)h/);
                const mMatch = cleanSegment.match(/(\d+)m/);
                const sMatch = cleanSegment.match(/(\d+)s/);
                minutes += hMatch ? parseInt(hMatch[1]) * 60 : 0;
                minutes += mMatch ? parseInt(mMatch[1]) : 0;
                minutes += sMatch ? parseInt(sMatch[1]) / 60 : 0;
            }
            // Pattern: "HH:MM:SS" or "MM:SS" (Colons)
            else if (cleanSegment.includes(':')) {
                const parts = cleanSegment.split(':').map(Number);
                if (parts.length === 3) {
                    // HH:MM:SS
                    minutes = parts[0] * 60 + parts[1] + parts[2] / 60;
                } else if (parts.length === 2) {
                    // MM:SS (or HH:MM? assume MM:SS for segment usually, but could be HH:MM for long races. 
                    // Context: Segment usually < hours? 
                    // But saftey: If part[0] > 60? 
                    // Standard: HH:MM:SS usually. If 2 parts, could be MM:SS.
                    // Let's try parsing as MM:SS first.
                    minutes = parts[0] + parts[1] / 60;
                }
            }

            if (minutes <= 0) return;

            // --- 2. INDEX-BASED DISTANCE CALCULATION ---
            // Fallback to Index if standard name lookup fails (or just use index to be safe/consistent with Live Stats)
            let segmentDistance = 0;
            let usedDistance = 0;

            // Try exact name match first (most accurate if names align)
            const wpIndexByName = waypoints.findIndex(wp => wp.name === cp.name);

            // Determine "Current Waypoint" logic
            let currentWp = null;
            let prevWpDist = 0;

            if (wpIndexByName !== -1) {
                currentWp = waypoints[wpIndexByName];
                prevWpDist = wpIndexByName > 0 ? waypoints[wpIndexByName - 1].distance : 0;
            } else {
                // FALLBACK: Use Index 1:1 matching
                // Assuming checkpoints[0] (CP1) maps to waypoints[0] (CP1) ? 
                // OR checkpoints[0] maps to waypoints[1] (if waypoints[0] is Start)?
                // Live Stats uses: currentDistance = elevationWaypoints[lastReachedCheckpointIndex].distance
                // This implies DIRECT MAPPING: checkpoints[i] -> waypoints[i].
                if (index < waypoints.length) {
                    currentWp = waypoints[index];
                    // If it's the first CP (index 0), prev dist is 0 (Start).
                    // But if waypoints[0] is Start, then Waypoints has 1 extra item?
                    // Let's check logic:
                    // If checkpoints has 5 items. Waypoints has 5 items.
                    // checkpoints[0] is CP1. waypoints[0] is CP1. 
                    // Then distance of Segment 1 is waypoints[0].distance - 0.
                    // If waypoints[0] is Start (0km). Then checkpoints[0] maps to waypoints[1].

                    // Logic check: Live stats says `currentDistance = elevationWaypoints[lastReachedCheckpointIndex].distance`.
                    // If I am at CP1 (index 0). Distance is waypoints[0].distance.
                    // Assume waypoints[0].distance is e.g. 10km.
                    // Then Segment 1 dist = 10km - 0.
                    // If I am at CP2 (index 1). Distance is waypoints[1].distance (e.g. 20km).
                    // Segment 2 dist = 20 - 10 = 10km.

                    prevWpDist = index > 0 ? waypoints[index - 1].distance : 0;
                }
            }

            if (currentWp) {
                segmentDistance = currentWp.distance - prevWpDist;
            }

            if (segmentDistance > 0) {
                const pace = minutes / segmentDistance; // min/km

                // Sanity check: Pace between 2 min/km (WR sprint) and 60 min/km (very slow walk)
                if (pace > 0) {
                    segments.push({
                        name: cp.name,
                        pace: pace,
                        segment: cp.segment
                    });
                }
            }
        });

        const chartOptions: ApexOptions = {
            chart: {
                id: 'pace-evolution',
                type: 'bar',
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
                fontFamily: 'inherit',
                parentHeightOffset: 0,
            },
            colors: [barColor],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '40%',
                    dataLabels: {
                        position: 'top', // top, center, bottom
                    },
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return Number(val).toFixed(1);
                },
                offsetY: -20,
                style: {
                    fontSize: '10px',
                    colors: [labelColor]
                }
            },
            grid: {
                borderColor: gridColor,
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { left: 10, right: 10, top: 0, bottom: 0 },
            },
            xaxis: {
                categories: segments.map(s => s.name),
                labels: {
                    style: { fontSize: '10px', colors: labelColor },
                    rotate: -45,
                    trim: true
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
                tooltip: { enabled: false }
            },
            yaxis: {
                title: {
                    text: 'Pace (min/km)',
                    style: { fontSize: '10px', color: labelColor }
                },
                labels: {
                    style: { fontSize: '10px', colors: labelColor },
                    formatter: (val) => val.toFixed(0),
                },
            },
            tooltip: {
                enabled: true,
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val) => `${val.toFixed(2)} min/km`
                }
            }
        };

        const chartSeries = [
            {
                name: 'Pace',
                data: segments.map(s => s.pace)
            }
        ];

        return { options: chartOptions, series: chartSeries };
    }, [checkpoints, waypoints, isDark]);

    if (!checkpoints || checkpoints.length === 0) return null;

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-lg">🏃</span> Segment Pace
                </h3>
            </div>
            <div className="p-2 md:p-4 min-h-[200px]">
                <Chart
                    options={options}
                    series={series}
                    type="bar" // Changed to BAR
                    height={200}
                    width="100%"
                />
            </div>
        </div>
    );
}
