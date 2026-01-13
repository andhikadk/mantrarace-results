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
}

export function ElevationChart({ data, waypoints = [] }: Props) {
    const { options, series } = useMemo(() => {
        const distances = data.map((p) => p.distance.toFixed(1));
        const elevations = data.map((p) => p.elevation);
        const minEle = Math.min(...elevations);
        const maxEle = Math.max(...elevations);

        // Create annotations for waypoints
        const waypointAnnotations = waypoints.map((wp) => {
            // Find closest elevation point index for this waypoint
            const closestIndex = data.reduce((prevIdx, curr, idx, arr) =>
                Math.abs(curr.distance - wp.distance) < Math.abs(arr[prevIdx].distance - wp.distance) ? idx : prevIdx
                , 0);

            return {
                x: distances[closestIndex],
                borderColor: '#100d67',
                label: {
                    borderColor: '#100d67',
                    style: {
                        color: '#fff',
                        background: '#100d67',
                        fontSize: '10px',
                        fontWeight: 'bold',
                    },
                    text: wp.name,
                    position: 'top' as const,
                },
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
            colors: ['#100d67'],
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
                borderColor: '#e2e8f0',
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { left: 10, right: 10 },
            },
            annotations: {
                xaxis: waypointAnnotations,
            },
            xaxis: {
                categories: distances,
                labels: {
                    formatter: (val: string) => `${val} km`,
                    style: { fontSize: '10px', colors: '#94a3b8' },
                    rotate: 0,
                    hideOverlappingLabels: true,
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
                    style: { fontSize: '10px', colors: '#94a3b8' },
                },
                tickAmount: 4,
            },
            tooltip: {
                enabled: true,
                theme: 'light',
                x: {
                    formatter: (_val: number, opts: { dataPointIndex: number }) =>
                        `${distances[opts.dataPointIndex]} km`,
                },
                y: { formatter: (val: number) => `${val} m` },
            },
            markers: { size: 0 },
        };

        return {
            options: chartOptions,
            series: [{ name: 'Elevation', data: elevations }],
        };
    }, [data, waypoints]);

    if (data.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">ELEVATION PROFILE</div>
                    {waypoints.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                            {waypoints.length} checkpoint{waypoints.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
                <div className="h-[120px] md:h-[150px]">
                    <Chart
                        options={options}
                        series={series}
                        type="area"
                        height="100%"
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
}
