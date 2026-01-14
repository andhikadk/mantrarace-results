import { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';

interface ElevationPoint {
    distance: number;
    elevation: number;
}

interface Waypoint {
    name: string;
    distance: number;
    elevation: number;
}

interface Props {
    data: ElevationPoint[];
    waypoints?: Waypoint[];
    className?: string;
}

export function ElevationChart({ data, waypoints = [], className }: Props) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const { options, series } = useMemo(() => {
        const accentColor = isDark ? '#60a5fa' : '#100d67';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const labelColor = isDark ? '#cbd5e1' : '#94a3b8';
        const waypointColor = isDark ? '#f87171' : '#f00102';

        // Format data as [x, y] pairs for numeric x-axis
        const chartData = data.map((p) => ({
            x: p.distance,
            y: p.elevation,
        }));

        const elevations = data.map((p) => p.elevation);
        const minEle = Math.min(...elevations);
        const maxEle = Math.max(...elevations);
        const maxDistance = data[data.length - 1]?.distance || 0;

        // Create point annotations for waypoints (dots instead of lines)
        const waypointAnnotations = waypoints.map((wp) => {
            // Find closest elevation point
            const closestPoint = data.reduce((prev, curr) => {
                return (Math.abs(curr.distance - wp.distance) < Math.abs(prev.distance - wp.distance) ? curr : prev);
            }, data[0]);

            return {
                x: wp.distance,
                y: closestPoint ? closestPoint.elevation : 0,
                marker: {
                    size: 4,
                    fillColor: waypointColor,
                    strokeColor: '#fff',
                    strokeWidth: 2,
                    shape: 'circle',
                    radius: 2,
                },
                label: {
                    borderWidth: 0,
                    style: {
                        color: waypointColor,
                        background: 'transparent',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 5, // Push label up
                        }
                    },
                    text: wp.name,
                    offsetY: -10,
                }
            };
        });

        const chartOptions: ApexOptions = {
            chart: {
                id: 'elevation-chart',
                type: 'area',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: { enabled: true, speed: 500 },
                background: 'transparent',
                fontFamily: 'inherit',
            },
            colors: [accentColor],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.5,
                    opacityTo: 0.1,
                    stops: [0, 100],
                },
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            dataLabels: { enabled: false },
            grid: {
                borderColor: gridColor,
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { left: 10, right: 10 },
            },
            annotations: {
                points: waypointAnnotations,
                xaxis: [],
            },
            xaxis: {
                type: 'numeric',
                min: 0,
                max: maxDistance,
                labels: {
                    formatter: (val: number) => `${val.toFixed(0)} km`,
                    style: { fontSize: '10px', colors: labelColor },
                    rotate: 0,
                },
                tickAmount: 6,
                axisBorder: { show: false },
                axisTicks: { show: false },
                tooltip: { enabled: false },
            },
            yaxis: {
                min: Math.floor(minEle / 100) * 100,
                max: Math.ceil(maxEle / 100) * 100,
                labels: {
                    formatter: (val: number) => `${val}m`,
                    style: { fontSize: '10px', colors: labelColor },
                },
                tickAmount: 4,
            },
            tooltip: {
                enabled: true,
                theme: isDark ? 'dark' : 'light',
                x: {
                    formatter: (val: number) => `${val.toFixed(1)} km`,
                },
                y: { formatter: (val: number) => `${val} m` },
            },
            markers: { size: 0 },
        };

        return {
            options: chartOptions,
            series: [{ name: 'Elevation', data: chartData }],
        };
    }, [data, waypoints, isDark]);

    if (data.length === 0) {
        return null;
    }

    return (
        <div className={`w-full h-full min-h-0 ${className || ''}`}>
            <Chart
                key={`elevation-${waypoints.length}-${data.length}`}
                options={options}
                series={series}
                type="area"
                height="100%"
                width="100%"
            />
        </div>
    );
}
