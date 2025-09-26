import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';

// Create and configure Chart.js instance
const configuredChartJS = ChartJS;

// Register components only once
if (!configuredChartJS.registered) {
  configuredChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
  );
  configuredChartJS.registered = true;
}

export default configuredChartJS;