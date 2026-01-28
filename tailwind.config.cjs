module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './widget-runtime.tsx',
    './constants.ts'
  ],
  theme: {
    extend: {
      keyframes: {
        'ql-modal-pop': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ql-shine': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'ql-modal-pop': 'ql-modal-pop 0.4s ease-out',
        'ql-shine': 'ql-shine 3s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    }
  },
  plugins: []
};
