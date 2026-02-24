import { useEffect, useMemo, useState } from 'react';
import { motion, useAnimationControls, useMotionValue, useSpring, useTransform } from 'framer-motion';

export type ProjectCardItem = {
  id: string;
  title: string;
  categories: string[];
  mockups: string[];
};

type ParallaxProjectCardProps = {
  projects: ProjectCardItem[];
  marqueeText?: string;
  rotationDuration?: number;
  className?: string;
};

const DEPTH_LAYERS = [30, 60, 90, 120];

export function ParallaxProjectCard({
  projects,
  marqueeText = 'SONIX',
  rotationDuration = 8,
  className = ''
}: ParallaxProjectCardProps) {
  const safeProjects = useMemo(() => projects.filter((p) => p.mockups.length > 0), [projects]);
  const [projectIndex, setProjectIndex] = useState(0);
  const currentProject = safeProjects[projectIndex];

  const controls = useAnimationControls();

  // Mouse tracking motion values
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Map pointer to tilt range: -10 to 10
  const rotateYRaw = useTransform(mouseX, [0, 1], [-10, 10]);
  const rotateXRaw = useTransform(mouseY, [0, 1], [10, -10]);

  // Smooth heavy spring feel
  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 150, damping: 20 });

  useEffect(() => {
    if (safeProjects.length <= 1) return;

    let active = true;

    const runFlipLoop = async () => {
      while (active) {
        await controls.start({
          rotateY: 360,
          transition: { duration: rotationDuration, ease: 'linear' }
        });

        if (!active) return;

        setProjectIndex((prev) => (prev + 1) % safeProjects.length);
        controls.set({ rotateY: 0 });
      }
    };

    runFlipLoop();

    return () => {
      active = false;
      controls.stop();
    };
  }, [controls, rotationDuration, safeProjects.length]);

  if (!currentProject) return null;

  return (
    <section className={`relative isolate w-full overflow-hidden rounded-3xl bg-[#f2f2f2] p-6 md:p-10 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden">
        <motion.div
          className="flex w-[200%]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
        >
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex min-w-[50%] items-center gap-8 whitespace-nowrap text-[clamp(64px,10vw,160px)] font-semibold uppercase leading-none text-transparent opacity-30 [text-shadow:0_0_0_transparent] [-webkit-text-stroke:1px_rgba(0,0,0,0.45)]"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i}>{marqueeText}</span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl" style={{ perspective: 1000 }}>
        <motion.div
          className="rounded-3xl bg-[#050505] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] md:p-6"
          style={{ rotateX, rotateY }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            mouseX.set(Math.min(1, Math.max(0, x)));
            mouseY.set(Math.min(1, Math.max(0, y)));
          }}
          onMouseLeave={() => {
            mouseX.set(0.5);
            mouseY.set(0.5);
          }}
        >
          <motion.div
            className="relative h-[300px] overflow-hidden rounded-2xl md:h-[500px]"
            style={{ transformStyle: 'preserve-3d' }}
            animate={controls}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1320] via-[#0a0f19] to-[#05070d]" />

            {currentProject.mockups.slice(0, 4).map((src, idx) => {
              const depth = DEPTH_LAYERS[idx] ?? 30;
              const positions = [
                'left-[6%] top-[20%] w-[48%]',
                'right-[8%] top-[10%] w-[36%]',
                'left-[30%] bottom-[6%] w-[44%]',
                'right-[20%] bottom-[12%] w-[30%]'
              ];

              return (
                <img
                  key={`${currentProject.id}-${src}-${idx}`}
                  src={src}
                  alt={`${currentProject.title} mockup ${idx + 1}`}
                  className={`absolute rounded-xl object-cover shadow-2xl ${positions[idx] ?? positions[0]}`}
                  style={{ transform: `translateZ(${depth}px)` }}
                />
              );
            })}
          </motion.div>

          <div className="mt-4 md:mt-6">
            <h3 className="text-xl font-semibold uppercase leading-tight text-[#f9fdfe] md:text-3xl">
              {currentProject.title}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentProject.categories.map((tag) => (
                <span
                  key={`${currentProject.id}-${tag}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-black md:text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Example dataset aligned with current Figma content.
export const selectedWorksSeed: ProjectCardItem[] = [
  {
    id: 'sonix',
    title: 'SONIX - Your Personal Space On Wheels',
    categories: ['UXD', 'UXR', 'Branding'],
    mockups: [
      '/assets/images/autonomous-vehicle.jpg',
      '/assets/images/sync.jpg',
      '/assets/images/google-nest.jpg',
      '/assets/images/7west.jpg'
    ]
  }
];
