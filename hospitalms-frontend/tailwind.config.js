/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { animation: { 'slide-in': 'slideIn 0.3s ease-out', 'scale-in': 'scaleIn 0.2s ease-out' }, keyframes: { slideIn: { from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } }, scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } } } } },
  plugins: [],
};
