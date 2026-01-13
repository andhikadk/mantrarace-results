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
        // Format data as [x, y] pairs for numeric x-axis
        const chartData = data.map((p) => ({
            x: p.distance,
            y: p.elevation,
        }));

        const elevations = data.map((p) => p.elevation);
        const minEle = Math.min(...elevations);
        const maxEle = Math.max(...elevations);
        const maxDistance = data[data.length - 1]?.distance || 0;

        // Create xaxis annotations for waypoints (vertical lines)
        const xaxisAnnotations = waypoints.map((wp) => ({
            x: wp.distance,
            borderColor: '#f00102',
            strokeDashArray: 0,
            label: {
                borderColor: '#f00102',
                borderWidth: 1,
                borderRadius: 2,
                text: wp.name,
                textAnchor: 'middle',
                position: 'top',
                orientation: 'horizontal',
                style: {
                    color: '#fff',
                    background: '#f00102',
                    fontSize: '9px',
                    fontWeight: '600',
                    padding: {
                        left: 4,
                        right: 4,
                        top: 2,
                        bottom: 2,
                    },
                },
            },
        }));

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
                xaxis: xaxisAnnotations,
            },
            xaxis: {
                type: 'numeric',
                min: 0,
                max: maxDistance,
                labels: {
                    formatter: (val: number) => `${val.toFixed(0)} km`,
                    style: { fontSize: '10px', colors: '#94a3b8' },
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
                    style: { fontSize: '10px', colors: '#94a3b8' },
                },
                tickAmount: 4,
            },
            tooltip: {
                enabled: true,
                theme: 'light',
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
    }, [data, waypoints]);

    if (data.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="h-[200px] md:h-[240px]">
                    <Chart
                        key={`elevation-${waypoints.length}-${data.length}`}
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
