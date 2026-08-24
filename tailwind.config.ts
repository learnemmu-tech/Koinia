import tailwindcssAnimate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";

import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '1.25rem',
  			md: '1.5rem',
  			lg: '2rem',
  		},
  		screens: {
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1400px',
  		},
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
                    ...fontFamily.sans
                ],
  			reading: [
  				'var(--font-geist-sans)',
  				'var(--font-sans)',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
                    ...fontFamily.mono
                ],
  			heading: [
  				'var(--font-heading)',
                    ...fontFamily.sans
                ],
  			script: [
  				'var(--font-script)',
  				'cursive'
  			]
  		},
  		fontSize: {
  			'fluid-xs': ['var(--text-xs)', { lineHeight: '1.4' }],
  			'fluid-sm': ['var(--text-sm)', { lineHeight: '1.5' }],
  			'fluid-base': ['var(--text-base)', { lineHeight: '1.6' }],
  			'fluid-lg': ['var(--text-lg)', { lineHeight: '1.5' }],
  			'fluid-xl': ['var(--text-xl)', { lineHeight: '1.4' }],
  			'fluid-2xl': ['var(--text-2xl)', { lineHeight: '1.3' }],
  			'fluid-3xl': ['var(--text-3xl)', { lineHeight: '1.2' }],
  			'fluid-4xl': ['var(--text-4xl)', { lineHeight: '1.15' }],
  		},
  		minHeight: {
  			touch: '2.75rem',
  		},
  		minWidth: {
  			touch: '2.75rem',
  		},
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
