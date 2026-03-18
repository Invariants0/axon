'use client';

import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type FeatureType = {
	title: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	description: string;
};

type FeatureCardProps = React.ComponentProps<'div'> & {
	feature: FeatureType;
};

export function FeatureCard({ feature, className, ...props }: FeatureCardProps) {
	// Memoize the pattern to prevent re-renders from changing it
	const p = useMemo(() => genRandomPattern(), []);

	return (
		<div className={cn(
            'relative overflow-hidden p-8 border-white/5 bg-black/20 backdrop-blur-sm transition-all duration-300 ease-in-out',
            'hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:z-30 group cursor-default',
            'hover:shadow-[0_0_40px_rgba(255,255,255,0.03)]',
            className
        )} {...props}>
			<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)] transition-opacity duration-300 group-hover:opacity-100 opacity-50">
				<div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
					<GridPattern
						width={20}
						height={20}
						x="-12"
						y="4"
						squares={p}
						className="fill-white/[0.03] stroke-white/10 absolute inset-0 h-full w-full mix-blend-overlay group-hover:fill-white/[0.07] transition-colors duration-300"
					/>
				</div>
			</div>
			<feature.icon className="text-white/60 size-8 mb-6 transition-all duration-300 group-hover:text-white group-hover:scale-110" strokeWidth={1.5} aria-hidden />
			<h3 className="text-lg font-bold text-white tracking-tight transition-colors duration-300">{feature.title}</h3>
			<p className="text-muted-foreground mt-3 text-sm leading-relaxed font-medium transition-colors duration-300 group-hover:text-white/80">
				{feature.description}
			</p>
		</div>
	);
}

function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
	const patternId = React.useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y], index) => (
						<rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
					))}
				</svg>
			)}
		</svg>
	);
}

function genRandomPattern(length?: number): number[][] {
	length = length ?? 7;
	return Array.from({ length }, () => [
		Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
		Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
	]);
}

type ViewAnimationProps = {
	delay?: number;
	className?: string;
	children: React.ReactNode;
};

export function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(8px)', y: 20, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ delay, duration: 0.8, ease: "easeOut" }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
